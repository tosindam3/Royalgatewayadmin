<?php

namespace App\Http\Controllers;

use App\Models\PayrollRun;
use App\Models\PayrollRunEmployee;
use App\Models\User;
use App\Services\PayrollRunBuilder;
use App\Services\PayrollRunGuard;
use App\Services\SubmitPayrollRunAction;
use App\Services\ScopeEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PayrollRunController extends Controller
{
    public function __construct(
        private PayrollRunBuilder $builder,
        private PayrollRunGuard $guard,
        private SubmitPayrollRunAction $submitAction,
        private ScopeEngine $scopeEngine
    ) {}

    /**
     * List payroll runs
     * GET /api/v1/payroll/runs
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Check permission
        if (!$user->hasPermission('payroll.view')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $scope = $this->scopeEngine->getUserScope($user, 'payroll.view');
        $query = PayrollRun::with(['period', 'preparedBy:id,name', 'approver:id,name']);

        // Apply RBAC scoping to PayrollRun list
        if ($scope !== 'all') {
            $employee = $user->employeeProfile;
            if (!$employee) {
                return response()->json(['data' => [], 'meta' => ['total' => 0]], 200);
            }

            switch ($scope) {
                case 'branch':
                    $query->where(function ($q) use ($employee) {
                        $q->where('scope_type', 'branch')->where('scope_ref_id', $employee->branch_id)
                          ->orWhere('scope_type', 'department')->whereIn('scope_ref_id', function ($sub) use ($employee) {
                              $sub->select('id')->from('departments')->where('branch_id', $employee->branch_id);
                          });
                    });
                    break;
                case 'department':
                    $query->where('scope_type', 'department')->where('scope_ref_id', $employee->department_id);
                    break;
                case 'team':
                case 'self':
                    // Typically runs aren't created for team/self scope in the same way, 
                    // but we restrict to what they can see.
                    $query->whereRaw('1 = 0'); 
                    break;
                default:
                    $query->whereRaw('1 = 0');
            }
        }

        // Filter by period
        if ($request->has('period_id')) {
            $query->where('period_id', $request->period_id);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by scope type
        if ($request->has('scope_type')) {
            $query->where('scope_type', $request->scope_type);
        }

        // Order by most recent
        $query->orderBy('created_at', 'desc');

        $runs = $query->paginate($request->input('per_page', 50));

        return response()->json([
            'data' => $runs->map(function ($run) {
                return $this->formatRun($run);
            }),
            'meta' => [
                'current_page' => $runs->currentPage(),
                'per_page' => $runs->perPage(),
                'total' => $runs->total(),
                'last_page' => $runs->lastPage(),
            ],
        ]);
    }

    /**
     * Create payroll run
     * POST /api/v1/payroll/runs
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if (!$user->hasPermission('payroll.process')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'period_id' => 'required|exists:payroll_periods,id',
            'scope_type' => 'required|in:all,department,branch,custom',
            'scope_ref_id' => 'nullable|integer',
            'note' => 'nullable|string|max:1000',
        ]);

        // Validate that user has authority for this scope
        $scope = $this->scopeEngine->getUserScope($user, 'payroll.process');
        if ($scope !== 'all') {
            $employee = $user->employeeProfile;
            if (!$employee) return response()->json(['message' => 'Employee profile required'], 403);

            if ($validated['scope_type'] === 'all') {
                return response()->json(['message' => 'You do not have permission to run payroll for the entire organization'], 403);
            }

            if ($validated['scope_type'] === 'branch' && $validated['scope_ref_id'] != $employee->branch_id) {
                return response()->json(['message' => 'You can only run payroll for your own branch'], 403);
            }

            if ($validated['scope_type'] === 'department') {
                if ($scope === 'department' && $validated['scope_ref_id'] != $employee->department_id) {
                    return response()->json(['message' => 'You can only run payroll for your own department'], 403);
                }
                // Branch managers can run for departments in their branch
                if ($scope === 'branch') {
                    $dept = \App\Models\Department::find($validated['scope_ref_id']);
                    if (!$dept || $dept->branch_id != $employee->branch_id) {
                        return response()->json(['message' => 'Department not in your branch'], 403);
                    }
                }
            }
        }

        $run = $this->builder->create($validated, Auth::user());

        return response()->json([
            'data' => $this->formatRun($run),
        ], 201);
    }

    /**
     * Get single payroll run
     * GET /api/v1/payroll/runs/{id}
     */
    public function show(int $id)
    {
        $run = PayrollRun::with([
            'period',
            'preparedBy:id,name',
            'approver:id,name',
            'approvalRequest.actions.approver:id,name'
        ])->findOrFail($id);

        if (!$this->canAccessRun($run, Auth::user())) {
            return response()->json(['message' => 'Unauthorized access to this payroll run'], 403);
        }

        $data = $this->formatRun($run);

        // Add rejection comment if rejected
        if ($run->status === 'rejected' && $run->approvalRequest) {
            $rejectionAction = $run->approvalRequest->actions()
                ->where('action', 'rejected')
                ->latest()
                ->first();

            $data['rejection_comment'] = $rejectionAction?->comment;
        }

        return response()->json(['data' => $data]);
    }

    /**
     * Get payroll run employees (paginated)
     * GET /api/v1/payroll/runs/{id}/employees
     */
    public function employees(Request $request, int $id)
    {
        $run = PayrollRun::findOrFail($id);

        if (!$this->canAccessRun($run, Auth::user())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $employees = PayrollRunEmployee::where('payroll_run_id', $id)
            ->with(['employee.user:id,name', 'employee.department:id,name', 'employee.branch:id,name'])
            ->orderBy('net_pay', 'desc')
            ->paginate($request->input('per_page', 50));

        return response()->json([
            'data' => $employees->map(function ($emp) {
                return [
                    'id' => $emp->id,
                    'employee' => [
                        'id' => $emp->employee->id,
                        'name' => $emp->employee?->user?->name ?? $emp->employee?->full_name ?? 'Unknown',
                        'staff_id' => $emp->employee->staff_id,
                        'department' => $emp->employee->department->name ?? '—',
                        'branch' => $emp->employee->branch->name ?? '—',
                    ],
                    'base_salary_snapshot' => (float) $emp->base_salary_snapshot,
                    'absent_days' => $emp->absent_days,
                    'late_minutes' => $emp->late_minutes,
                    'overtime_hours' => (float) $emp->overtime_hours,
                    'performance_score' => $emp->performance_score,
                    'gross_pay' => (float) $emp->gross_pay,
                    'total_deductions' => (float) $emp->total_deductions,
                    'net_pay' => (float) $emp->net_pay,
                ];
            }),
            'meta' => [
                'current_page' => $employees->currentPage(),
                'per_page' => $employees->perPage(),
                'total' => $employees->total(),
                'last_page' => $employees->lastPage(),
            ],
        ]);
    }

    /**
     * Get employee breakdown (lazy-loaded)
     * GET /api/v1/payroll/runs/{runId}/employees/{employeeId}/breakdown
     */
    public function employeeBreakdown(int $runId, int $employeeId)
    {
        $run = PayrollRun::findOrFail($runId);
        if (!$this->canAccessRun($run, Auth::user())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $payrollEmployee = PayrollRunEmployee::where('payroll_run_id', $runId)
            ->where('employee_id', $employeeId)
            ->with('employee')
            ->firstOrFail();

        return response()->json([
            'data' => [
                'earnings' => $payrollEmployee->earnings_json ?? [],
                'deductions' => $payrollEmployee->deductions_json ?? [],
                'snapshot' => [
                    'base_salary' => (float) $payrollEmployee->base_salary_snapshot,
                    'absent_days' => $payrollEmployee->absent_days,
                    'late_minutes' => $payrollEmployee->late_minutes,
                    'overtime_hours' => (float) $payrollEmployee->overtime_hours,
                    'performance_score' => $payrollEmployee->performance_score,
                ],
            ],
        ]);
    }

    /**
     * Recalculate payroll run
     * POST /api/v1/payroll/runs/{id}/recalculate
     */
    public function recalculate(int $id)
    {
        $run = PayrollRun::findOrFail($id);

        if (!$this->canAccessRun($run, Auth::user())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $this->guard->assertRecalculatable($run);

        $run = $this->builder->recalculate($run);

        return response()->json([
            'data' => $this->formatRun($run),
        ]);
    }

    /**
     * Adjust a payroll item for an employee
     * POST /api/v1/payroll/runs/{id}/adjust-item
     */
    public function adjustItem(Request $request, int $id)
    {
        $user = Auth::user();
        $isSuperOrCeo = in_array($user->role, ['super_admin', 'ceo']);
        $isHr = $user->role === 'hr_manager';

        if (!$isSuperOrCeo && !$isHr) {
            return response()->json(['message' => 'Unauthorized to make adjustments'], 403);
        }

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'item_code' => 'required|string',
            'amount' => 'required|numeric',
            'note' => 'nullable|string|max:500',
        ]);

        $run = PayrollRun::findOrFail($id);
        
        // Only allow adjustments on draft or review_required runs
        if (!in_array($run->status, ['draft', 'review_required', 'rejected'])) {
            return response()->json(['message' => 'Cannot adjust items for a run in ' . $run->status . ' state'], 400);
        }

        $payrollEmployee = PayrollRunEmployee::where('payroll_run_id', $id)
            ->where('employee_id', $validated['employee_id'])
            ->firstOrFail();

        $found = false;
        $earnings = $payrollEmployee->earnings_json ?? [];
        $deductions = $payrollEmployee->deductions_json ?? [];

        // Check earnings
        foreach ($earnings as &$item) {
            if ($item['code'] === $validated['item_code']) {
                $item['system_calculated'] = $item['system_calculated'] ?? $item['amount'];
                $item['adjustment'] = $validated['amount'] - $item['system_calculated'];
                $item['amount'] = $validated['amount'];
                $item['is_manual'] = true;
                $item['note'] = $validated['note'];
                $item['adjusted_by'] = $user->name;
                $found = true;
                break;
            }
        }

        if (!$found) {
            // Check deductions
            foreach ($deductions as &$item) {
                if ($item['code'] === $validated['item_code']) {
                    $item['system_calculated'] = $item['system_calculated'] ?? $item['amount'];
                    $item['adjustment'] = $validated['amount'] - $item['system_calculated'];
                    $item['amount'] = $validated['amount'];
                    $item['is_manual'] = true;
                    $item['note'] = $validated['note'];
                    $item['adjusted_by'] = $user->name;
                    $found = true;
                    break;
                }
            }
        }

        if (!$found) {
            return response()->json(['message' => 'Item code not found for this employee'], 404);
        }

        // Save updated JSONs
        $payrollEmployee->earnings_json = $earnings;
        $payrollEmployee->deductions_json = $deductions;

        // Recalculate totals for this employee
        $payrollEmployee->gross_pay = collect($earnings)->sum('amount');
        $payrollEmployee->total_deductions = collect($deductions)->sum('amount');
        $payrollEmployee->net_pay = $payrollEmployee->gross_pay - $payrollEmployee->total_deductions;
        $payrollEmployee->save();

        // If HR Manager, mark run as review_required
        if (!$isSuperOrCeo && $run->status !== 'review_required') {
            $run->status = 'review_required';
            $run->save();
        }

        // Update overall run totals
        $allEmployees = $run->employees();
        $run->total_gross = $allEmployees->sum('gross_pay');
        $run->total_deductions = $allEmployees->sum('total_deductions');
        $run->total_net = $allEmployees->sum('net_pay');
        $run->save();

        return response()->json([
            'message' => $isSuperOrCeo ? 'Item adjusted and recalculated.' : 'Adjustment submitted for review.',
            'data' => [
                'gross_pay' => (float)$payrollEmployee->gross_pay,
                'total_deductions' => (float)$payrollEmployee->total_deductions,
                'net_pay' => (float)$payrollEmployee->net_pay,
                'run_totals' => [
                    'gross' => (float)$run->total_gross,
                    'deductions' => (float)$run->total_deductions,
                    'net' => (float)$run->total_net,
                ]
            ]
        ]);
    }

    /**
     * Submit payroll run for approval
     * POST /api/v1/payroll/runs/{id}/submit
     */
    public function submit(Request $request, int $id)
    {
        $validated = $request->validate([
            'message' => 'nullable|string|max:1000',
        ]);

        $run = PayrollRun::findOrFail($id);
        
        if (!$this->canAccessRun($run, Auth::user())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $result = $this->submitAction->execute(
            $run,
            Auth::user(),
            $validated['message'] ?? null
        );

        return response()->json([
            'data' => $result,
        ]);
    }

    /**
     * Helper to check if user can access a payroll run
     */
    private function canAccessRun(PayrollRun $run, User $user): bool
    {
        $scope = $this->scopeEngine->getUserScope($user, 'payroll.view');

        if ($scope === 'all') {
            return true;
        }

        $employee = $user->employeeProfile;
        if (!$employee) return false;

        if ($run->scope_type === 'branch') {
            return $run->scope_ref_id == $employee->branch_id;
        }

        if ($run->scope_type === 'department') {
            if ($scope === 'branch') {
                $dept = \App\Models\Department::find($run->scope_ref_id);
                return $dept && $dept->branch_id == $employee->branch_id;
            }
            return $run->scope_ref_id == $employee->department_id;
        }

        return false;
    }

    /**
     * Format payroll run for API response
     */
    private function formatRun(PayrollRun $run): array
    {
        return [
            'id' => $run->id,
            'period_id' => $run->period_id,
            'period_name' => $run->period->name ?? 'Unknown',
            'scope_type' => $run->scope_type,
            'scope_ref_id' => $run->scope_ref_id,
            'status' => $run->status,
            'prepared_by' => $run->preparedBy->name ?? 'Unknown',
            'prepared_by_user_id' => $run->prepared_by_user_id,
            'approver' => $run->approver->name ?? 'Unknown',
            'approver_user_id' => $run->approver_user_id,
            'submitted_at' => $run->submitted_at?->toIso8601String(),
            'approved_at' => $run->approved_at?->toIso8601String(),
            'rejected_at' => $run->rejected_at?->toIso8601String(),
            'total_gross' => (float) $run->total_gross,
            'total_deductions' => (float) $run->total_deductions,
            'total_net' => (float) $run->total_net,
            'employee_count' => $run->employees()->count(),
            'note' => $run->note,
            'created_at' => $run->created_at->toIso8601String(),
            'updated_at' => $run->updated_at->toIso8601String(),
        ];
    }
}
