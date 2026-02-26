<?php

namespace App\Http\Controllers;

use App\Models\ApprovalRequest;
use App\Services\WorkflowEngine;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class ApprovalController extends Controller
{
    use ApiResponse;

    protected $workflowEngine;

    public function __construct(WorkflowEngine $workflowEngine)
    {
        $this->workflowEngine = $workflowEngine;
    }

    /**
     * Get pending approvals for current user
     */
    public function pending(Request $request)
    {
        $user = $request->user();
        
        $filters = [];
        if ($request->has('module')) {
            $filters['module'] = $request->module;
        }

        $approvals = $this->workflowEngine->getPendingApprovals($user, $filters);

        return $this->success($approvals);
    }

    /**
     * Get all approval requests (with filters)
     */
    public function index(Request $request)
    {
        $query = ApprovalRequest::with(['workflow', 'requester', 'currentApprover', 'requestable']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('requester_id')) {
            $query->where('requester_id', $request->requester_id);
        }

        if ($request->has('module')) {
            $query->whereHas('workflow', function ($q) use ($request) {
                $q->where('module', $request->module);
            });
        }

        if ($request->has('current_approver_id')) {
            $query->where('current_approver_id', $request->current_approver_id);
        }

        $approvals = $query->orderBy('submitted_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return $this->success($approvals);
    }

    /**
     * Get single approval request
     */
    public function show($id)
    {
        $approval = ApprovalRequest::with([
            'workflow.steps',
            'requester',
            'currentApprover',
            'requestable',
            'actions.approver',
            'actions.step'
        ])->findOrFail($id);

        return $this->success($approval);
    }

    /**
     * Approve a request
     */
    public function approve(Request $request, $id)
    {
        $validated = $request->validate([
            'comment' => 'nullable|string|max:1000',
        ]);

        try {
            $approvalRequest = ApprovalRequest::findOrFail($id);
            $user = $request->user();

            $result = $this->workflowEngine->approve(
                $approvalRequest,
                $user,
                $validated['comment'] ?? null
            );

            return $this->success($result, 'Request approved successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to approve request: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Reject a request
     */
    public function reject(Request $request, $id)
    {
        $validated = $request->validate([
            'comment' => 'required|string|max:1000',
        ]);

        try {
            $approvalRequest = ApprovalRequest::findOrFail($id);
            $user = $request->user();

            $result = $this->workflowEngine->reject(
                $approvalRequest,
                $user,
                $validated['comment']
            );

            return $this->success($result, 'Request rejected successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to reject request: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Cancel a request (by requester)
     */
    public function cancel(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        try {
            $approvalRequest = ApprovalRequest::findOrFail($id);
            $user = $request->user();

            $result = $this->workflowEngine->cancel(
                $approvalRequest,
                $user,
                $validated['reason']
            );

            return $this->success($result, 'Request cancelled successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to cancel request: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get approval history for a user
     */
    public function history(Request $request)
    {
        $user = $request->user();

        $query = ApprovalRequest::with(['workflow', 'requester', 'requestable'])
            ->where(function ($q) use ($user) {
                $q->where('requester_id', $user->id)
                  ->orWhereHas('actions', function ($q2) use ($user) {
                      $q2->where('approver_id', $user->id);
                  });
            });

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $history = $query->orderBy('submitted_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return $this->success($history);
    }

    /**
     * Get approval statistics
     */
    public function statistics(Request $request)
    {
        $user = $request->user();

        $stats = [
            'pending_approvals' => ApprovalRequest::where('current_approver_id', $user->id)
                ->where('status', 'pending')
                ->count(),
            'my_pending_requests' => ApprovalRequest::where('requester_id', $user->id)
                ->where('status', 'pending')
                ->count(),
            'approved_by_me' => ApprovalRequest::whereHas('actions', function ($q) use ($user) {
                $q->where('approver_id', $user->id)
                  ->where('action', 'approved');
            })->count(),
            'rejected_by_me' => ApprovalRequest::whereHas('actions', function ($q) use ($user) {
                $q->where('approver_id', $user->id)
                  ->where('action', 'rejected');
            })->count(),
        ];

        return $this->success($stats);
    }
}
