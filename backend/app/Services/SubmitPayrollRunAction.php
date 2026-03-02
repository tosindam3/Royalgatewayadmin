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
        private PayrollRunGuard $guard
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
            // Create approval request
            $approvalRequest = ApprovalRequest::create([
                'request_number' => $this->generateRequestNumber(),
                'workflow_id' => $this->getPayrollWorkflowId(),
                'requestable_type' => PayrollRun::class,
                'requestable_id' => $run->id,
                'requester_id' => $submitter->id,
                'status' => 'pending',
                'current_step' => 1,
                'current_approver_id' => $run->approver_user_id,
                'requester_comment' => $message,
                'submitted_at' => now(),
            ]);

            // Update payroll run
            $run->update([
                'status' => 'submitted',
                'submitted_at' => now(),
                'approval_request_id' => $approvalRequest->id,
            ]);

            // Insert approval action (submitted)
            ApprovalAction::create([
                'request_id' => $approvalRequest->id,
                'step_id' => 1, // v1: single step
                'approver_id' => $submitter->id,
                'action' => 'approved', // Submitter "approves" to move to next step
                'comment' => $message,
                'acted_at' => now(),
            ]);

            // Queue notification (MUST NOT fail the submission)
            $this->queueNotification($run, $approvalRequest, $message);

            Log::info("Payroll run submitted for approval", [
                'run_id' => $run->id,
                'approval_request_id' => $approvalRequest->id,
                'approver_id' => $run->approver_user_id,
            ]);

            return [
                'approval_request_id' => $approvalRequest->id,
                'run_status' => 'submitted',
            ];
        });
    }

    /**
     * Queue notification for approver
     * 
     * @param PayrollRun $run
     * @param ApprovalRequest $approvalRequest
     * @param string|null $message
     * @return void
     */
    private function queueNotification(PayrollRun $run, ApprovalRequest $approvalRequest, ?string $message): void
    {
        try {
            NotificationOutbox::create([
                'channel' => 'memo',
                'event_key' => 'payroll_submitted',
                'recipient_user_id' => $run->approver_user_id,
                'payload_json' => [
                    'run_id' => $run->id,
                    'approval_request_id' => $approvalRequest->id,
                    'period_name' => $run->period->name,
                    'total_gross' => $run->total_gross,
                    'total_net' => $run->total_net,
                    'employee_count' => $run->employees()->count(),
                    'message' => $message,
                    'submitted_by' => $run->preparedBy->name,
                    'submitted_at' => $run->submitted_at->toIso8601String(),
                ],
                'status' => 'pending',
                'attempts' => 0,
            ]);

            Log::info("Notification queued for payroll submission", [
                'run_id' => $run->id,
                'recipient_id' => $run->approver_user_id,
            ]);
        } catch (\Exception $e) {
            // CRITICAL: Never fail submission if notification fails
            Log::error("Failed to queue notification for payroll submission", [
                'run_id' => $run->id,
                'error' => $e->getMessage(),
            ]);
        }
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

    /**
     * Get payroll workflow ID (or create if not exists)
     * 
     * @return int
     */
    private function getPayrollWorkflowId(): int
    {
        $workflow = \App\Models\ApprovalWorkflow::where('code', 'payroll_run_approval')->first();
        
        if (!$workflow) {
            throw new \Exception('Payroll approval workflow not found. Please run PayrollWorkflowSeeder.');
        }
        
        return $workflow->id;
    }
}
