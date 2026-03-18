<?php

namespace App\Services;

use App\Models\ApprovalAction;
use App\Models\ApprovalRequest;
use App\Models\NotificationOutbox;
use App\Models\PayrollRun;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * SubmitPayrollRunAction - Submit payroll run for approval
 * 
 * Creates approval request and queues notification.
 * CRITICAL: Must succeed even if notification fails.
 */
class SubmitPayrollRunAction
{
    public function __construct(
        private PayrollRunGuard $guard,
        private PayrollWorkflowResolver $workflowResolver,
        private PayrollNotificationService $notificationService
    ) {}

    /**
     * Submit payroll run for approval
     * 
     * @param PayrollRun $run
     * @param User $submitter
     * @param string|null $message
     * @return array ['approval_request_id' => int, 'run_status' => string]
     */
    public function execute(PayrollRun $run, User $submitter, ?string $message = null): array
    {
        $this->guard->assertSubmittable($run);

        return DB::transaction(function () use ($run, $submitter, $message) {
            // Resolve workflow automatically based on run characteristics
            $workflow = $this->workflowResolver->resolveWorkflow($run);
            
            // Get first approver from workflow
            $firstApproverId = $this->workflowResolver->getFirstApprover($workflow, $run);
            
            if (!$firstApproverId) {
                throw new \Exception('Unable to determine approver for this payroll run. Please check workflow configuration.');
            }

            // Create approval request
            $approvalRequest = ApprovalRequest::create([
                'request_number' => $this->generateRequestNumber(),
                'workflow_id' => $workflow->id,
                'requestable_type' => PayrollRun::class,
                'requestable_id' => $run->id,
                'requester_id' => $submitter->id,
                'status' => 'pending',
                'current_step' => 1,
                'current_approver_id' => $firstApproverId,
                'requester_comment' => $message,
                'submitted_at' => now(),
                'metadata' => [
                    'total_net' => $run->total_net,
                    'employee_count' => $run->employees()->count(),
                    'scope_type' => $run->scope_type,
                    'scope_ref_id' => $run->scope_ref_id,
                ],
            ]);

            // Update payroll run with auto-resolved approver
            $run->update([
                'status' => 'submitted',
                'submitted_at' => now(),
                'approval_request_id' => $approvalRequest->id,
                'approver_user_id' => $firstApproverId, // Set for backward compatibility
            ]);

            // Get first step for action logging
            $firstStep = $workflow->steps()->where('step_order', 1)->first();

            // Insert approval action (submitted)
            ApprovalAction::create([
                'request_id' => $approvalRequest->id,
                'step_id' => $firstStep?->id ?? 1,
                'approver_id' => $submitter->id,
                'action' => 'approved', // Submitter "approves" to move to next step
                'comment' => $message,
                'acted_at' => now(),
            ]);

            // Send notification to approver (MUST NOT fail the submission)
            try {
                $approver = User::find($firstApproverId);
                if ($approver) {
                    $this->notificationService->notifyApprovalPending($run, $approvalRequest, $approver);
                }
            } catch (\Exception $e) {
                Log::error('Failed to send approval notification', [
                    'run_id' => $run->id,
                    'error' => $e->getMessage(),
                ]);
            }

            Log::info("Payroll run submitted for approval", [
                'run_id' => $run->id,
                'approval_request_id' => $approvalRequest->id,
                'workflow_id' => $workflow->id,
                'workflow_name' => $workflow->name,
                'approver_id' => $firstApproverId,
            ]);

            return [
                'approval_request_id' => $approvalRequest->id,
                'run_status' => 'submitted',
                'workflow_name' => $workflow->name,
                'approver_name' => $approver->name ?? 'Unknown',
            ];
        });
    }

    /**
     * Generate unique approval request number
     * 
     * @return string
     */
    private function generateRequestNumber(): string
    {
        $year = date('Y');
        $lastRequest = ApprovalRequest::where('request_number', 'like', "PR-{$year}-%")
            ->orderBy('request_number', 'desc')
            ->first();

        if ($lastRequest && preg_match('/PR-\d{4}-(\d{5})/', $lastRequest->request_number, $matches)) {
            $number = intval($matches[1]) + 1;
        } else {
            $number = 1;
        }

        return "PR-{$year}-" . str_pad($number, 5, '0', STR_PAD_LEFT);
    }
}
