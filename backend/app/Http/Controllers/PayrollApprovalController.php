<?php

namespace App\Http\Controllers;

use App\Models\ApprovalRequest;
use App\Models\PayrollRun;
use App\Services\ApprovePayrollRunAction;
use App\Services\RejectPayrollRunAction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PayrollApprovalController extends Controller
{
    public function __construct(
        private ApprovePayrollRunAction $approveAction,
        private RejectPayrollRunAction $rejectAction
    ) {}

    /**
     * Get approval inbox for current user
     * GET /api/v1/approvals/inbox
     */
    public function inbox(Request $request)
    {
        $query = ApprovalRequest::where('current_approver_id', Auth::id())
            ->with(['requester:id,name', 'requestable']);

        // Filter by entity type
        if ($request->has('entity_type')) {
            $query->where('requestable_type', $this->getEntityClass($request->entity_type));
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        } else {
            // Default to pending only
            $query->where('status', 'pending');
        }

        $query->orderBy('submitted_at', 'desc');

        $approvals = $query->paginate($request->input('per_page', 50));

        return response()->json([
            'data' => $approvals->map(function ($approval) {
                return $this->formatApproval($approval);
            }),
            'meta' => [
                'current_page' => $approvals->currentPage(),
                'per_page' => $approvals->perPage(),
                'total' => $approvals->total(),
                'last_page' => $approvals->lastPage(),
            ],
        ]);
    }

    /**
     * Get single approval with full details
     * GET /api/v1/approvals/{id}
     */
    public function show(int $id)
    {
        $approval = ApprovalRequest::with([
            'requester:id,name',
            'requestable',
            'actions.approver:id,name'
        ])->findOrFail($id);

        // Get the payroll run details
        $run = null;
        if ($approval->requestable_type === PayrollRun::class) {
            $run = PayrollRun::with(['period', 'preparedBy:id,name', 'approver:id,name'])
                ->find($approval->requestable_id);
        }

        return response()->json([
            'data' => [
                'approval' => $this->formatApproval($approval),
                'run' => $run ? $this->formatPayrollRun($run) : null,
            ],
        ]);
    }

    /**
     * Approve approval request
     * POST /api/v1/approvals/{id}/approve
     */
    public function approve(Request $request, int $id)
    {
        $validated = $request->validate([
            'comment' => 'nullable|string|max:1000',
        ]);

        $approval = ApprovalRequest::findOrFail($id);

        // Get the payroll run
        if ($approval->requestable_type !== PayrollRun::class) {
            return response()->json([
                'message' => 'Only payroll run approvals are supported in v1',
            ], 400);
        }

        $run = PayrollRun::findOrFail($approval->requestable_id);

        $result = $this->approveAction->execute(
            $run,
            Auth::user(),
            $validated['comment'] ?? null
        );

        return response()->json([
            'data' => $result,
            'message' => 'Payroll run approved successfully',
        ]);
    }

    /**
     * Reject approval request
     * POST /api/v1/approvals/{id}/reject
     */
    public function reject(Request $request, int $id)
    {
        $validated = $request->validate([
            'decision_note' => 'required|string|max:1000',
        ]);

        $approval = ApprovalRequest::findOrFail($id);

        // Get the payroll run
        if ($approval->requestable_type !== PayrollRun::class) {
            return response()->json([
                'message' => 'Only payroll run approvals are supported in v1',
            ], 400);
        }

        $run = PayrollRun::findOrFail($approval->requestable_id);

        $result = $this->rejectAction->execute(
            $run,
            Auth::user(),
            $validated['decision_note']
        );

        return response()->json([
            'data' => $result,
            'message' => 'Payroll run rejected successfully',
        ]);
    }

    /**
     * Format approval for API response
     */
    private function formatApproval(ApprovalRequest $approval): array
    {
        $data = [
            'id' => $approval->id,
            'request_number' => $approval->request_number,
            'entity_type' => $this->getEntityTypeName($approval->requestable_type),
            'entity_id' => $approval->requestable_id,
            'requester' => $approval->requester->name ?? 'Unknown',
            'requester_id' => $approval->requester_id,
            'status' => $approval->status,
            'current_step' => $approval->current_step,
            'requester_comment' => $approval->requester_comment,
            'submitted_at' => $approval->submitted_at?->toIso8601String(),
            'completed_at' => $approval->completed_at?->toIso8601String(),
            'created_at' => $approval->created_at->toIso8601String(),
        ];

        // Add rejection comment if rejected
        if ($approval->status === 'rejected') {
            $rejectionAction = $approval->actions()
                ->where('action', 'rejected')
                ->latest()
                ->first();

            $data['rejection_comment'] = $rejectionAction?->comment;
        }

        // Add entity summary for payroll runs
        if ($approval->requestable_type === PayrollRun::class && $approval->requestable) {
            $run = $approval->requestable;
            $data['entity_summary'] = [
                'total_net' => (float) $run->total_net,
                'employee_count' => $run->employees()->count(),
                'period_name' => $run->period->name ?? 'Unknown',
            ];
        }

        return $data;
    }

    /**
     * Format payroll run for API response
     */
    private function formatPayrollRun(PayrollRun $run): array
    {
        return [
            'id' => $run->id,
            'period_name' => $run->period->name ?? 'Unknown',
            'status' => $run->status,
            'prepared_by' => $run->preparedBy->name ?? 'Unknown',
            'total_gross' => (float) $run->total_gross,
            'total_deductions' => (float) $run->total_deductions,
            'total_net' => (float) $run->total_net,
            'employee_count' => $run->employees()->count(),
            'note' => $run->note,
        ];
    }

    /**
     * Get entity class from type name
     */
    private function getEntityClass(string $type): string
    {
        return match($type) {
            'payroll_run' => PayrollRun::class,
            default => PayrollRun::class,
        };
    }

    /**
     * Get entity type name from class
     */
    private function getEntityTypeName(string $class): string
    {
        return match($class) {
            PayrollRun::class => 'payroll_run',
            default => 'unknown',
        };
    }
}
