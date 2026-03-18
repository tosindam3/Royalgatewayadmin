<?php

namespace App\Services;

use App\Models\ApprovalAction;
use App\Models\ApprovalRequest;
use App\Models\PayrollRun;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * ApprovePayrollRunAction - Approve payroll run
 * 
 * Uses row locking to prevent double-approval.
 * Supports multi-level approval workflows.
 * Approved runs become immutable.
 */
class ApprovePayrollRunAction
{
    public function __construct(
        private PayrollRunGuard $guard,
        private PayrollWorkflowResolver $workflowResolver,
        private PayrollNotificationService $notificationService
    ) {}

    /**
     * Approve payroll run
     * 
     * @param PayrollRun $run
     * @param User $approver
     * @param string|null $comment
     * @return array ['run_status' => string, 'approval_status' => string, 'next_approver' => string|null]
     */
    public function execute(PayrollRun $run, User $approver, ?string $comment = null): array
    {
        $this->guard->assertApprovable($run, $approver);

        return DB::transaction(function () use ($run, $approver, $comment) {
            // Lock approval request row FOR UPDATE
            $approvalRequest = ApprovalRequest::lockForUpdate()
                ->with('workflow.steps')
                ->findOrFail($run->approval_request_id);

            // Lock payroll run row FOR UPDATE
            $run = PayrollRun::lockForUpdate()->findOrFail($run->id);

            // Validate state (double-check after locking)
            if ($approvalRequest->status !== 'pending') {
                throw new \Symfony\Component\HttpKernel\Exception\ConflictHttpException(
                    "Approval request has already been processed. Status: {$approvalRequest->status}"
                );
            }

            if ($run->status !== 'submitted') {
                throw new \Symfony\Component\HttpKernel\Exception\ConflictHttpException(
                    "Payroll run is not in submitted status. Current status: {$run->status}"
                );
            }

            // Get current step
            $currentStep = $approvalRequest->workflow->steps()
                ->where('step_order', $approvalRequest->current_step)
                ->first();

            if (!$currentStep) {
                throw new \Exception('Current approval step not found in workflow');
            }

            // Insert approval action for current step
            ApprovalAction::create([
                'request_id' => $approvalRequest->id,
                'step_id' => $currentStep->id,
                'approver_id' => $approver->id,
                'action' => 'approved',
                'comment' => $comment,
                'acted_at' => now(),
            ]);

            // Check if there are more steps
            $nextStep = $approvalRequest->workflow->steps()
                ->where('step_order', $approvalRequest->current_step + 1)
                ->first();

            if ($nextStep) {
                // Move to next step
                $nextApprovers = $this->workflowResolver->resolveApproversForStep($run, $nextStep);
                
                if (empty($nextApprovers)) {
                    throw new \Exception("No approvers found for step {$nextStep->step_order}: {$nextStep->name}");
                }

                $nextApproverId = $nextApprovers[0];

                $approvalRequest->update([
                    'current_step' => $approvalRequest->current_step + 1,
                    'current_approver_id' => $nextApproverId,
                ]);

                $run->update([
                    'approver_user_id' => $nextApproverId,
                ]);

                // Notify next approver
                try {
                    $nextApprover = User::find($nextApproverId);
                    if ($nextApprover) {
                        $this->notificationService->notifyApprovalPending($run, $approvalRequest, $nextApprover);
                    }
                } catch (\Exception $e) {
                    Log::error('Failed to notify next approver', [
                        'run_id' => $run->id,
                        'next_approver_id' => $nextApproverId,
                        'error' => $e->getMessage(),
                    ]);
                }

                Log::info("Payroll run approved - moved to next step", [
                    'run_id' => $run->id,
                    'approval_request_id' => $approvalRequest->id,
                    'approver_id' => $approver->id,
                    'current_step' => $approvalRequest->current_step,
                    'next_step' => $nextStep->name,
                    'next_approver_id' => $nextApproverId,
                ]);

                $nextApproverUser = User::find($nextApproverId);

                return [
                    'run_status' => 'submitted',
                    'approval_status' => 'pending',
                    'next_step' => $nextStep->name,
                    'next_approver' => $nextApproverUser?->name ?? 'Unknown',
                ];
            } else {
                // Final approval - complete the request
                $approvalRequest->update([
                    'status' => 'approved',
                    'completed_at' => now(),
                ]);

                $run->update([
                    'status' => 'approved',
                    'approved_at' => now(),
                ]);

                // Notify preparer of final approval
                try {
                    $this->notificationService->notifyApprovalApproved($run, $approver);
                } catch (\Exception $e) {
                    Log::error('Failed to notify preparer of approval', [
                        'run_id' => $run->id,
                        'error' => $e->getMessage(),
                    ]);
                }

                Log::info("Payroll run fully approved", [
                    'run_id' => $run->id,
                    'approval_request_id' => $approvalRequest->id,
                    'final_approver_id' => $approver->id,
                ]);

                return [
                    'run_status' => 'approved',
                    'approval_status' => 'approved',
                    'next_approver' => null,
                ];
            }
        });
    }
}
