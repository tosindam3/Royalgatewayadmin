<?php

namespace App\Http\Controllers;

use App\Models\PerformanceSubmission;
use App\Models\PerformanceConfig;
use App\Models\Employee;
use App\Services\PerformanceScoringEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;
use App\Services\ScopeEngine;

class PerformanceController extends Controller
{
    protected $scoringEngine;
    protected $scopeEngine;

    public function __construct(PerformanceScoringEngine $scoringEngine, ScopeEngine $scopeEngine)
    {
        $this->scoringEngine = $scoringEngine;
        $this->scopeEngine = $scopeEngine;
    }

    private function applyDateFilters($query, Request $request)
    {
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('submitted_at', [$request->start_date, $request->end_date . ' 23:59:59']);
        } elseif ($request->filled('year') && $request->year !== 'all_time') {
            $year = $request->year;
            if ($request->filled('quarter')) {
                $quarter = $request->quarter; 
                $startMonth = ($quarter - 1) * 3 + 1;
                $endMonth = $startMonth + 2;
                $query->whereYear('submitted_at', $year)
                      ->whereMonth('submitted_at', '>=', $startMonth)
                      ->whereMonth('submitted_at', '<=', $endMonth);
            } else {
                $query->whereYear('submitted_at', $year);
            }
        } elseif ($request->filled('period') && $request->period !== 'all_time') {
            $query->where('period', $request->period);
        }
        return $query;
    }

    public function getAvailablePeriods()
    {
        $periods = PerformanceSubmission::select('period')
            ->whereNotNull('period')
            ->distinct()
            ->orderBy('period', 'desc')
            ->pluck('period');
            
        // Also get distinct years
        $years = PerformanceSubmission::select(DB::raw('YEAR(submitted_at) as year'))
            ->whereNotNull('submitted_at')
            ->distinct()
            ->orderBy('year', 'desc')
            ->pluck('year');
            
        return $this->success([
            'periods' => $periods,
            'years' => $years
        ]);
    }

    // Get submissions for current user (or all if admin)
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = PerformanceSubmission::with(['employee', 'department']);

        // Apply dynamic scoping
        $query = $this->scopeEngine->applyScope($query, $user, 'performance.view');

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $this->applyDateFilters($query, $request);

        $submissions = $query->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 20);

        return $this->success($submissions);
    }

    // Create new submission
    public function store(Request $request)
    {
        $validated = $request->validate([
            'period'    => 'required|string',
            'form_data' => 'required|array',
        ]);

        $user     = $request->user();
        $employee = Employee::with(['department', 'branch'])->findOrFail($user->employee_id);

        // Resolve published config using scope priority
        $config = PerformanceConfig::resolveForEmployee($employee);

        if (!$config) {
            return response()->json([
                'success' => false,
                'message' => 'No published evaluation template found for your department or branch',
            ], 422);
        }

        // Calculate score
        $scoreResult = $this->scoringEngine->calculateScore(
            $validated['form_data'],
            array_merge($config->scoring_config, ['sections' => $config->sections])
        );

        $submission = PerformanceSubmission::create([
            'employee_id'   => $employee->id,
            'department_id' => $employee->department_id,
            'branch_id'     => $employee->branch_id,
            'period'        => $validated['period'],
            'form_data'     => $validated['form_data'],
            'score'         => $scoreResult['score'],
            'rating'        => $scoreResult['rating'],
            'breakdown'     => $scoreResult['breakdown'],
            'status'        => 'submitted',
            'submitted_at'  => now(),
        ]);

        Cache::tags(['performance'])->flush();

        return $this->success($submission, 'Submission created successfully', 201);
    }

    // Save draft
    public function saveDraft(Request $request)
    {
        $validated = $request->validate([
            'department_id' => 'required|exists:departments,id',
            'period' => 'required|string',
            'form_data' => 'required|array',
        ]);

        $user = $request->user();

        $draft = PerformanceSubmission::updateOrCreate(
            [
                'employee_id' => $user->employee_id,
                'department_id' => $validated['department_id'],
                'period' => $validated['period'],
                'status' => 'draft'
            ],
            [
                'form_data' => $validated['form_data'],
            ]
        );

        return $this->success($draft, 'Draft saved successfully');
    }

    // Get draft
    public function getDraft(Request $request)
    {
        $user = $request->user();
        $departmentId = $request->department_id;
        $period = $request->period;

        $draft = PerformanceSubmission::where('employee_id', $user->employee_id)
            ->where('department_id', $departmentId)
            ->where('period', $period)
            ->where('status', 'draft')
            ->first();

        return $this->success($draft);
    }

    // Get leaderboard
    public function leaderboard(Request $request)
    {
        $limit = $request->limit ?? 10;
        
        $cacheKey = 'perf_leaderboard_' . md5(json_encode($request->all()));

        $leaderboard = Cache::remember($cacheKey, 300, function () use ($request, $limit) {
            $query = PerformanceSubmission::select(
                'employee_id',
                DB::raw('AVG(score) as average_score'),
                DB::raw('COUNT(*) as submission_count')
            )
            ->with('employee:id,first_name,last_name,employee_code,department_id', 'employee.department:id,name')
            ->where('status', 'submitted')
            ->whereNotNull('score');

            // Apply dynamic scoping
            $query = $this->scopeEngine->applyScope($query, $request->user(), 'performance.view');

            $this->applyDateFilters($query, $request);

            return $query->groupBy('employee_id')
                ->orderBy('average_score', 'desc')
                ->limit($limit)
                ->get()
                ->map(function ($item, $index) {
                    return [
                        'rank' => $index + 1,
                        'employee_id' => $item->employee_id,
                        'name' => $item->employee->first_name . ' ' . $item->employee->last_name,
                        'employee_code' => $item->employee->employee_code,
                        'department' => $item->employee->department->name ?? 'N/A',
                        'score' => round($item->average_score, 2),
                        'submissions' => $item->submission_count,
                        'medal' => $index === 0 ? 'gold' : ($index === 1 ? 'silver' : ($index === 2 ? 'bronze' : null))
                    ];
                });
        });

        return $this->success($leaderboard);
    }

    // Get department summaries
    public function departmentSummaries(Request $request)
    {
        $cacheKey = 'performance_dept_summaries_' . md5(json_encode($request->all()));

        $summaries = Cache::remember($cacheKey, 300, function () use ($request) {
            $query = PerformanceSubmission::select(
                'department_id',
                DB::raw('AVG(score) as average_score'),
                DB::raw('COUNT(DISTINCT employee_id) as staff_count'),
                DB::raw('MAX(score) as top_score')
            )
            ->with('department:id,name')
            ->where('status', 'submitted')
            ->whereNotNull('score');

            // Apply dynamic scoping
            $query = $this->scopeEngine->applyScope($query, $request->user(), 'performance.view');

            $this->applyDateFilters($query, $request);

            return $query->groupBy('department_id')
                ->orderBy('average_score', 'desc')
                ->get()
                ->map(function ($item) use ($request) {
                    // Get top performer
                    $topQuery = PerformanceSubmission::where('department_id', $item->department_id)
                        ->where('score', $item->top_score)
                        ->with('employee:id,first_name,last_name');
                    
                    $this->applyDateFilters($topQuery, $request);
                    
                    $topPerformer = $topQuery->first();

                    return [
                        'department' => $item->department->name,
                        'average_score' => round($item->average_score, 2),
                        'staff_count' => $item->staff_count,
                        'top_performer' => $topPerformer ? 
                            $topPerformer->employee->first_name . ' ' . $topPerformer->employee->last_name : 
                            'N/A'
                    ];
                });
        });

        return $this->success($summaries);
    }

    // Individual Employee Personal Analytics
    public function personalAnalytics(Request $request)
    {
        $user = $request->user();
        
        if (!$this->scopeEngine->hasPermission($user, 'performance.view')) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $employee = $user->employeeProfile;
        if (!$employee) {
            // Return empty state instead of error for employees without submissions
            return $this->success([
                'current_score' => 0,
                'rating' => null,
                'department_average' => 0,
                'organization_average' => 0,
                'history' => [],
                'latest_breakdown' => [],
                'has_submission' => false,
            ]);
        }

        // Fetch user's historical submissions
        $submissions = PerformanceSubmission::where('employee_id', $employee->id)
            ->where('status', 'submitted')
            ->whereNotNull('score')
            ->orderBy('created_at', 'asc') // Chronological for trend line
            ->get();

        if ($submissions->isEmpty()) {
            // Return empty state with department/org averages
            $deptAvg = PerformanceSubmission::where('department_id', $employee->department_id)
                ->where('status', 'submitted')
                ->whereNotNull('score')
                ->avg('score');

            $orgAvg = PerformanceSubmission::where('status', 'submitted')
                ->whereNotNull('score')
                ->avg('score');

            return $this->success([
                'current_score' => 0,
                'rating' => null,
                'department_average' => round($deptAvg ?? 0, 2),
                'organization_average' => round($orgAvg ?? 0, 2),
                'history' => [],
                'latest_breakdown' => [],
                'has_submission' => false,
            ]);
        }

        $latestSubmission = $submissions->last();

        // Calculate Department Average
        $deptAvg = PerformanceSubmission::where('department_id', $employee->department_id)
            ->where('status', 'submitted')
            ->whereNotNull('score')
            ->avg('score');

        // Calculate Organization Average
        $orgAvg = PerformanceSubmission::where('status', 'submitted')
            ->whereNotNull('score')
            ->avg('score');

        // Historical Trend
        $history = $submissions->map(function ($sub) use ($deptAvg) {
            return [
                'period' => $sub->period,
                'score' => round($sub->score, 2),
                'dept_avg' => round($deptAvg ?? 0, 2), 
            ];
        });

        return $this->success([
            'current_score' => round($latestSubmission->score, 2),
            'rating' => $latestSubmission->rating,
            'department_average' => round($deptAvg ?? 0, 2),
            'organization_average' => round($orgAvg ?? 0, 2),
            'history' => $history,
            'latest_breakdown' => $latestSubmission->breakdown ?? [],
            'has_submission' => true,
        ]);
    }

    // Branch Manager Analytics
    public function branchAnalytics(Request $request)
    {
        $user = $request->user();
        
        // Use explicit permission check for analytics
        if (!$this->scopeEngine->hasPermission($user, 'performance.view', 'branch')) {
            return response()->json(['success' => false, 'message' => 'Insufficient permissions for branch analytics'], 403);
        }

        $employee = Employee::find($user->employee_id);
        if (!$employee || !$employee->branch_id) {
            return response()->json(['success' => false, 'message' => 'Branch assignment not found'], 404);
        }

        $branchId = $employee->branch_id;

        // Get submissions for all employees in this branch
        $query = PerformanceSubmission::where('branch_id', $branchId)
            ->where('status', 'submitted')
            ->whereNotNull('score')
            ->with(['department:id,name', 'employee:id,first_name,last_name']);
            
        $this->applyDateFilters($query, $request);
        $branchSubmissions = $query->get();

        if ($branchSubmissions->isEmpty()) {
            return response()->json(['success' => true, 'data' => null]);
        }

        // Branch average
        $branchAvg = $branchSubmissions->avg('score');

        // Org average
        $orgQuery = PerformanceSubmission::where('status', 'submitted')
            ->whereNotNull('score');
        $this->applyDateFilters($orgQuery, $request);
        $orgAvg = $orgQuery->avg('score');

        // Group by department to get department averages within the branch
        $deptGroups = $branchSubmissions->groupBy('department_id');
        $departmentAverages = $deptGroups->map(function ($subs) {
            return [
                'department' => $subs->first()->department->name ?? 'Unknown',
                'average_score' => round($subs->avg('score'), 2),
                'staff_count' => $subs->unique('employee_id')->count()
            ];
        })->values();

        // Top Performers in Branch
        $topPerformers = $branchSubmissions->sortByDesc('score')->take(5)->map(function ($sub) {
            return [
                'name' => $sub->employee ? ($sub->employee->first_name . ' ' . $sub->employee->last_name) : 'Unknown',
                'department' => $sub->department->name ?? 'Unknown',
                'score' => round($sub->score, 2),
                'rating' => $sub->rating,
            ];
        })->values();

        return $this->success([
            'branch_average' => round($branchAvg, 2),
            'organization_average' => round($orgAvg ?? 0, 2),
            'department_comparisons' => $departmentAverages,
            'top_performers' => $topPerformers,
            'total_submissions' => $branchSubmissions->count(),
        ]);
    }

    // Get all configs (admin — all statuses)
    public function getConfigs(Request $request)
    {
        $query = PerformanceConfig::with(['department:id,name', 'departments:id,name', 'branch:id,name', 'creator:id,name']);

        if ($request->filled('department_id')) {
            $deptId = $request->department_id;
            $query->where(function($q) use ($deptId) {
                $q->where('department_id', '=', $deptId)
                  ->orWhereHas('departments', function($subQ) use ($deptId) {
                      $subQ->where('departments.id', '=', $deptId);
                  });
            });
        }
        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('scope')) {
            $query->where('scope', $request->scope);
        }

        $configs = $query->orderBy('created_at', 'desc')->get();

        return $this->success($configs);
    }

    // Get single config
    public function getConfig($id)
    {
        $config = PerformanceConfig::with(['department:id,name', 'departments:id,name', 'creator:id,name'])
            ->findOrFail($id);

        return $this->success($config);
    }

    // Get config by department
    public function getConfigByDepartment($departmentId)
    {
        $config = PerformanceConfig::where('is_active', true)
            ->where(function($q) use ($departmentId) {
                $q->where('department_id', $departmentId)
                  ->orWhereHas('departments', fn($subQ) => $subQ->where('departments.id', $departmentId));
            })
            ->with(['department:id,name', 'departments:id,name'])
            ->first();

        if (!$config) {
            return response()->json([
                'success' => false,
                'message' => 'No active configuration found for this department'
            ], 404);
        }

        return $this->success($config);
    }

    // Create a new config (Admin only)
    public function createConfig(Request $request)
    {
        if (!$this->scopeEngine->hasPermission($request->user(), 'performance.update')) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'description'    => 'nullable|string',
            'scope'          => 'required|in:department,branch,global',
            'department_ids' => 'nullable|array',
            'department_ids.*' => 'exists:departments,id',
            'department_id'  => 'nullable|exists:departments,id', // Legacy support
            'branch_id'      => 'nullable|exists:branches,id',
            'sections'       => 'required|array',
            'scoring_config' => 'required|array',
        ]);

        if ($validated['scope'] === 'department' && empty($validated['department_ids']) && empty($validated['department_id'])) {
            return response()->json(['success' => false, 'message' => 'department_ids array is required when scope is department'], 422);
        }
        if ($validated['scope'] === 'branch' && empty($validated['branch_id'])) {
            return response()->json(['success' => false, 'message' => 'branch_id is required when scope is branch'], 422);
        }

        $validated['created_by'] = $request->user()->id;
        $validated['status']     = 'draft';
        
        // Handle legacy single department_id gracefully for backwards-compatible initial save
        if (!empty($validated['department_id']) && empty($validated['department_ids'])) {
            $validated['department_ids'] = [$validated['department_id']];
        }

        $config = PerformanceConfig::create(array_diff_key($validated, array_flip(['department_ids'])));
        
        if (!empty($validated['department_ids'])) {
            $config->departments()->sync($validated['department_ids']);
            // Also set legacy column if only 1 is selected to keep basic things working out of the box if needed.
            if (count($validated['department_ids']) === 1) {
                $config->update(['department_id' => $validated['department_ids'][0]]);
            }
        }

        return $this->success($config->load(['department:id,name', 'departments:id,name', 'branch:id,name', 'creator:id,name']), 'Configuration created successfully', 201);
    }

    // Update an existing config (Admin only) — auto-reverts published → draft
    public function updateConfig(Request $request, $id)
    {
        if (!$this->scopeEngine->hasPermission($request->user(), 'performance.update')) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $config = PerformanceConfig::findOrFail($id);

        $validated = $request->validate([
            'name'           => 'sometimes|string|max:255',
            'description'    => 'nullable|string',
            'scope'          => 'sometimes|in:department,branch,global',
            'department_ids' => 'nullable|array',
            'department_ids.*' => 'exists:departments,id',
            'department_id'  => 'nullable|exists:departments,id',
            'branch_id'      => 'nullable|exists:branches,id',
            'sections'       => 'sometimes|array',
            'scoring_config' => 'sometimes|array',
        ]);

        // Revert to draft if currently published so employees see the old version
        if ($config->status === 'published') {
            $validated['status']       = 'draft';
            $validated['published_at'] = null;
        }

        // Handle legacy department_id mapping
        if (isset($validated['department_id']) && !isset($validated['department_ids'])) {
            $validated['department_ids'] = [$validated['department_id']];
        }

        $config->update(array_diff_key($validated, array_flip(['department_ids'])));
        
        if (isset($validated['department_ids'])) {
            $config->departments()->sync($validated['department_ids']);
            if (count($validated['department_ids']) === 1) {
                $config->update(['department_id' => $validated['department_ids'][0]]);
            } else {
                $config->update(['department_id' => null]);
            }
        }

        return $this->success($config->fresh(['department:id,name', 'departments:id,name', 'branch:id,name', 'creator:id,name']), 'Configuration updated. Status reverted to draft — re-publish to update the employee portal.');
    }

    // Delete a config — only if it's a draft
    public function deleteConfig($id)
    {
        if (!$this->scopeEngine->hasPermission(request()->user(), 'performance.delete')) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $config = PerformanceConfig::findOrFail($id);

        if ($config->status !== 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Only draft templates can be deleted. Archive or revert to draft first.',
            ], 422);
        }

        $config->delete();

        return $this->success(null, 'Template deleted successfully');
    }

    // Analytics summary endpoint
    public function analytics(Request $request)
    {
        $cacheKey = 'perf_analytics_' . md5(json_encode($request->all()));
        
        return Cache::remember($cacheKey, 600, function () use ($request) {
            $query = PerformanceSubmission::where('status', 'submitted')->whereNotNull('score');
            
            // Applying advanced date/period filters
            $this->applyDateFilters($query, $request);

            $total      = $query->count();
            $avgScore   = $query->avg('score');
            $topScore   = $query->max('score');

            // 1. Department Breakdown
            $byDept = $query->clone()
                ->select('department_id', DB::raw('AVG(score) as avg_score'), DB::raw('COUNT(*) as count'))
                ->groupBy('department_id')
                ->with('department:id,name')
                ->get()
                ->map(fn($d) => [
                    'name'  => $d->department->name ?? 'N/A',
                    'score' => round($d->avg_score, 2),
                    'count' => $d->count,
                ]);

            // 2. Growth Trajectory (Monthly Trend)
            // Strategy: Respect organizational filters (Dept/Branch) but use a wider time range for the trend
            $trajectoryQuery = PerformanceSubmission::where('status', 'submitted')
                ->whereNotNull('score');

            if ($request->department_id) {
                $trajectoryQuery->where('department_id', $request->department_id);
            }
            if ($request->branch_id) {
                $trajectoryQuery->whereHas('employee', function($q) use ($request) {
                    $q->where('branch_id', $request->branch_id);
                });
            }

            // If a year is selected, we might want to show that year's trajectory
            $lookback = 6;
            $start = Carbon::now()->subMonths($lookback);
            
            if ($request->year) {
                $start = Carbon::create($request->year, 1, 1);
            }

            $trajectory = $trajectoryQuery
                ->where('submitted_at', '>=', $start)
                ->select(
                    DB::raw('DATE_FORMAT(submitted_at, "%Y-%m") as month_key'),
                    DB::raw('AVG(score) as avg_score')
                )
                ->groupBy('month_key')
                ->orderBy('month_key', 'asc')
                ->get()
                ->map(fn($t) => [
                    'month' => Carbon::parse($t->month_key . '-01')->format('M Y'),
                    'score' => round($t->avg_score, 2),
                ]);

            // Ensure we at least have 2 points for a line chart if the range allows it
            // (If there's only one month of data in the system, we can't do much)

            // 3. Score Distribution (Histogram buckets)
            $distribution = [
                ['category' => '90-100', 'count' => 0],
                ['category' => '80-89', 'count' => 0],
                ['category' => '70-79', 'count' => 0],
                ['category' => '60-69', 'count' => 0],
                ['category' => '<60', 'count' => 0],
            ];

            $scores = $query->clone()->pluck('score');
            foreach ($scores as $s) {
                if ($s >= 90) $distribution[0]['count']++;
                elseif ($s >= 80) $distribution[1]['count']++;
                elseif ($s >= 70) $distribution[2]['count']++;
                elseif ($s >= 60) $distribution[3]['count']++;
                else $distribution[4]['count']++;
            }

            // 4. Competency Breakdown (Radar Chart)
            // Aggregating all field scores across submissions
            $allBreakdowns = $query->clone()->pluck('breakdown');
            $competencyMatrix = [];
            $tempBreakdown = [];

            foreach ($allBreakdowns as $json) {
                $breakdown = is_string($json) ? json_decode($json, true) : $json;
                if (!is_array($breakdown)) continue;
                
                foreach ($breakdown as $item) {
                    $key = $item['field_label'] ?? $item['field_id'] ?? 'Unknown';
                    if (!isset($tempBreakdown[$key])) {
                        $tempBreakdown[$key] = ['total' => 0, 'count' => 0];
                    }
                    $tempBreakdown[$key]['total'] += $item['score'] ?? 0;
                    $tempBreakdown[$key]['count']++;
                }
            }

            foreach ($tempBreakdown as $label => $stats) {
                $competencyMatrix[] = [
                    'subject' => $label,
                    'score'   => round($stats['total'] / $stats['count'], 1),
                    'fullMark' => 100
                ];
            }

            return $this->success([
                'total_submissions' => $total,
                'average_score'     => round($avgScore, 2),
                'top_score'         => $topScore,
                'by_department'     => $byDept,
                'trajectory'        => $trajectory,
                'distribution'      => $distribution,
                'competency_matrix' => $competencyMatrix,
            ]);
        });
    }

    // ─── Lifecycle Actions ───────────────────────────────────────────────────

    /** Publish a template — makes it visible to employees */
    public function publishConfig($id)
    {
        $config = PerformanceConfig::findOrFail($id);
        $config->update([
            'status'       => 'published',
            'published_at' => now(),
        ]);

        return $this->success($config->fresh(['department:id,name', 'branch:id,name']), 'Template published. Employees can now see and submit this form.');
    }

    /** Revert a published/archived template back to draft */
    public function revertConfig($id)
    {
        $config = PerformanceConfig::findOrFail($id);
        $config->update(['status' => 'draft', 'published_at' => null]);

        return $this->success($config->fresh(), 'Template reverted to draft.');
    }

    /** Archive a published template (hides from employees without deleting) */
    public function archiveConfig($id)
    {
        $config = PerformanceConfig::findOrFail($id);
        $config->update(['status' => 'archived']);

        return $this->success($config->fresh(), 'Template archived.');
    }

    /** Clone a template — creates a draft copy */
    public function cloneConfig($id)
    {
        $source = PerformanceConfig::findOrFail($id);

        $clone = PerformanceConfig::create([
            'name'           => 'Copy of ' . $source->name,
            'description'    => $source->description,
            'scope'          => $source->scope,
            'department_id'  => $source->department_id,
            'branch_id'      => $source->branch_id,
            'sections'       => $source->sections,
            'scoring_config' => $source->scoring_config,
            'cloned_from'    => $source->id,
            'status'         => 'draft',
            'created_by'     => request()->user()->id,
        ]);

        return $this->success($clone->load(['department:id,name', 'branch:id,name', 'creator:id,name']), 'Template cloned as draft.', 201);
    }

    /**
     * Resolve the best published template for the authenticated employee.
     * Priority: department > branch > global
     */
    public function getConfigForEmployee(Request $request)
    {
        $user = $request->user();

        if (!$user->employee_id) {
            return response()->json([
                'success' => false,
                'message' => 'No employee profile linked to this account.',
            ], 404);
        }

        $employee = Employee::findOrFail($user->employee_id);

        $config = PerformanceConfig::resolveForEmployee($employee);

        if (!$config) {
            return response()->json([
                'success' => false,
                'message' => 'No published evaluation template found for your profile.',
            ], 404);
        }

        return $this->success($config->load(['department:id,name', 'branch:id,name']));
    }
}

