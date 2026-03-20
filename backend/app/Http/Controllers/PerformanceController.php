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
use App\Traits\ApiResponse;

class PerformanceController extends Controller
{
    use ApiResponse;

    protected $scoringEngine;
    protected $scopeEngine;

    public function __construct(PerformanceScoringEngine $scoringEngine, ScopeEngine $scopeEngine)
    {
        $this->scoringEngine = $scoringEngine;
        $this->scopeEngine   = $scopeEngine;
    }

    private function applyDateFilters($query, Request $request)
    {
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('submitted_at', [$request->start_date, $request->end_date . ' 23:59:59']);
        } elseif ($request->filled('year') && $request->year !== 'all_time') {
            $year = $request->year;
            if ($request->filled('quarter')) {
                $quarter    = $request->quarter;
                $startMonth = ($quarter - 1) * 3 + 1;
                $endMonth   = $startMonth + 2;
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

        $years = PerformanceSubmission::select(DB::raw('YEAR(submitted_at) as year'))
            ->whereNotNull('submitted_at')
            ->distinct()
            ->orderBy('year', 'desc')
            ->pluck('year');

        return $this->success(['periods' => $periods, 'years' => $years]);
    }

    public function index(Request $request)
    {
        $user  = $request->user();
        $query = PerformanceSubmission::with(['employee', 'department']);
        $query = $this->scopeEngine->applyScope($query, $user, 'performance.view');

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $this->applyDateFilters($query, $request);

        return $this->success($query->orderBy('created_at', 'desc')->paginate($request->per_page ?? 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'period'    => 'required|string',
            'form_data' => 'required|array',
        ]);

        $user     = $request->user();
        $employee = Employee::with(['department', 'branch'])->findOrFail($user->employee_id);
        $config   = PerformanceConfig::resolveForEmployee($employee);

        if (!$config) {
            return response()->json([
                'success' => false,
                'message' => 'No published evaluation template found for your department or branch',
            ], 422);
        }

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

        // Invalidate all relevant caches on new submission
        try { Cache::tags(['performance'])->flush(); } catch (\Exception $e) {}
        Cache::forget("perf_personal_{$employee->id}");
        Cache::forget("perf_dept_avg_{$employee->department_id}");
        Cache::forget('perf_org_avg');

        return $this->success($submission, 'Submission created successfully', 201);
    }

    public function saveDraft(Request $request)
    {
        $validated = $request->validate([
            'department_id' => 'required|exists:departments,id',
            'period'        => 'required|string',
            'form_data'     => 'required|array',
        ]);

        $user  = $request->user();
        $draft = PerformanceSubmission::updateOrCreate(
            [
                'employee_id'   => $user->employee_id,
                'department_id' => $validated['department_id'],
                'period'        => $validated['period'],
                'status'        => 'draft',
            ],
            ['form_data' => $validated['form_data']]
        );

        return $this->success($draft, 'Draft saved successfully');
    }

    public function getDraft(Request $request)
    {
        $user  = $request->user();
        $draft = PerformanceSubmission::where('employee_id', $user->employee_id)
            ->where('department_id', $request->department_id)
            ->where('period', $request->period)
            ->where('status', 'draft')
            ->first();

        return $this->success($draft);
    }

    public function leaderboard(Request $request)
    {
        $limit    = $request->limit ?? 10;
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

            $query = $this->scopeEngine->applyScope($query, $request->user(), 'performance.view');
            $this->applyDateFilters($query, $request);

            return $query->groupBy('employee_id')
                ->orderBy('average_score', 'desc')
                ->limit($limit)
                ->get()
                ->map(function ($item, $index) {
                    return [
                        'rank'          => $index + 1,
                        'employee_id'   => $item->employee_id,
                        'name'          => $item->employee->first_name . ' ' . $item->employee->last_name,
                        'employee_code' => $item->employee->employee_code,
                        'department'    => $item->employee->department->name ?? 'N/A',
                        'score'         => round($item->average_score, 2),
                        'submissions'   => $item->submission_count,
                        'medal'         => $index === 0 ? 'gold' : ($index === 1 ? 'silver' : ($index === 2 ? 'bronze' : null)),
                    ];
                });
        });

