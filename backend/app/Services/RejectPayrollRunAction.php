<?php

namespace App\Services;

use App\Models\ApprovalAction;
use App\Models\ApprovalRequest;
use App\Models\PayrollRun;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * RejectPayrollRunAction - Reject payroll run
 * 
 * Uses row locking to prevent double-rejection.
 * Rejected runs become editable again.
 * Comment is REQUIRED.
 */
class RejectPayrollRunAction
{
    public function __construct(
        private PayrollRunGuard $guard,
        private PayrollNotificationService $notificationService
    ) {}

    /**
     * Reject payroll run
     * 
     * @param PayrollRun $run
     * @param User $approver
     * @param string $comment (REQUIRED)
     * @return array ['run_status' => string, 'approval_status' => string]
     */
    public function execute(PayrollRun $run, User $approver, string $comment): array
    {
        if (empty(trim($comment))) {
            throw new \Illuminate\Validation\ValidationException(
                validator([], []),
                ['decision_note' => ['Rejection comment is required.']]
            );
        }

        $this->guard->assertRejectable($run, $approver);

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

            // Update approval request
            $approvalRequest->update([
                'status' => 'rejected',
                'completed_at' => now(),
                'metadata' => array_merge(
                    $approvalRequest->metadata ?? [],
                    ['rejection_comment' => $comment]
                ),
            ]);

            // Update payroll run
            $run->update([
                'status' => 'rejected',
                'rejected_at' => now(),
            ]);

            // Insert approval action
            ApprovalAction::create([
                'request_id' => $approvalRequest->id,
                'step_id' => $currentStep?->id ?? 1,
                'approver_id' => $approver->id,
                'action' => 'rejected',
                'comment' => $comment,
                'acted_at' => now(),
            ]);

            // Notify preparer of rejection
            try {
                $this->notificationService->notifyApprovalRejected($run, $approver, $comment);
            } catch (\Exception $e) {
                Log::error('Failed to notify preparer of rejection', [
                    'run_id' => $run->id,
                    'error' => $e->getMessage(),
                ]);
            }

            Log::info("Payroll run rejected", [
                'run_id' => $run->id,
                'approval_request_id' => $approvalRequest->id,
                'approver_id' => $approver->id,
                'comment' => $comment,
            ]);

            return [
                'run_status' => 'rejected',
                'approval_status' => 'rejected',
            ];
        });
    }
}
