<?php

namespace App\Services;

use App\Models\ApprovalWorkflow;
use App\Models\ApprovalRequest;
use App\Models\ApprovalAction;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class WorkflowEngine
{
    protected $auditLogger;

    public function __construct(AuditLogger $auditLogger)
    {
        $this->auditLogger = $auditLogger;
    }

    /**
     * Initiate approval workflow for an entity
     */
    public function initiateApproval(Model $entity, string $workflowCode, User $requester, ?string $comment = null): ApprovalRequest
    {
        return DB::transaction(function () use ($entity, $workflowCode, $requester, $comment) {
            // Find active workflow
            $workflow = ApprovalWorkflow::where('code', $workflowCode)
                ->where('is_active', true)
                ->firstOrFail();

            // Check if workflow conditions are met
            if (!$workflow->conditionsMet($entity)) {
                throw new \Exception('Workflow conditions not met for this request');
            }

            // Get first step
            $firstStep = $workflow->steps()->where('step_order', 1)->firstOrFail();
            
            // Get approver(s) for first step
            $approvers = $firstStep->getApprovers($requester);
            
            if (empty($approvers)) {
                throw new \Exception('No approver found for the first step');
            }

            // Create approval request
            $request = ApprovalRequest::create([
                'request_number' => ApprovalRequest::generateRequestNumber(),
                'workflow_id' => $workflow->id,
                'requestable_type' => get_class($entity),
                'requestable_id' => $entity->id,
                'requester_id' => $requester->id,
                'status' => 'pending',
                'current_step' => 1,
                'current_approver_id' => $approvers[0]->id ?? null,
                'requester_comment' => $comment,
                'submitted_at' => now(),
            ]);

            // Log audit trail
            $this->auditLogger->log(
                'approval_initiated',
                get_class($request),
                $request->id,
                null,
                $request->toArray()
            );

            // Send notification to approver(s)
            try {
                \Illuminate\Support\Facades\Notification::send($approvers, new \App\Notifications\SystemNotification(
                    'PENDING_REVIEW',
                    'Pending Approval',
                    'Approval request #' . $request->request_number . ' awaits your action.',
                    '/approvals',
                    'HIGH',
                    [
                        'requester' => optional($requester)->name,
                        'module'    => class_basename($entity),
                    ]
                ));
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Failed to send approval notification', ['error' => $e->getMessage()]);
            }

            return $request->load(['workflow', 'requester', 'currentApprover']);
        });
    }

    /**
     * Approve a request
     */
    public function approve(ApprovalRequest $request, User $approver, ?string $comment = null): ApprovalRequest
    {
        return DB::transaction(function () use ($request, $approver, $comment) {
            // Verify approver can approve
            if (!$request->canBeApprovedBy($approver)) {
                throw new \Exception('You are not authorized to approve this request');
            }

            $currentStep = $request->getCurrentStep();

            // Record approval action
            ApprovalAction::create([
                'request_id' => $request->id,
                'step_id' => $currentStep->id,
                'approver_id' => $approver->id,
                'action' => 'approved',
                'comment' => $comment,
                'acted_at' => now(),
            ]);

            // Check if there are more steps
            $nextStep = $request->workflow->steps()
                ->where('step_order', $request->current_step + 1)
                ->first();

            if ($nextStep) {
                // Move to next step
                $nextApprovers = $nextStep->getApprovers($request->requester);
                
                if (empty($nextApprovers)) {
                    throw new \Exception('No approver found for the next step');
                }

                $request->update([
                    'current_step' => $nextStep->step_order,
                    'current_approver_id' => $nextApprovers[0]->id ?? null,
                ]);

                // Notify next approver
                try {
                    \Illuminate\Support\Facades\Notification::send($nextApprovers, new \App\Notifications\SystemNotification(
                        'PENDING_REVIEW',
                        'Pending Approval',
                        'Approval request #' . $request->request_number . ' awaits your action.',
                        '/approvals',
                        'HIGH',
                        [
                            'requester' => optional($request->requester)->name,
                            'module'    => class_basename($request->requestable_type),
                        ]
                    ));
                } catch (\Exception $e) {
                    // Log or ignore
                }
            } else {
                // Final approval - complete the request
                $request->update([
                    'status' => 'approved',
                    'completed_at' => now(),
                ]);

                // Update the entity status
                $this->updateEntityStatus($request->requestable, 'approved');

                // Notify requester
                // $request->requester->notify(new ApprovalCompletedNotification($request));
            }

            // Log audit trail
            $this->auditLogger->log(
                'approval_action',
                get_class($request),
                $request->id,
                ['action' => 'approved', 'step' => $currentStep->step_order],
                $request->fresh()->toArray()
            );

            return $request->fresh(['workflow', 'requester', 'currentApprover', 'actions']);
        });
    }

    /**
     * Reject a request
     */
    public function reject(ApprovalRequest $request, User $approver, string $comment): ApprovalRequest
    {
        return DB::transaction(function () use ($request, $approver, $comment) {
            // Verify approver can reject
            if (!$request->canBeApprovedBy($approver)) {
                throw new \Exception('You are not authorized to reject this request');
            }

            $currentStep = $request->getCurrentStep();

            // Record rejection action
            ApprovalAction::create([
                'request_id' => $request->id,
                'step_id' => $currentStep->id,
                'approver_id' => $approver->id,
                'action' => 'rejected',
                'comment' => $comment,
                'acted_at' => now(),
            ]);

            // Update request status
            $request->update([
                'status' => 'rejected',
                'completed_at' => now(),
            ]);

            // Update entity status
            $this->updateEntityStatus($request->requestable, 'rejected');

            // Notify requester
            // $request->requester->notify(new ApprovalRejectedNotification($request));

            // Log audit trail
            $this->auditLogger->log(
                'approval_action',
                get_class($request),
                $request->id,
                ['action' => 'rejected', 'step' => $currentStep->step_order],
                $request->fresh()->toArray()
            );

            return $request->fresh(['workflow', 'requester', 'currentApprover', 'actions']);
        });
    }

    /**
     * Cancel a request (by requester)
     */
    public function cancel(ApprovalRequest $request, User $user, string $reason): ApprovalRequest
    {
        return DB::transaction(function () use ($request, $user, $reason) {
            if ($request->requester_id !== $user->id) {
                throw new \Exception('Only the requester can cancel this request');
            }

            if ($request->status !== 'pending') {
                throw new \Exception('Only pending requests can be cancelled');
            }

            $request->update([
                'status' => 'cancelled',
                'completed_at' => now(),
                'metadata' => array_merge($request->metadata ?? [], ['cancellation_reason' => $reason]),
            ]);

            // Update entity status
            $this->updateEntityStatus($request->requestable, 'cancelled');

            // Log audit trail
            $this->auditLogger->log(
                'approval_cancelled',
                get_class($request),
                $request->id,
                null,
                $request->fresh()->toArray()
            );

            return $request->fresh();
        });
    }

    /**
     * Get pending approvals for a user
     */
    public function getPendingApprovals(User $user, array $filters = [])
    {
        $query = ApprovalRequest::where('status', 'pending')
            ->where('current_approver_id', $user->id)
            ->with(['workflow', 'requester', 'requestable']);

        if (isset($filters['module'])) {
            $query->whereHas('workflow', function ($q) use ($filters) {
                $q->where('module', $filters['module']);
            });
        }

        return $query->orderBy('submitted_at', 'asc')->get();
    }

    /**
     * Update entity status after approval/rejection
     */
    protected function updateEntityStatus(Model $entity, string $status): void
    {
        if (method_exists($entity, 'updateApprovalStatus')) {
            $entity->updateApprovalStatus($status);
        } elseif ($entity->hasAttribute('approval_status')) {
            $entity->update(['approval_status' => $status]);
        } elseif ($entity->hasAttribute('status')) {
            $entity->update(['status' => $status]);
        }
    }
}
