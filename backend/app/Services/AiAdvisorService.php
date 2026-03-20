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
use Gemini\Laravel\Facades\Gemini;
use Gemini\Data\Content;
use Gemini\Data\Part;
use Gemini\Data\Tool;
use Gemini\Data\FunctionDeclaration;
use Gemini\Data\FunctionResponse;
use Gemini\Data\Schema;
use Gemini\Enums\DataType;
use Gemini\Enums\Role;

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
        $cacheKey = "ai_briefing_v2_{$userId}_" . now()->format('Y-m-d');

        // Check if we have a cached version
        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        // Otherwise generate rule-based instantly
        $orgContext = $this->buildOrgContext();
        $insights   = $this->generateInsights($role, $orgContext, $employeeId);

        return [
            'insights'       => $insights,
            'health_score'   => $this->computeHealthScore($orgContext),
            'gemini_enabled' => $this->geminiEnabled,
            'generated_at'   => now()->toIso8601String(),
            'is_enriched'    => false, // Flag for frontend to know it's waiting for WebSocket
            'org_context'    => $orgContext, // Pass context back to controller for job dispatch
        ];
    }

    public function chat(string $message, array $history, string $role, ?int $employeeId): string
    {
        if (!$this->geminiEnabled) {
            return 'Gemini is not configured. Please add GEMINI_API_KEY to the backend .env to enable chat.';
        }

        $orgContext = $this->buildOrgContext();
        $systemPrompt = $this->buildSystemPrompt($role, $orgContext, $employeeId);

        $model = Gemini::generativeModel(config('services.gemini.flash_model'))
            ->withSystemInstruction(Content::parse($systemPrompt))
            ->withTool($this->getTools());

        $contents = [];
        foreach ($history as $h) {
            $contents[] = Content::parse($h['content'], $h['role'] === 'model' ? Role::MODEL : Role::USER);
        }

        $chat = $model->startChat(history: $contents);
        $response = $chat->sendMessage($message);

        // Check if the model wants to call a function
        $iteration = 0;
        while ($response->candidates[0]->content->parts[0]->functionCall !== null && $iteration < 5) {
            $iteration++;
            $functionCall = $response->candidates[0]->content->parts[0]->functionCall;
            
            $result = $this->callFunction($functionCall->name, $functionCall->args);
            
            // Send the result back as a FunctionResponse
            $response = $chat->sendMessage(new Part(
                functionResponse: new FunctionResponse(
                    name: $functionCall->name,
                    response: $result
                )
            ));
        }

        return $response->text() ?: 'No response received from the advisor.';
    }

    public function streamChat(string $message, array $history, string $role, ?int $employeeId)
    {
        if (!$this->geminiEnabled) {
            yield "data: " . json_encode(['error' => 'Gemini not configured']) . "\n\n";
            return;
        }

        $orgContext = $this->buildOrgContext();
        $systemPrompt = $this->buildSystemPrompt($role, $orgContext, $employeeId);

        $model = Gemini::generativeModel(config('services.gemini.flash_model'))
            ->withSystemInstruction(Content::parse($systemPrompt))
            ->withTool($this->getTools());

        $contents = [];
        foreach ($history as $h) {
            $contents[] = Content::parse($h['content'], $h['role'] === 'model' ? Role::MODEL : Role::USER);
        }

        $chat = $model->startChat(history: $contents);
        
        try {
            $response = $chat->sendMessage($message);

            // Handle Function Calling Loop (Up to 5 iterations for safety)
            $iteration = 0;
            while ($response->candidates[0]->content->parts[0]->functionCall !== null && $iteration < 5) {
                $iteration++;
                $functionCall = $response->candidates[0]->content->parts[0]->functionCall;
                $result = $this->callFunction($functionCall->name, $functionCall->args);
                
                // Submit the function result and get the next response
                $response = $chat->sendMessage(new Part(
                    functionResponse: new FunctionResponse(
                        name: $functionCall->name,
                        response: $result
                    )
                ));
            }

            // Now that we have the final text (or if there was no function call), stream the final response if possible
            // Note: Currently, we've already received the FULL text from the final turn in $response->text().
            // To provide a "streaming" feel after a tool call, we can yield this final text in chunks.
            // Or, ideally, we should use streamSendMessage if the SDK supports it.
            
            $text = $response->text();
            if ($text) {
                $chunks = str_split($text, 32); // Split into small chunks for simulated streaming feel
                foreach ($chunks as $chunk) {
                    yield "data: " . json_encode(['text' => $chunk]) . "\n\n";
                    usleep(10000); // 10ms delay for smooth typing
                }
            }

        } catch (\Throwable $e) {
            \Log::error("Gemini Stream Error: " . $e->getMessage());
            yield "data: " . json_encode(['error' => 'The AI advisor encountered an issue. Please try again.']) . "\n\n";
        }
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
    // Utilities for Jobs
    // -------------------------------------------------------------------------

    public function buildOrgContext(): array
    {
        return Cache::remember('ai_advisor_org_context', 3600, function() {
            $today = Carbon::today();
            $lastMonth = Carbon::now()->subMonth();

            $totalEmployees = Employee::where('status', 'active')->count();
            $presentToday   = AttendanceRecord::whereDate('attendance_date', $today)
                ->whereIn('status', ['present', 'late'])->count();
            $onLeave        = LeaveRequest::where('status', 'approved')
                ->whereDate('start_date', '<=', $today)
                ->whereDate('end_date', '>=', $today)->count();
            
            $pendingApprovals = ApprovalRequest::where('status', 'pending')->count();

            // Financial & Absenteeism Analysis
            $absentToday = max(0, $totalEmployees - $presentToday - $onLeave);
            $absenteeismRate = $totalEmployees > 0 ? round(($absentToday / $totalEmployees) * 100, 1) : 0;
            
            // Calculate "Revenue Leakage" (Estimated daily cost of absenteeism)
            // Assuming an average daily rate if salary data is sparse
            $avgDailyRate = DB::table('employee_salaries')->avg('base_salary') / 22 ?? 5000; 
            $dailyLeakage = $absentToday * $avgDailyRate;

            // Performance Correlation
            $perfAvg = DB::table('performance_submissions')->where('status', 'submitted')->avg('score') ?? 0;
            $prevPerfAvg = DB::table('performance_submissions')
                ->where('status', 'submitted')
                ->where('submitted_at', '<', $lastMonth)
                ->avg('score') ?? 0;
            $perfTrend = round($perfAvg - $prevPerfAvg, 1);

            // Attendance Rate for UI
            $attendanceRate = $totalEmployees > 0 
                ? round((($presentToday + $onLeave) / $totalEmployees) * 100, 1) : 0;
            
            return compact(
                'totalEmployees', 'presentToday', 'onLeave', 'pendingApprovals',
                'absenteeismRate', 'attendanceRate', 'perfAvg', 'perfTrend', 'dailyLeakage', 'absentToday'
            );
        });
    }

    private function buildXmlContext(array $ctx): string
    {
        $xml = "<hr360_context>\n";
        $xml .= "  <workforce_metrics>\n";
        $xml .= "    <total_headcount>{$ctx['totalEmployees']}</total_headcount>\n";
        $xml .= "    <attendance_health>\n";
        $xml .= "      <present_today>{$ctx['presentToday']}</present_today>\n";
        $xml .= "      <absenteeism_rate>{$ctx['absenteeismRate']}%</absenteeism_rate>\n";
        $xml .= "      <estimated_daily_leakage>" . number_format($ctx['dailyLeakage'], 2) . "</estimated_daily_leakage>\n";
        $xml .= "    </attendance_health>\n";
        $xml .= "    <performance_metrics>\n";
        $xml .= "      <org_average_score>{$ctx['perfAvg']}%</org_average_score>\n";
        $xml .= "      <monthly_trend_delta>" . ($ctx['perfTrend'] >= 0 ? '+' : '') . "{$ctx['perfTrend']}%</monthly_trend_delta>\n";
        $xml .= "    </performance_metrics>\n";
        $xml .= "  </workforce_metrics>\n";
        $xml .= "</hr360_context>";
        return $xml;
    }

    // -------------------------------------------------------------------------
    // Health Score
    // -------------------------------------------------------------------------

    public function computeHealthScorePub(array $ctx): int
    {
        return $this->computeHealthScore($ctx);
    }

    private function computeHealthScore(array $ctx): int
    {
        $attendance  = min(100, (100 - $ctx['absenteeismRate'])) * 0.35;
        $performance = min(100, (float)$ctx['perfAvg']) * 0.40;
        $stability   = ($ctx['perfTrend'] >= 0 ? 15 : 5); // Stability bonus
        $ops         = min(10, max(0, 10 - ($ctx['pendingApprovals'] / 5))) ; 

        return (int) round($attendance + $performance + $stability + $ops);
    }

    // -------------------------------------------------------------------------
    // Rule-Based Insight Generator
    // -------------------------------------------------------------------------

    public function generateInsights(string $role, array $ctx, ?int $employeeId): array
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

        // --- FINANCIAL IMPACT (PRESCRIPTIVE) ---
        if ($ctx['dailyLeakage'] > 50000) {
            $insights[] = $this->insight(
                'prescriptive',
                'critical',
                "Financial Leakage detected: " . number_format($ctx['dailyLeakage'], 0) . " daily",
                "High absenteeism today is costing the organization an estimated " . number_format($ctx['dailyLeakage'], 0) . " in unproductive payroll.",
                "Review attendance policies for high-leakage departments and consider incentive-based attendance bonuses.",
                ['label' => 'View Payroll Analysis', 'href' => '/payroll']
            );
        }

        // --- STRATEGIC GROWTH (PREDICTIVE) ---
        if ($ctx['perfTrend'] > 5) {
            $insights[] = $this->insight(
                'predictive',
                'positive',
                "Organization Performance is Accelerating",
                "Overall performance increased by " . abs($ctx['perfTrend']) . "% this month. This is a strong signal for expansion.",
                "This is the ideal time to launch new projects or scale high-performing teams while talent momentum is high.",
                ['label' => 'Strategic Planning', 'href' => '/performance']
            );
        } elseif ($ctx['perfTrend'] < -5) {
            $insights[] = $this->insight(
                'predictive',
                'critical',
                "Performance Downturn Detected",
                "Average scores dropped by " . abs($ctx['perfTrend']) . "%. This often precedes a drop in organizational profitability.",
                "Investigate if this is due to seasonal burnout, lack of resources, or management shifts.",
                ['label' => 'Review Analytics', 'href' => '/performance']
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

        // Career development with trend
        $perfSubmissions = DB::table('performance_submissions')
            ->where('employee_id', $employeeId)
            ->where('status', 'submitted')
            ->orderByDesc('submitted_at')
            ->limit(2)
            ->get();

        if ($perfSubmissions->count() > 0) {
            $currentScore = $perfSubmissions[0]->score;
            $previousScore = $perfSubmissions->count() > 1 ? $perfSubmissions[1]->score : $currentScore;
            $trendDelta = $currentScore - $previousScore;

            $status = $currentScore >= 75 ? 'positive' : 'info';
            $trendText = $trendDelta > 0 ? "improving by {$trendDelta}%" : ($trendDelta < 0 ? "declining by " . abs($trendDelta) . "%" : "steady");

            $insights[] = $this->insight(
                'prescriptive', $status,
                "Career Path Analysis",
                "Your current performance is {$currentScore}%, which is {$trendText} compared to your last cycle.",
                $currentScore >= 75 
                    ? "You are on a high-growth trajectory. Consider discussing leadership roles or specialized certifications in your next 1:1."
                    : "Focus on closing the gaps identified in your latest feedback to reverse the downward trend and regain promotion eligibility.",
                ['label' => 'View My History', 'href' => '/performance']
            );
        }

        return $insights;
    }

    // -------------------------------------------------------------------------
    // Gemini Enrichment
    // -------------------------------------------------------------------------

    public function enrichWithGeminiSafe(array $insights, string $role, array $ctx): array
    {
        return $this->enrichWithGemini($insights, $role, $ctx);
    }

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

        $model = Gemini::generativeModel(config('services.gemini.pro_model'));

        try {
            $response = $model->generateContent($prompt);
            $text = $response->text();
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
            } else {
                \Log::error("AI Advisor: Gemini returned invalid JSON schema", [
                    'user_id' => auth()->id(),
                    'response' => $text
                ]);
            }
        } catch (\Throwable $e) {
            \Log::error("AI Advisor enrichment error: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
        }

        return $insights;
    }

    // -------------------------------------------------------------------------
    // System Prompt for Chat
    // -------------------------------------------------------------------------

    private function buildSystemPrompt(string $role, array $ctx, ?int $employeeId): string
    {
        $xmlContext = $this->buildXmlContext($ctx);

        return "### ROLE\nYou are the \"HR360 Intelligent Advisor,\" a senior HR consultant embedded within the HR360 management suite. Your goal is to provide data-driven, empathetic, and legally-compliant HR advice.\n\n" .
            "### CONTEXT\n" .
            "{$xmlContext}\n\n" .
            "### OPERATIONAL GUIDELINES\n" .
            "1. **Data Accuracy:** Only provide advice based on the data provided in the <context> tags. If data is missing, ask for it.\n" .
            "2. **Compliance First:** Always include a standard disclaimer for legal implications.\n" .
            "3. **Actionable Insights:** Suggest the \"Next Best Action.\"\n" .
            "4. **Formatting:** Use Markdown, bolding, and bullet points.\n\n" .
            "### GUARDRAILS\n" .
            "- NEVER reveal individual salaries to others.\n" .
            "- NEVER provide personal medical details.\n" .
            "- Politely redirect non-HR queries.";
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
    // -------------------------------------------------------------------------
    // Function Calling (Tools)
    // -------------------------------------------------------------------------

    private function getTools(): Tool
    {
        return new Tool(
            functionDeclarations: [
                new FunctionDeclaration(
                    name: 'get_employee_profile',
                    description: 'Get basic profile information for an employee including department and designation.',
                    parameters: new Schema(
                        type: DataType::OBJECT,
                        properties: [
                            'employee_id' => new Schema(type: DataType::INTEGER, description: 'The unique ID of the employee.')
                        ],
                        required: ['employee_id']
                    )
                ),
                new FunctionDeclaration(
                    name: 'get_leave_balances',
                    description: 'Get the current leave balances (Sick, Annual, etc.) for a specific employee.',
                    parameters: new Schema(
                        type: DataType::OBJECT,
                        properties: [
                            'employee_id' => new Schema(type: DataType::INTEGER, description: 'The unique ID of the employee.')
                        ],
                        required: ['employee_id']
                    )
                ),
                new FunctionDeclaration(
                    name: 'get_attendance_stats',
                    description: 'Get attendance percentage and absenteeism count for an employee over a specific period.',
                    parameters: new Schema(
                        type: DataType::OBJECT,
                        properties: [
                            'employee_id' => new Schema(type: DataType::INTEGER, description: 'The unique ID of the employee.'),
                            'days'        => new Schema(type: DataType::INTEGER, description: 'Number of past days to analyze (default 30).')
                        ],
                        required: ['employee_id']
                    )
                ),
                new FunctionDeclaration(
                    name: 'get_performance_summary',
                    description: 'Get the latest performance score and manager comments for an employee.',
                    parameters: new Schema(
                        type: DataType::OBJECT,
                        properties: [
                            'employee_id' => new Schema(type: DataType::INTEGER, description: 'The unique ID of the employee.')
                        ],
                        required: ['employee_id']
                    )
                )
            ]
        );
    }

    private function callFunction(string $name, array $args): array
    {
        $employeeId = $args['employee_id'] ?? null;
        if (!$employeeId) return ['error' => 'Missing employee_id'];

        $employee = Employee::find($employeeId);
        if (!$employee) return ['error' => 'Employee not found'];

        switch ($name) {
            case 'get_employee_profile':
                return [
                    'name'        => $employee->full_name,
                    'department'  => $employee->department?->name ?? 'N/A',
                    'designation' => $employee->designation ?? 'N/A',
                    'joined_at'   => $employee->join_date?->toDateString(),
                    'status'      => $employee->status
                ];

            case 'get_leave_balances':
                // Attempt to fetch balances logic (simplified for example)
                return [
                    'annual_leave' => 20, // Should come from actual entitlement logic
                    'sick_leave'   => 10,
                    'pending'      => LeaveRequest::where('employee_id', $employeeId)->where('status', 'pending')->count()
                ];

            case 'get_attendance_stats':
                $days = $args['days'] ?? 30;
                $startDate = now()->subDays($days);
                $records = AttendanceRecord::where('employee_id', $employeeId)
                    ->where('date', '>=', $startDate)
                    ->get();
                
                $present = $records->where('status', 'present')->count();
                $total   = $records->count();

                return [
                    'analysis_period' => "Last {$days} days",
                    'total_days'      => $total,
                    'days_present'    => $present,
                    'attendance_rate' => $total > 0 ? round(($present / $total) * 100, 1) . '%' : 'N/A'
                ];

            case 'get_performance_summary':
                $latest = $employee->performanceReviews()->latest()->first();
                return [
                    'latest_score' => $latest->score ?? 'N/A',
                    'rating'       => $latest->rating ?? 'No recent review',
                    'comments'     => $latest->manager_comments ?? 'N/A'
                ];

            default:
                return ['error' => 'Function not implemented'];
        }
    }
}
