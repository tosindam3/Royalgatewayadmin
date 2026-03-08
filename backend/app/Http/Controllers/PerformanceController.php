<?php

namespace App\Http\Controllers;

use App\Models\PerformanceSubmission;
use App\Models\PerformanceConfig;
use App\Models\Employee;
use App\Services\PerformanceScoringEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class PerformanceController extends Controller
{
    protected $scoringEngine;

    public function __construct(PerformanceScoringEngine $scoringEngine)
    {
        $this->scoringEngine = $scoringEngine;
    }

    // Get submissions for current user (or all if admin)
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = PerformanceSubmission::with(['employee', 'department']);

        // Check if user has an admin role
        $isAdmin = $user->hasAnyRole(['super_admin', 'admin', 'hr_admin', 'ceo']);

        // If not admin, only show their own submissions
        if (!$isAdmin) {
            $query->where('employee_id', $user->employee_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->period) {
            $query->where('period', $request->period);
        }

        $submissions = $query->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'data' => $submissions
        ]);
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

        return response()->json([
            'success' => true,
            'data'    => $submission,
            'message' => 'Submission created successfully',
        ], 201);
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

        return response()->json([
            'success' => true,
            'data' => $draft,
            'message' => 'Draft saved successfully'
        ]);
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

        return response()->json([
            'success' => true,
            'data' => $draft
        ]);
    }

    // Get leaderboard
    public function leaderboard(Request $request)
    {
        $limit = $request->limit ?? 10;
        $period = $request->period;

        $cacheKey = 'performance_leaderboard_' . ($period ?? 'all') . '_' . $limit;

        $leaderboard = Cache::remember($cacheKey, 300, function () use ($limit, $period) {
            $query = PerformanceSubmission::select(
                'employee_id',
                DB::raw('AVG(score) as average_score'),
                DB::raw('COUNT(*) as submission_count')
            )
            ->with('employee:id,first_name,last_name,employee_code,department_id')
            ->with('employee.department:id,name')
            ->where('status', 'submitted')
            ->whereNotNull('score');

            if ($period) {
                $query->where('period', $period);
            }

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

        return response()->json([
            'success' => true,
            'data' => $leaderboard
        ]);
    }

    // Get department summaries
    public function departmentSummaries(Request $request)
    {
        $period = $request->period;
        $cacheKey = 'performance_dept_summaries_' . ($period ?? 'all');

        $summaries = Cache::remember($cacheKey, 300, function () use ($period) {
            $query = PerformanceSubmission::select(
                'department_id',
                DB::raw('AVG(score) as average_score'),
                DB::raw('COUNT(DISTINCT employee_id) as staff_count'),
                DB::raw('MAX(score) as top_score')
            )
            ->with('department:id,name')
            ->where('status', 'submitted')
            ->whereNotNull('score');

            if ($period) {
                $query->where('period', $period);
            }

            return $query->groupBy('department_id')
                ->orderBy('average_score', 'desc')
                ->get()
                ->map(function ($item) use ($period) {
                    // Get top performer
                    $topQuery = PerformanceSubmission::where('department_id', $item->department_id)
                        ->where('score', $item->top_score)
                        ->with('employee:id,first_name,last_name');
                    
                    if ($period) {
                        $topQuery->where('period', $period);
                    }
                    
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

        return response()->json([
            'success' => true,
            'data' => $summaries
        ]);
    }

    // Individual Employee Personal Analytics
    public function personalAnalytics(Request $request)
    {
        $user = $request->user();
        if (!$user->employee_id) {
            return response()->json(['success' => false, 'message' => 'Not an employee'], 403);
        }

        $employee = Employee::find($user->employee_id);
        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'Employee record not found'], 404);
        }

        // Fetch user's historical submissions
        $submissions = PerformanceSubmission::where('employee_id', $employee->id)
            ->where('status', 'submitted')
            ->whereNotNull('score')
            ->orderBy('created_at', 'asc') // Chronological for trend line
            ->get();

        if ($submissions->isEmpty()) {
            return response()->json(['success' => true, 'data' => null]);
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

        return response()->json([
            'success' => true,
            'data' => [
                'current_score' => round($latestSubmission->score, 2),
                'rating' => $latestSubmission->rating,
                'department_average' => round($deptAvg ?? 0, 2),
                'organization_average' => round($orgAvg ?? 0, 2),
                'history' => $history,
                'latest_breakdown' => $latestSubmission->breakdown,
            ]
        ]);
    }

    // Branch Manager Analytics
    public function branchAnalytics(Request $request)
    {
        $user = $request->user();
        if (!$user->employee_id) {
            return response()->json(['success' => false, 'message' => 'Not an employee'], 403);
        }

        $employee = Employee::find($user->employee_id);
        if (!$employee || !$employee->branch_id) {
            return response()->json(['success' => false, 'message' => 'Branch assignment not found'], 404);
        }

        $branchId = $employee->branch_id;

        // Get submissions for all employees in this branch
        $branchSubmissions = PerformanceSubmission::where('branch_id', $branchId)
            ->where('status', 'submitted')
            ->whereNotNull('score')
            ->with(['department:id,name', 'employee:id,first_name,last_name'])
            ->get();

        if ($branchSubmissions->isEmpty()) {
            return response()->json(['success' => true, 'data' => null]);
        }

        // Branch average
        $branchAvg = $branchSubmissions->avg('score');

        // Org average
        $orgAvg = PerformanceSubmission::where('status', 'submitted')
            ->whereNotNull('score')
            ->avg('score');

        // Group by department to get department averages within the branch
        $deptGroups = $branchSubmissions->groupBy('department_id');
        $departmentAverages = $deptGroups->map(function ($subs) {
            return [
                'department' => compact('subs')->first()->department->name ?? 'Unknown',
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

        return response()->json([
            'success' => true,
            'data' => [
                'branch_average' => round($branchAvg, 2),
                'organization_average' => round($orgAvg ?? 0, 2),
                'department_comparisons' => $departmentAverages,
                'top_performers' => $topPerformers,
                'total_submissions' => $branchSubmissions->count(),
            ]
        ]);
    }

    // Get all configs (admin — all statuses)
    public function getConfigs(Request $request)
    {
        $query = PerformanceConfig::with(['department:id,name', 'branch:id,name', 'creator:id,name']);

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
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

        return response()->json(['success' => true, 'data' => $configs]);
    }

    // Get single config
    public function getConfig($id)
    {
        $config = PerformanceConfig::with(['department:id,name', 'creator:id,name'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $config
        ]);
    }

    // Get config by department
    public function getConfigByDepartment($departmentId)
    {
        $config = PerformanceConfig::where('department_id', $departmentId)
            ->where('is_active', true)
            ->with(['department:id,name'])
            ->first();

        if (!$config) {
            return response()->json([
                'success' => false,
                'message' => 'No active configuration found for this department'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $config
        ]);
    }

    // Create a new config (Admin only)
    public function createConfig(Request $request)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'description'    => 'nullable|string',
            'scope'          => 'required|in:department,branch,global',
            'department_id'  => 'nullable|exists:departments,id',
            'branch_id'      => 'nullable|exists:branches,id',
            'sections'       => 'required|array',
            'scoring_config' => 'required|array',
        ]);

        if ($validated['scope'] === 'department' && empty($validated['department_id'])) {
            return response()->json(['success' => false, 'message' => 'department_id is required when scope is department'], 422);
        }
        if ($validated['scope'] === 'branch' && empty($validated['branch_id'])) {
            return response()->json(['success' => false, 'message' => 'branch_id is required when scope is branch'], 422);
        }

        $validated['created_by'] = $request->user()->id;
        $validated['status']     = 'draft';

        $config = PerformanceConfig::create($validated);

        return response()->json([
            'success' => true,
            'data'    => $config->load(['department:id,name', 'branch:id,name', 'creator:id,name']),
            'message' => 'Configuration created successfully',
        ], 201);
    }

    // Update an existing config (Admin only) — auto-reverts published → draft
    public function updateConfig(Request $request, $id)
    {
        $config = PerformanceConfig::findOrFail($id);

        $validated = $request->validate([
            'name'           => 'sometimes|string|max:255',
            'description'    => 'nullable|string',
            'scope'          => 'sometimes|in:department,branch,global',
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

        $config->update($validated);

        return response()->json([
            'success' => true,
            'data'    => $config->fresh(['department:id,name', 'branch:id,name', 'creator:id,name']),
            'message' => 'Configuration updated. Status reverted to draft — re-publish to update the employee portal.',
        ]);
    }

    // Delete a config — only if it's a draft
    public function deleteConfig($id)
    {
        $config = PerformanceConfig::findOrFail($id);

        if ($config->status !== 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Only draft templates can be deleted. Archive or revert to draft first.',
            ], 422);
        }

        $config->delete();

        return response()->json(['success' => true, 'message' => 'Template deleted successfully']);
    }

    // Analytics summary endpoint
    public function analytics(Request $request)
    {
        $period = $request->period;

        $query = PerformanceSubmission::where('status', 'submitted')->whereNotNull('score');
        if ($period) {
            $query->where('period', $period);
        }

        $total      = $query->count();
        $avgScore   = $query->avg('score');
        $topScore   = $query->max('score');
        $byDept     = $query->clone()
            ->select('department_id', DB::raw('AVG(score) as avg_score'), DB::raw('COUNT(*) as count'))
            ->groupBy('department_id')
            ->with('department:id,name')
            ->get()
            ->map(fn($d) => [
                'name'  => $d->department->name ?? 'N/A',
                'score' => round($d->avg_score, 2),
                'count' => $d->count,
            ]);

        return response()->json([
            'success' => true,
            'data'    => [
                'total_submissions' => $total,
                'average_score'     => round($avgScore, 2),
                'top_score'         => $topScore,
                'by_department'     => $byDept,
            ],
        ]);
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

        return response()->json([
            'success' => true,
            'data'    => $config->fresh(['department:id,name', 'branch:id,name']),
            'message' => 'Template published. Employees can now see and submit this form.',
        ]);
    }

    /** Revert a published/archived template back to draft */
    public function revertConfig($id)
    {
        $config = PerformanceConfig::findOrFail($id);
        $config->update(['status' => 'draft', 'published_at' => null]);

        return response()->json([
            'success' => true,
            'data'    => $config->fresh(),
            'message' => 'Template reverted to draft.',
        ]);
    }

    /** Archive a published template (hides from employees without deleting) */
    public function archiveConfig($id)
    {
        $config = PerformanceConfig::findOrFail($id);
        $config->update(['status' => 'archived']);

        return response()->json([
            'success' => true,
            'data'    => $config->fresh(),
            'message' => 'Template archived.',
        ]);
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

        return response()->json([
            'success' => true,
            'data'    => $clone->load(['department:id,name', 'branch:id,name', 'creator:id,name']),
            'message' => 'Template cloned as draft.',
        ], 201);
    }

    /**
     * Resolve the best published template for the authenticated employee.
     * Priority: department > branch > global
     */
    public function getConfigForEmployee(Request $request)
    {
        $user     = $request->user();
        $employee = Employee::findOrFail($user->employee_id);

        $config = PerformanceConfig::resolveForEmployee($employee);

        if (!$config) {
            return response()->json([
                'success' => false,
                'message' => 'No published evaluation template found for your profile.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $config->load(['department:id,name', 'branch:id,name']),
        ]);
    }
}