        return $this->success($leaderboard);
    }

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
                ->where('status', 'submitted')
                ->whereNotNull('score');

            $query = $this->scopeEngine->applyScope($query, $request->user(), 'performance.view');
            $this->applyDateFilters($query, $request);

            $results = $query->groupBy('department_id')
                ->orderBy('average_score', 'desc')
                ->with('department:id,name')
                ->get();

            if ($results->isEmpty()) return [];

            // Optimization: Fetch all top performers in one batch instead of N+1
            // Precision: Match both department_id AND score specifically
            $topPerformers = PerformanceSubmission::where(function($q) use ($results) {
                    foreach ($results as $item) {
                        $q->orWhere(function($sub) use ($item) {
                            $sub->where('department_id', $item->department_id)
                                ->where('score', $item->top_score);
                        });
                    }
                })
                ->where('status', 'submitted')
                ->with('employee:id,first_name,last_name')
                ->get()
                ->groupBy('department_id');

            return $results->map(function ($item) use ($topPerformers) {
                $topPerformer = $topPerformers->get($item->department_id)?->first();

                return [
                    'department'    => $item->department->name ?? 'N/A',
                    'average_score' => round($item->average_score, 2),
                    'staff_count'   => $item->staff_count,
                    'top_performer' => $topPerformer
                        ? $topPerformer->employee->first_name . ' ' . $topPerformer->employee->last_name
                        : 'N/A',
                ];
            });
        });

        return $this->success($summaries);
    }

    public function personalAnalytics(Request $request)
    {
        $user = $request->user();

        if (!$this->scopeEngine->hasPermission($user, 'performance.view')) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $employee = $user->employeeProfile;
        if (!$employee) {
            return $this->success([
                'current_score'       => 0,
                'rating'              => null,
                'department_average'  => 0,
                'organization_average'=> 0,
                'history'             => [],
                'latest_breakdown'    => [],
                'has_submission'      => false,
            ]);
        }

        // Cache: employee's own submissions (600s TTL, invalidated on new submission)
        $submissions = Cache::remember("perf_personal_{$employee->id}", 600, fn () =>
            PerformanceSubmission::where('employee_id', $employee->id)
                ->where('status', 'submitted')
                ->whereNotNull('score')
                ->orderBy('created_at', 'asc')
                ->get()
        );

        // Cache: org average — shared across all employees (600s TTL)
        $orgAvg = Cache::remember('perf_org_avg', 600, fn () =>
            PerformanceSubmission::where('status', 'submitted')
                ->whereNotNull('score')
                ->avg('score')
        );

        // Cache: dept average — shared per department (600s TTL)
        $deptAvg = Cache::remember("perf_dept_avg_{$employee->department_id}", 600, fn () =>
            PerformanceSubmission::where('department_id', $employee->department_id)
                ->where('status', 'submitted')
                ->whereNotNull('score')
                ->avg('score')
        );

        if ($submissions->isEmpty()) {
            return $this->success([
                'current_score'        => 0,
                'rating'               => null,
                'department_average'   => round($deptAvg ?? 0, 2),
                'organization_average' => round($orgAvg ?? 0, 2),
                'history'              => [],
                'latest_breakdown'     => [],
                'has_submission'       => false,
            ]);
        }

        $latestSubmission = $submissions->last();

        $history = $submissions->map(fn ($sub) => [
            'period'   => $sub->period,
            'score'    => round($sub->score, 2),
            'dept_avg' => round($deptAvg ?? 0, 2),
        ]);

        return $this->success([
            'current_score'        => round($latestSubmission->score, 2),
            'rating'               => $latestSubmission->rating,
            'department_average'   => round($deptAvg ?? 0, 2),
            'organization_average' => round($orgAvg ?? 0, 2),
            'history'              => $history,
            'latest_breakdown'     => $latestSubmission->breakdown ?? [],
            'has_submission'       => true,
        ]);
    }

    public function branchAnalytics(Request $request)
    {
        $user = $request->user();

        if (!$this->scopeEngine->hasPermission($user, 'performance.view', 'branch')) {
            return response()->json(['success' => false, 'message' => 'Insufficient permissions for branch analytics'], 403);
        }

        $employee = $user->employeeProfile;
        if (!$employee || !$employee->branch_id) {
            return response()->json(['success' => false, 'message' => 'Branch assignment not found'], 404);
        }

        $branchId = $employee->branch_id;
        $cacheKey = 'perf_branch_analytics_' . $branchId . '_' . md5(json_encode($request->all()));

        $data = Cache::remember($cacheKey, 600, function () use ($request, $branchId) {
            $baseQuery = PerformanceSubmission::where('branch_id', $branchId)
                ->where('status', 'submitted')
                ->whereNotNull('score');

            $this->applyDateFilters($baseQuery, $request);

            $stats = (clone $baseQuery)->select(
                DB::raw('AVG(score) as branch_avg'),
                DB::raw('COUNT(*) as total_submissions')
            )->first();

            if (!$stats || $stats->total_submissions == 0) {
                return null;
            }

            // Organization average for comparison
            $orgAvg = PerformanceSubmission::where('status', 'submitted')
                ->whereNotNull('score')
                ->when($request->filled('period'), fn($q) => $q->where('period', $request->period))
                ->avg('score');

            // Department comparisons
            $departmentAverages = (clone $baseQuery)
                ->select(
                    'department_id',
                    DB::raw('AVG(score) as average_score'),
                    DB::raw('COUNT(DISTINCT employee_id) as staff_count')
                )
                ->with('department:id,name')
                ->groupBy('department_id')
                ->get()
                ->map(fn($item) => [
                    'department'    => $item->department->name ?? 'Unknown',
                    'average_score' => round($item->average_score, 2),
                    'staff_count'   => $item->staff_count,
                ]);

            // Top performers
            $topPerformers = (clone $baseQuery)
                ->with(['employee:id,first_name,last_name', 'department:id,name'])
                ->orderBy('score', 'desc')
                ->limit(5)
                ->get()
                ->map(fn($sub) => [
                    'name'       => $sub->employee?->full_name ?? 'Unknown',
                    'department' => $sub->department->name ?? 'Unknown',
                    'score'      => round($sub->score, 2),
                    'rating'     => $sub->rating,
                ]);

            return [
                'branch_average'         => round($stats->branch_avg, 2),
                'organization_average'   => round($orgAvg ?? 0, 2),
                'department_comparisons' => $departmentAverages,
                'top_performers'         => $topPerformers,
                'total_submissions'      => (int) $stats->total_submissions,
            ];
        });

        return $this->success($data);
    }

    public function getConfigs(Request $request)
    {
        $query = PerformanceConfig::with(['department:id,name', 'departments:id,name', 'branch:id,name', 'creator:id,name']);

        if ($request->filled('department_id')) {
            $deptId = $request->department_id;
            $query->where(function ($q) use ($deptId) {
                $q->where('department_id', '=', $deptId)
                  ->orWhereHas('departments', fn ($subQ) => $subQ->where('departments.id', '=', $deptId));
            });
        }
        if ($request->filled('branch_id'))  { $query->where('branch_id', $request->branch_id); }
        if ($request->filled('status'))     { $query->where('status', $request->status); }
        if ($request->filled('scope'))      { $query->where('scope', $request->scope); }

        return $this->success($query->orderBy('created_at', 'desc')->get());
    }

    public function getConfig($id)
    {
        return $this->success(
            PerformanceConfig::with(['department:id,name', 'departments:id,name', 'creator:id,name'])->findOrFail($id)
        );
    }

    public function getConfigByDepartment($departmentId)
    {
        $config = PerformanceConfig::where('is_active', true)
            ->where(function ($q) use ($departmentId) {
                $q->where('department_id', $departmentId)
                  ->orWhereHas('departments', fn ($subQ) => $subQ->where('departments.id', $departmentId));
            })
            ->with(['department:id,name', 'departments:id,name'])
            ->first();

        if (!$config) {
            return response()->json(['success' => false, 'message' => 'No active configuration found for this department'], 404);
        }

        return $this->success($config);
    }

    public function createConfig(Request $request)
    {
        if (!$this->scopeEngine->hasPermission($request->user(), 'performance.update')) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name'             => 'required|string|max:255',
            'description'      => 'nullable|string',
            'scope'            => 'required|in:department,branch,global',
            'department_ids'   => 'nullable|array',
            'department_ids.*' => 'exists:departments,id',
            'department_id'    => 'nullable|exists:departments,id',
            'branch_id'        => 'nullable|exists:branches,id',
            'sections'         => 'required|array',
            'scoring_config'   => 'required|array',
        ]);

        if ($validated['scope'] === 'department' && empty($validated['department_ids']) && empty($validated['department_id'])) {
            return response()->json(['success' => false, 'message' => 'department_ids array is required when scope is department'], 422);
        }
        if ($validated['scope'] === 'branch' && empty($validated['branch_id'])) {
            return response()->json(['success' => false, 'message' => 'branch_id is required when scope is branch'], 422);
        }

        $validated['created_by'] = $request->user()->id;
        $validated['status']     = 'draft';
        
        if (!empty($validated['department_id']) && empty($validated['department_ids'])) {
            $validated['department_ids'] = [$validated['department_id']];
        }

        $config = PerformanceConfig::create(array_diff_key($validated, array_flip(['department_ids'])));
        
        if (!empty($validated['department_ids'])) {
            $config->departments()->sync($validated['department_ids']);
            if (count($validated['department_ids']) === 1) {
                $config->update(['department_id' => $validated['department_ids'][0]]);
            }
        }

        return $this->success($config->load(['department:id,name', 'departments:id,name', 'branch:id,name', 'creator:id,name']), 'Configuration created successfully', 201);
    }

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

        if ($config->status === 'published') {
            $validated['status']       = 'draft';
            $validated['published_at'] = null;
        }

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

        return $this->success($config->fresh(['department:id,name', 'departments:id,name', 'branch:id,name', 'creator:id,name']), 'Configuration updated. Status reverted to draft.');
    }

    public function deleteConfig($id)
    {
        if (!$this->scopeEngine->hasPermission(request()->user(), 'performance.delete')) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $config = PerformanceConfig::findOrFail($id);

        if ($config->status !== 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Only draft templates can be deleted.',
            ], 422);
        }

        $config->delete();

        return $this->success(null, 'Template deleted successfully');
    }

    public function analytics(Request $request)
    {
        $cacheKey = 'perf_analytics_' . md5(json_encode($request->all()));
        
        return Cache::remember($cacheKey, 600, function () use ($request) {
            $query = PerformanceSubmission::where('status', 'submitted')->whereNotNull('score');
            $this->applyDateFilters($query, $request);

            $total      = $query->count();
            $avgScore   = $query->avg('score');
            $topScore   = $query->max('score');

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

            $trajectoryQuery = PerformanceSubmission::where('status', 'submitted')->whereNotNull('score');
            if ($request->department_id) { $trajectoryQuery->where('department_id', $request->department_id); }
            if ($request->branch_id) {
                $trajectoryQuery->whereHas('employee', function($q) use ($request) {
                    $q->where('branch_id', $request->branch_id);
                });
            }

            $start = Carbon::now()->subMonths(6);
            if ($request->year) { $start = Carbon::create($request->year, 1, 1); }

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

            // 3. Score Distribution (Histogram buckets)
            $distributionMapped = (clone $query)->select(
                DB::raw("CASE 
                    WHEN score >= 90 THEN '90-100'
                    WHEN score >= 80 THEN '80-89'
                    WHEN score >= 70 THEN '70-79'
                    WHEN score >= 60 THEN '60-69'
                    ELSE '<60'
                END as category"),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('category')
            ->get()
            ->pluck('count', 'category');

            $distribution = [
                ['category' => '90-100', 'count' => $distributionMapped->get('90-100', 0)],
                ['category' => '80-89',  'count' => $distributionMapped->get('80-89', 0)],
                ['category' => '70-79',  'count' => $distributionMapped->get('70-79', 0)],
                ['category' => '60-69',  'count' => $distributionMapped->get('60-69', 0)],
                ['category' => '<60',    'count' => $distributionMapped->get('<60', 0)],
            ];

            // 4. Competency Breakdown (Radar Chart)
            // Optimization: If there are too many submissions, sample them to avoid memory issues
            $breakdownQuery = (clone $query)->whereNotNull('breakdown');
            $sampleCount = 500; // Cap at 500 for the radar chart calculation
            
            $allBreakdowns = $total > $sampleCount 
                ? $breakdownQuery->latest()->limit($sampleCount)->pluck('breakdown')
                : $breakdownQuery->pluck('breakdown');

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

            $competencyMatrix = [];
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

    public function publishConfig($id)
    {
        $config = PerformanceConfig::findOrFail($id);
        $config->update(['status' => 'published', 'published_at' => now()]);
        return $this->success($config->fresh(['department:id,name', 'branch:id,name']), 'Template published.');
    }

    public function revertConfig($id)
    {
        $config = PerformanceConfig::findOrFail($id);
        $config->update(['status' => 'draft', 'published_at' => null]);
        return $this->success($config->fresh(), 'Template reverted to draft.');
    }

    public function archiveConfig($id)
    {
        $config = PerformanceConfig::findOrFail($id);
        $config->update(['status' => 'archived']);
        return $this->success($config->fresh(), 'Template archived.');
    }

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
        return $this->success($clone->load(['department:id,name', 'branch:id,name', 'creator:id,name']), 'Template cloned.', 201);
    }

    public function getConfigForEmployee(Request $request)
    {
        $user = $request->user();
        if (!$user->employee_id) { return response()->json(['success' => false, 'message' => 'No employee profile.'], 404); }
        $employee = Employee::findOrFail($user->employee_id);
        $config = PerformanceConfig::resolveForEmployee($employee);
        if (!$config) { return response()->json(['success' => false, 'message' => 'No published template.'], 404); }
        return $this->success($config->load(['department:id,name', 'branch:id,name']));
    }
}
