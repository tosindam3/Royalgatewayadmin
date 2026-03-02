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
 * Approved runs become immutable.
 */
class ApprovePayrollRunAction
{
    public function __construct(
        private PayrollRunGuard $guard
    ) {}

    /**
     * Approve payroll run
     * 
     * @param PayrollRun $run
     * @param User $approver
     * @param string|null $comment
     * @return array ['run_status' => string, 'approval_status' => string]
     */
    public function execute(PayrollRun $run, User $approver, ?string $comment = null): array
    {
        $this->guard->assertApprovable($run, $approver);

        return DB::transaction(function () use ($run, $approver, $comment) {
            // Lock approval request row FOR UPDATE
            $approvalRequest = ApprovalRequest::lockForUpdate()
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

            // Update approval request
            $approvalRequest->update([
                'status' => 'approved',
                'completed_at' => now(),
            ]);

            // Update payroll run
            $run->update([
                'status' => 'approved',
                'approved_at' => now(),
            ]);

            // Insert approval action
            ApprovalAction::create([
                'request_id' => $approvalRequest->id,
                'step_id' => 1, // v1: single step
                'approver_id' => $approver->id,
                'action' => 'approved',
                'comment' => $comment,
                'acted_at' => now(),
            ]);

            Log::info("Payroll run approved", [
                'run_id' => $run->id,
                'approval_request_id' => $approvalRequest->id,
                'approver_id' => $approver->id,
            ]);

            return [
                'run_status' => 'approved',
                'approval_status' => 'approved',
            ];
        });
    }
}
