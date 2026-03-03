<?php

namespace App\Http\Controllers;

use App\Models\EvaluationResponse;
use App\Services\PerformanceService;
use App\Services\PerformanceAccessService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EvaluationResponseController extends Controller
{
    protected $performanceService;
    protected $accessService;

    public function __construct(PerformanceService $performanceService, PerformanceAccessService $accessService)
    {
        $this->middleware('auth:sanctum');
        $this->middleware('performance.access');
        $this->performanceService = $performanceService;
        $this->accessService = $accessService;
    }

    /**
     * Get all evaluations (with access control)
     */
    public function index(Request $request)
    {
        $permissions = $request->get('user_permissions');
        $user = auth()->user();
        
        $query = EvaluationResponse::with([
            'employee:id,first_name,last_name,employee_code',
            'employee.department:id,name',
            'evaluator:id,name',
            'template:id,title',
            'cycle:id,name',
            'submittedTo:id,name',
        ]);
        
        // Apply access control
        if ($permissions['is_hr_admin']) {
            // HR Admins can see all evaluations
        } elseif ($permissions['is_manager']) {
            // Managers can see their department's evaluations
            $query->whereHas('employee', function ($q) use ($permissions) {
                $q->where('department_id', $permissions['department_id']);
            });
        } else {
            // Employees can only see their own evaluations
            $query->where('employee_id', $permissions['employee_id']);
        }
        
        // Apply filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        if ($request->has('employee_id') && $permissions['is_hr_admin']) {
            $query->where('employee_id', $request->employee_id);
        }
        
        if ($request->has('cycle_id')) {
            $query->where('cycle_id', $request->cycle_id);
        }
        
        $evaluations = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 20));
        
        // Add calculated fields
        $evaluations->getCollection()->each(function ($eval) {
            $eval->calculated_score = $eval->calculateScore();
            $eval->status_label = $eval->status_label;
            $eval->can_edit = $eval->can_edit;
            $eval->can_submit = $eval->can_submit;
        });
        
        return response()->json([
            'data' => $evaluations->items(),
            'meta' => [
                'current_page' => $evaluations->currentPage(),
                'per_page' => $evaluations->perPage(),
                'total' => $evaluations->total(),
                'last_page' => $evaluations->lastPage(),
            ]
        ]);
    }

    /**
     * Get pending evaluations for current user to fill
     */
    public function pending(Request $request)
    {
        $permissions = $request->get('user_permissions');
        $pending = $this->performanceService->getPendingEvaluations(auth()->id());
        
        return response()->json([
            'success' => true,
            'data' => $pending,
        ]);
    }

    /**
     * Get evaluations pending review by current user
     */
    public function pendingReview(Request $request)
    {
        $user = auth()->user();
        $pending = $this->accessService->getPendingEvaluationsForReview($user);
        
        return response()->json([
            'success' => true,
            'data' => $pending,
        ]);
    }

    /**
     * Get submission targets for an employee
     */
    public function submissionTargets(Request $request, int $employeeId)
    {
        $permissions = $request->get('user_permissions');
        
        // Only allow if user is the employee or has admin/manager privileges
        if (!$permissions['is_hr_admin'] && !$permissions['is_manager'] && $permissions['employee_id'] !== $employeeId) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }
        
        $targets = $this->accessService->getSubmissionTargets($employeeId);
        
        return response()->json([
            'success' => true,
            'data' => $targets,
        ]);
    }

    /**
     * Get single evaluation
     */
    public function show(int $id, Request $request)
    {
        $permissions = $request->get('user_permissions');
        $user = auth()->user();
        
        $evaluation = EvaluationResponse::with([
            'employee:id,first_name,last_name,employee_code',
            'employee.department:id,name',
            'evaluator:id,name',
            'template',
            'cycle:id,name',
            'approver:id,name',
            'submittedTo:id,name',
        ])->findOrFail($id);
        
        // Check access
        if (!$this->accessService->canViewEmployeeData($user, $evaluation->employee_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }
        
        $evaluation->calculated_score = $evaluation->calculateScore();
        $evaluation->status_label = $evaluation->status_label;
        $evaluation->can_edit = $evaluation->can_edit;
        $evaluation->can_submit = $evaluation->can_submit;
        
        return response()->json([
            'success' => true,
            'data' => $evaluation,
        ]);
    }

    /**
     * Create evaluation (draft)
     */
    public function store(Request $request)
    {
        $permissions = $request->get('user_permissions');
        
        $validator = Validator::make($request->all(), [
            'template_id' => 'required|exists:evaluation_templates,id',
            'employee_id' => 'required|exists:employees,id',
            'cycle_id' => 'nullable|exists:review_cycles,id',
            'answers' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        // Check if user can create evaluation for this employee
        if (!$permissions['is_hr_admin'] && !$permissions['is_manager'] && $permissions['employee_id'] !== $request->employee_id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        $evaluation = EvaluationResponse::create([
            'template_id' => $request->template_id,
            'employee_id' => $request->employee_id,
            'evaluator_id' => auth()->id(),
            'cycle_id' => $request->cycle_id,
            'answers' => $request->answers,
            'status' => 'draft',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Evaluation draft created successfully',
            'data' => $evaluation,
        ], 201);
    }

    /**
     * Update evaluation (draft/returned only)
     */
    public function update(Request $request, int $id)
    {
        $evaluation = EvaluationResponse::findOrFail($id);
        
        // Only allow updating if it's editable and user is the evaluator
        if (!$evaluation->can_edit || $evaluation->evaluator_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot edit this evaluation',
            ], 422);
        }
        
        $validator = Validator::make($request->all(), [
            'answers' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $evaluation->update([
            'answers' => $request->answers,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Evaluation updated successfully',
            'data' => $evaluation,
        ]);
    }

    /**
     * Submit evaluation to manager/admin
     */
    public function submit(Request $request, int $id)
    {
        $evaluation = EvaluationResponse::findOrFail($id);
        
        // Only evaluator can submit
        if ($evaluation->evaluator_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }
        
        // Only submittable evaluations
        if (!$evaluation->can_submit) {
            return response()->json([
                'success' => false,
                'message' => 'This evaluation cannot be submitted',
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'submitted_to' => 'required|exists:users,id',
            'submission_type' => 'required|in:manager,admin',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        // Verify the submission target is valid
        $targets = $this->accessService->getSubmissionTargets($evaluation->employee_id);
        $targetIds = array_column($targets, 'id');
        
        if (!in_array($request->submitted_to, $targetIds)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid submission target',
            ], 422);
        }

        $evaluation->submitTo($request->submitted_to, $request->submission_type);

        return response()->json([
            'success' => true,
            'message' => 'Evaluation submitted successfully',
            'data' => $evaluation->fresh(),
        ]);
    }

    /**
     * Approve evaluation
     */
    public function approve(Request $request, int $id)
    {
        $evaluation = EvaluationResponse::findOrFail($id);
        $user = auth()->user();
        
        if (!in_array($evaluation->status, ['submitted_to_manager', 'submitted_to_admin']) || 
            $evaluation->submitted_to !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot approve this evaluation',
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'feedback' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $evaluation->approve(auth()->id(), $request->feedback);

        // Update employee performance score in the latest open period
        $score = $evaluation->calculated_score;
        if ($score !== null) {
            $period = \App\Models\PayrollPeriod::open()->orderBy('end_date', 'desc')->first();
            if ($period) {
                \App\Models\PerformanceMonthlyScore::updateOrCreate(
                    [
                        'employee_id' => $evaluation->employee_id,
                        'period_id' => $period->id,
                    ],
                    [
                        'score' => $score,
                        'notes' => 'Auto-calculated from evaluation: ' . $evaluation->template->title,
                    ]
                );
                
                // Clear performance caches
                \Illuminate\Support\Facades\Cache::forget('performance_dashboard_kpis');
                \Illuminate\Support\Facades\Cache::forget('performance_team_data');
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Evaluation approved and score updated successfully',
            'data' => $evaluation->fresh(),
        ]);
    }

    /**
     * Reject evaluation
     */
    public function reject(Request $request, int $id)
    {
        $validator = Validator::make($request->all(), [
            'feedback' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $evaluation = EvaluationResponse::findOrFail($id);
        $user = auth()->user();
        
        if (!in_array($evaluation->status, ['submitted_to_manager', 'submitted_to_admin']) || 
            $evaluation->submitted_to !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot reject this evaluation',
            ], 422);
        }

        $evaluation->reject(auth()->id(), $request->feedback);

        return response()->json([
            'success' => true,
            'message' => 'Evaluation rejected successfully',
            'data' => $evaluation->fresh(),
        ]);
    }

    /**
     * Return evaluation to employee for revision
     */
    public function returnToEmployee(Request $request, int $id)
    {
        $validator = Validator::make($request->all(), [
            'feedback' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $evaluation = EvaluationResponse::findOrFail($id);
        $user = auth()->user();
        
        if (!in_array($evaluation->status, ['submitted_to_manager', 'submitted_to_admin']) || 
            $evaluation->submitted_to !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot return this evaluation',
            ], 422);
        }

        $evaluation->returnToEmployee(auth()->id(), $request->feedback);

        return response()->json([
            'success' => true,
            'message' => 'Evaluation returned to employee successfully',
            'data' => $evaluation->fresh(),
        ]);
    }

    /**
     * Delete evaluation (draft only)
     */
    public function destroy(int $id)
    {
        $evaluation = EvaluationResponse::findOrFail($id);
        
        // Only allow deleting drafts by the evaluator
        if ($evaluation->status !== 'draft' || $evaluation->evaluator_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete this evaluation',
            ], 422);
        }
        
        $evaluation->delete();

        return response()->json([
            'success' => true,
            'message' => 'Evaluation deleted successfully',
        ]);
    }
}
