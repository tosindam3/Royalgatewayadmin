<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\AttendanceRecord;
use App\Models\LeaveRequest;
use App\Models\ApprovalRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AiAdvisorService
{
    private bool $geminiEnabled;
    private ?string $geminiKey;

    public function __construct()
    {
        $this->geminiKey    = config('services.gemini.key');
        $this->geminiEnabled = !empty($this->geminiKey);
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    public function getBriefing(string $role, int $userId, ?int $employeeId): array
    {
        $cacheKey = "ai_briefing_{$userId}_" . now()->format('Y-m-d');

        return Cache::remember($cacheKey, now()->addHours(6), function () use ($role, $employeeId) {
            $orgContext = $this->buildOrgContext();
            $insights   = $this->generateInsights($role, $orgContext, $employeeId);

            if ($this->geminiEnabled) {
                $insights = $this->enrichWithGemini($insights, $role, $orgContext);
            }

            return [
                'insights'       => $insights,
                'health_score'   => $this->computeHealthScore($orgContext),
                'gemini_enabled' => $this->geminiEnabled,
                'generated_at'   => now()->toIso8601String(),
            ];
        });
    }

    public function chat(string $message, array $history, string $role, ?int $employeeId): string
    {
        if (!$this->geminiEnabled) {
            return 'Gemini is not configured. Please add GEMINI_API_KEY to the backend .env to enable chat.';
        }

        $orgContext = $this->buildOrgContext();
        $systemPrompt = $this->buildSystemPrompt($role, $orgContext, $employeeId);

        $contents = [];
        foreach ($history as $h) {
            $contents[] = ['role' => $h['role'], 'parts' => [['text' => $h['content']]]];
        }
        $contents[] = ['role' => 'user', 'parts' => [['text' => $message]]];

        $response = Http::withHeaders(['Content-Type' => 'application/json'])
            ->timeout(30)
            ->post(config('services.gemini.url') . '/' . config('services.gemini.model') . ':generateContent?key=' . $this->geminiKey, [
                'system_instruction' => ['parts' => [['text' => $systemPrompt]]],
                'contents'           => $contents,
                'generationConfig'   => ['temperature' => 0.7, 'maxOutputTokens' => 1024],
            ]);

        if ($response->failed()) {
            return 'I encountered an issue reaching the AI service. Please try again.';
        }

        return data_get($response->json(), 'candidates.0.content.parts.0.text', 'No response received.');
    }

    public function getTrends(): array
    {
        return Cache::remember('ai_trends', now()->addHours(6), function () {
            $news = $this->fetchNews();
            return [
                'news'         => $news,
                'hr_insights'  => $this->staticHrInsights(),
                'fetched_at'   => now()->toIso8601String(),
            ];
        });
    }

    // -------------------------------------------------------------------------
    // Org Context Builder
    // -------------------------------------------------------------------------

    private function buildOrgContext(): array
    {
        $today = Carbon::today();

        $totalEmployees = Employee::where('status', 'active')->count();
        $presentToday   = AttendanceRecord::whereDate('attendance_date', $today)
            ->whereIn('status', ['present', 'late'])->count();
        $onLeave        = LeaveRequest::where('status', 'approved')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)->count();
        $pendingApprovals = ApprovalRequest::where('status', 'pending')->count();

        $terminated = Employee::where('status', 'terminated')
            ->where('updated_at', '>=', Carbon::now()->subYear())->count();
        $turnoverRate = $totalEmployees > 0 ? round(($terminated / max($totalEmployees, 1)) * 100, 1) : 0;

        $attendanceRate = $totalEmployees > 0
            ? round((($presentToday + $onLeave) / $totalEmployees) * 100, 1) : 0;

        // Headcount trend (last 3 months)
        $headcountTrend = [];
        for ($i = 2; $i >= 0; $i--) {
            $m = Carbon::now()->subMonths($i);
            $headcountTrend[] = [
                'month' => $m->format('M'),
                'count' => Employee::where('status', 'active')
                    ->where('created_at', '<=', $m->endOfMonth())->count(),
            ];
        }

        $avgDelta = count($headcountTrend) >= 2
            ? round(($headcountTrend[2]['count'] - $headcountTrend[0]['count']) / 2, 1)
            : 0;

        // Performance average
        $perfAvg = DB::table('performance_submissions')
            ->where('status', 'submitted')
            ->avg('total_score') ?? 0;

        // Absenteeism
        $absentToday = max(0, $totalEmployees - $presentToday - $onLeave);
        $absenteeismRate = $totalEmployees > 0 ? round(($absentToday / $totalEmployees) * 100, 1) : 0;

        return compact(
            'totalEmployees', 'presentToday', 'onLeave', 'pendingApprovals',
            'turnoverRate', 'attendanceRate', 'absenteeismRate',
            'headcountTrend', 'avgDelta', 'perfAvg', 'absentToday'
        );
    }

    // -------------------------------------------------------------------------
    // Health Score
    // -------------------------------------------------------------------------

    private function computeHealthScore(array $ctx): int
    {
        $attendance  = min(100, $ctx['attendanceRate']) * 0.30;
        $retention   = min(100, max(0, 100 - ($ctx['turnoverRate'] * 2))) * 0.25;
        $performance = min(100, (float)$ctx['perfAvg']) * 0.30;
        $approvals   = min(100, max(0, 100 - ($ctx['pendingApprovals'] * 2))) * 0.15;

        return (int) round($attendance + $retention + $performance + $approvals);
    }

    // -------------------------------------------------------------------------
    // Rule-Based Insight Generator
    // -------------------------------------------------------------------------

    private function generateInsights(string $role, array $ctx, ?int $employeeId): array
    {
        $insights = [];

        // --- DESCRIPTIVE ---
        $insights[] = $this->insight(
            'descriptive',
            $ctx['attendanceRate'] >= 80 ? 'positive' : ($ctx['attendanceRate'] >= 65 ? 'warning' : 'critical'),
            "Attendance Rate: {$ctx['attendanceRate']}%",
            "{$ctx['presentToday']} of {$ctx['totalEmployees']} employees are present today. {$ctx['onLeave']} are on approved leave.",
            "Attendance rate is " . ($ctx['attendanceRate'] >= 80 ? 'healthy' : 'below target') . ". Target is 80%+.",
            $ctx['attendanceRate'] < 80 ? ['label' => 'View Attendance', 'href' => '/attendance'] : null
        );

        $insights[] = $this->insight(
            'descriptive',
            $ctx['pendingApprovals'] > 25 ? 'critical' : ($ctx['pendingApprovals'] > 10 ? 'warning' : 'info'),
            "Pending Approvals: {$ctx['pendingApprovals']}",
            "There are {$ctx['pendingApprovals']} requests awaiting action in the approval queue.",
            null,
            $ctx['pendingApprovals'] > 0 ? ['label' => 'Review Approvals', 'href' => '/approvals'] : null
        );

        // --- DIAGNOSTIC ---
        if ($ctx['absenteeismRate'] > 10) {
            $insights[] = $this->insight(
                'diagnostic',
                $ctx['absenteeismRate'] > 20 ? 'critical' : 'warning',
                "Absenteeism Alert: {$ctx['absenteeismRate']}%",
                "{$ctx['absentToday']} employees are absent without leave today — above the 10% threshold.",
                "High absenteeism often correlates with low morale, burnout, or external factors. Consider a pulse survey.",
                ['label' => 'View Attendance', 'href' => '/attendance']
            );
        }

        if ($ctx['turnoverRate'] > 8) {
            $insights[] = $this->insight(
                'diagnostic',
                $ctx['turnoverRate'] > 15 ? 'critical' : 'warning',
                "Turnover Rate: {$ctx['turnoverRate']}%",
                "Turnover is above the 8% healthy threshold. This may indicate retention issues.",
                "Review exit interview data and consider stay interviews with at-risk employees.",
                ['label' => 'View Employees', 'href' => '/employees']
            );
        }

        if ((float)$ctx['perfAvg'] > 0 && (float)$ctx['perfAvg'] < 60) {
            $insights[] = $this->insight(
                'diagnostic',
                (float)$ctx['perfAvg'] < 45 ? 'critical' : 'warning',
                "Performance Average: " . round((float)$ctx['perfAvg'], 1) . "%",
                "Organisation-wide performance average is below the 60% target.",
                "Consider reviewing performance templates, providing coaching resources, or launching a development programme.",
                ['label' => 'View Performance', 'href' => '/performance']
            );
        }

        // --- PREDICTIVE ---
        if ($ctx['avgDelta'] != 0) {
            $projected = $ctx['totalEmployees'] + ($ctx['avgDelta'] * 3);
            $direction = $ctx['avgDelta'] > 0 ? 'grow' : 'shrink';
            $insights[] = $this->insight(
                'predictive',
                $ctx['avgDelta'] < -2 ? 'warning' : 'info',
                "Headcount Projection: ~" . round($projected) . " in 3 months",
                "Based on the last 3 months trend, headcount is expected to {$direction} by ~" . abs($ctx['avgDelta']) . " per month.",
                $ctx['avgDelta'] < 0 ? "Declining headcount may impact operational capacity. Review hiring pipeline." : "Growth trajectory is positive. Ensure onboarding capacity is ready.",
                null
            );
        }

        $projectedTurnover = round($ctx['turnoverRate'] * 1.1, 1);
        if ($ctx['turnoverRate'] > 5) {
            $insights[] = $this->insight(
                'predictive',
                $projectedTurnover > 15 ? 'critical' : 'warning',
                "Turnover Risk: ~{$projectedTurnover}% projected",
                "If current trends continue, turnover could reach {$projectedTurnover}% over the next quarter.",
                "Proactive retention measures now are significantly cheaper than replacement costs.",
                null
            );
        }

        // --- PRESCRIPTIVE ---
        if ($ctx['pendingApprovals'] > 10) {
            $insights[] = $this->insight(
                'prescriptive',
                'warning',
                "Clear Approval Backlog",
                "Action the {$ctx['pendingApprovals']} pending requests to unblock employees and maintain trust.",
                "Approval delays negatively impact employee experience and can increase leave abuse.",
                ['label' => 'Go to Approvals', 'href' => '/approvals']
            );
        }

        if ($ctx['absenteeismRate'] > 15) {
            $insights[] = $this->insight(
                'prescriptive',
                'critical',
                "Launch Wellness Check-In",
                "Absenteeism is critically high. Schedule team check-ins and consider an anonymous pulse survey.",
                "Early intervention reduces long-term absenteeism by up to 40% according to HR research.",
                null
            );
        }

        if ($ctx['turnoverRate'] > 8) {
            $insights[] = $this->insight(
                'prescriptive',
                'warning',
                "Initiate Stay Interviews",
                "Identify employees at risk of leaving and schedule informal stay interviews.",
                "Stay interviews are more effective than exit interviews — they prevent the departure rather than document it.",
                ['label' => 'View Employees', 'href' => '/employees']
            );
        }

        // Employee-specific insights
        if ($role === 'employee' && $employeeId) {
            $insights = array_merge($insights, $this->employeeInsights($employeeId));
        }

        return $insights;
    }

    // -------------------------------------------------------------------------
    // Employee Personal Insights
    // -------------------------------------------------------------------------

    private function employeeInsights(int $employeeId): array
    {
        $insights = [];
        $startOfMonth = Carbon::now()->startOfMonth();
        $today = Carbon::today();

        $records = AttendanceRecord::where('employee_id', $employeeId)
            ->whereBetween('attendance_date', [$startOfMonth, $today])->get();

        $present = $records->whereIn('status', ['present', 'partial'])->count();
        $absent  = $records->where('status', 'absent')->count();
        $late    = $records->where('late_minutes', '>', 0)->count();

        if ($late >= 3) {
            $insights[] = $this->insight(
                'diagnostic', 'warning',
                "Punctuality Pattern Detected",
                "You've been late {$late} times this month. This may affect your performance evaluation.",
                "Consider adjusting your commute schedule or speaking with your manager about flexible start times.",
                null
            );
        }

        if ($absent >= 3) {
            $insights[] = $this->insight(
                'diagnostic', 'warning',
                "Absence Pattern This Month",
                "You have {$absent} unplanned absences this month.",
                "If you're experiencing challenges, consider speaking with HR about support options.",
                null
            );
        }

        // Leave balance check
        $leaveBalance = DB::table('leave_balances')
            ->where('employee_id', $employeeId)
            ->where('year', now()->year)
            ->sum('available');

        if ($leaveBalance > 15) {
            $insights[] = $this->insight(
                'prescriptive', 'info',
                "You Have {$leaveBalance} Leave Days Remaining",
                "Consider planning time off to avoid losing unused leave at year end.",
                "Regular breaks improve productivity and reduce burnout risk.",
                ['label' => 'Apply for Leave', 'href' => '/leave']
            );
        }

        // Career development
        $perfScore = DB::table('performance_submissions')
            ->where('employee_id', $employeeId)
            ->where('status', 'submitted')
            ->orderByDesc('created_at')
            ->value('total_score');

        if ($perfScore !== null) {
            $insights[] = $this->insight(
                'prescriptive', $perfScore >= 75 ? 'positive' : 'info',
                "Career Development Recommendation",
                $perfScore >= 75
                    ? "Your performance score of {$perfScore}% is strong. You may be ready for a senior role or mentorship opportunity."
                    : "Your current score is {$perfScore}%. Focus on the lowest-weighted areas in your evaluation to improve efficiently.",
                "Consistent improvement over 2 cycles typically qualifies employees for promotion consideration.",
                ['label' => 'View My Performance', 'href' => '/performance']
            );
        }

        return $insights;
    }

    // -------------------------------------------------------------------------
    // Gemini Enrichment
    // -------------------------------------------------------------------------

    private function enrichWithGemini(array $insights, string $role, array $ctx): array
    {
        $summaryData = [
            'total_employees'   => $ctx['totalEmployees'],
            'attendance_rate'   => $ctx['attendanceRate'],
            'turnover_rate'     => $ctx['turnoverRate'],
            'absenteeism_rate'  => $ctx['absenteeismRate'],
            'pending_approvals' => $ctx['pendingApprovals'],
            'performance_avg'   => round((float)$ctx['perfAvg'], 1),
        ];

        $prompt = "You are an expert HR analytics advisor. Given this organisation data: " . json_encode($summaryData) .
            "\nRewrite the following insight summaries to be more natural, empathetic, and actionable for a {$role}. " .
            "Return a JSON array with the same structure but improved 'summary' and 'detail' fields only. Keep all other fields identical.\n\n" .
            json_encode(array_map(fn($i) => ['id' => $i['id'], 'summary' => $i['summary'], 'detail' => $i['detail']], $insights));

        try {
            $response = Http::withHeaders(['Content-Type' => 'application/json'])
                ->timeout(20)
                ->post(config('services.gemini.url') . '/' . config('services.gemini.model') . ':generateContent?key=' . $this->geminiKey, [
                    'contents'         => [['role' => 'user', 'parts' => [['text' => $prompt]]]],
                    'generationConfig' => ['temperature' => 0.4, 'maxOutputTokens' => 2048],
                ]);

            if ($response->successful()) {
                $text = data_get($response->json(), 'candidates.0.content.parts.0.text', '');
                // Strip markdown code fences if present
                $text = preg_replace('/^```json\s*/m', '', $text);
                $text = preg_replace('/^```\s*/m', '', $text);
                $enriched = json_decode(trim($text), true);

                if (is_array($enriched)) {
                    $map = collect($enriched)->keyBy('id');
                    foreach ($insights as &$insight) {
                        if ($map->has($insight['id'])) {
                            $e = $map[$insight['id']];
                            if (!empty($e['summary'])) $insight['summary'] = $e['summary'];
                            if (!empty($e['detail']))  $insight['detail']  = $e['detail'];
                        }
                    }
                }
            }
        } catch (\Throwable $e) {
            // Silently fall back to rule-based insights
        }

        return $insights;
    }

    // -------------------------------------------------------------------------
    // System Prompt for Chat
    // -------------------------------------------------------------------------

    private function buildSystemPrompt(string $role, array $ctx, ?int $employeeId): string
    {
        $data = json_encode([
            'total_employees'   => $ctx['totalEmployees'],
            'present_today'     => $ctx['presentToday'],
            'on_leave'          => $ctx['onLeave'],
            'attendance_rate'   => $ctx['attendanceRate'] . '%',
            'absenteeism_rate'  => $ctx['absenteeismRate'] . '%',
            'turnover_rate'     => $ctx['turnoverRate'] . '%',
            'pending_approvals' => $ctx['pendingApprovals'],
            'performance_avg'   => round((float)$ctx['perfAvg'], 1) . '%',
        ]);

        $personas = [
            'super_admin' => 'You are an executive-level strategic HR advisor for the CEO. Provide concise, data-driven insights with strategic implications.',
            'admin'       => 'You are an HR analytics expert. Provide operational insights, workforce diagnostics, and actionable HR recommendations.',
            'manager'     => 'You are a team performance coach. Focus on team dynamics, attendance patterns, and practical management advice.',
            'employee'    => 'You are a supportive career development counsellor. Provide personal growth advice, performance coaching, and wellness guidance.',
        ];

        $persona = $personas[$role] ?? $personas['employee'];

        return "{$persona}\n\nCurrent organisation data (do not share raw numbers unless asked): {$data}\n\n" .
            "Keep responses concise (under 200 words), warm, and actionable. Never fabricate data not provided.";
    }

    // -------------------------------------------------------------------------
    // External News
    // -------------------------------------------------------------------------

    private function fetchNews(): array
    {
        $newsKey = config('services.newsapi.key');
        if (empty($newsKey)) {
            return $this->staticNewsPlaceholders();
        }

        try {
            $response = Http::timeout(10)->get(config('services.newsapi.url') . '/top-headlines', [
                'apiKey'   => $newsKey,
                'q'        => 'HR workforce management talent',
                'language' => 'en',
                'pageSize' => 5,
            ]);

            if ($response->successful()) {
                return collect($response->json('articles', []))
                    ->take(5)
                    ->map(fn($a) => [
                        'title'       => $a['title'] ?? '',
                        'description' => $a['description'] ?? '',
                        'url'         => $a['url'] ?? '',
                        'source'      => $a['source']['name'] ?? '',
                        'published'   => $a['publishedAt'] ?? '',
                    ])
                    ->values()
                    ->toArray();
            }
        } catch (\Throwable $e) {
            // Fall through to placeholders
        }

        return $this->staticNewsPlaceholders();
    }

    private function staticNewsPlaceholders(): array
    {
        return [
            ['title' => 'The Rise of Skills-Based Hiring in 2025', 'description' => 'Organisations are shifting from credential-based to skills-based hiring to widen talent pools.', 'url' => '#', 'source' => 'HR Insights', 'published' => now()->subDays(1)->toDateString()],
            ['title' => 'Employee Wellbeing as a Retention Strategy', 'description' => 'Companies investing in mental health programmes see 30% lower turnover rates.', 'url' => '#', 'source' => 'Workforce Today', 'published' => now()->subDays(2)->toDateString()],
            ['title' => 'AI in HR: Automating the Routine, Humanising the Rest', 'description' => 'AI tools are handling administrative HR tasks, freeing HR teams for strategic work.', 'url' => '#', 'source' => 'HR Tech Weekly', 'published' => now()->subDays(3)->toDateString()],
            ['title' => 'Flexible Work Policies Drive Talent Attraction', 'description' => 'Hybrid and remote options remain top factors in candidate decision-making.', 'url' => '#', 'source' => 'Talent Quarterly', 'published' => now()->subDays(4)->toDateString()],
            ['title' => 'Performance Management Trends: Continuous Feedback Wins', 'description' => 'Annual reviews are giving way to real-time feedback loops and quarterly check-ins.', 'url' => '#', 'source' => 'People Management', 'published' => now()->subDays(5)->toDateString()],
        ];
    }

    private function staticHrInsights(): array
    {
        return [
            ['category' => 'Retention', 'insight' => 'Organisations with structured onboarding programmes see 50% higher new hire retention.'],
            ['category' => 'Performance', 'insight' => 'Regular 1:1 check-ins (weekly or bi-weekly) correlate with 25% higher performance scores.'],
            ['category' => 'Attendance', 'insight' => 'Flexible start times reduce Monday absenteeism by up to 18% in knowledge-work environments.'],
            ['category' => 'Hiring', 'insight' => 'Internal mobility programmes reduce time-to-fill by 40% and improve retention by 30%.'],
            ['category' => 'Wellbeing', 'insight' => 'Employees who take regular leave are 31% more productive than those who do not.'],
        ];
    }

    // -------------------------------------------------------------------------
    // Helper
    // -------------------------------------------------------------------------

    private function insight(string $type, string $severity, string $headline, string $summary, ?string $detail = null, ?array $action = null): array
    {
        return [
            'id'       => uniqid($type . '_'),
            'type'     => $type,
            'severity' => $severity,
            'headline' => $headline,
            'summary'  => $summary,
            'detail'   => $detail,
            'action'   => $action,
        ];
    }
}
