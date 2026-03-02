<?php

namespace App\Http\Controllers;

use App\Models\PayrollRun;
use App\Models\PayrollRunEmployee;
use App\Services\PayrollRunBuilder;
use App\Services\PayrollRunGuard;
use App\Services\SubmitPayrollRunAction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PayrollRunController extends Controller
{
    public function __construct(
        private PayrollRunBuilder $builder,
        private PayrollRunGuard $guard,
        private SubmitPayrollRunAction $submitAction
    ) {}

    /**
     * List payroll runs
     * GET /api/v1/payroll/runs
     */
    public function index(Request $request)
    {
        $query = PayrollRun::with(['period', 'preparedBy:id,name', 'approver:id,name']);

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
        $validated = $request->validate([
            'period_id' => 'required|exists:payroll_periods,id',
            'scope_type' => 'required|in:all,department,branch,custom',
            'scope_ref_id' => 'nullable|integer',
            'approver_user_id' => 'required|exists:users,id',
            'note' => 'nullable|string|max:1000',
        ]);

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
                        'name' => $emp->employee->user->name ?? 'Unknown',
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

        $this->guard->assertRecalculatable($run);

        $run = $this->builder->recalculate($run);

        return response()->json([
            'data' => $this->formatRun($run),
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
