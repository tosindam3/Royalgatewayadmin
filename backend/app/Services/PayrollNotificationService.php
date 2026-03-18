<?php

namespace App\Services;

use App\Models\PayrollRun;
use App\Models\ApprovalRequest;
use App\Models\User;
use App\Models\Memo;
use App\Models\MemoRecipient;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;

/**
 * PayrollNotificationService - Sends notifications for payroll events
 * 
 * Integrates with:
 * - Memo system (internal messaging)
 * - Email notifications
 * - Push notifications (future)
 * 
 * CRITICAL: This service MUST NEVER throw exceptions.
 * All failures are logged and gracefully handled.
 */
class PayrollNotificationService
{
    /**
     * Notify approver about pending payroll approval
     */
    public function notifyApprovalPending(PayrollRun $run, ApprovalRequest $approvalRequest, User $approver): bool
    {
        try {
            $preparer = $run->preparedBy;
            
            // Create internal memo
            $this->sendMemo(
                sender: $preparer,
                recipient: $approver,
                subject: "🔔 Payroll Approval Required: {$run->period->name}",
                body: $this->buildApprovalPendingBody($run, $approvalRequest, $preparer),
                priority: 'high',
                metadata: [
                    'type' => 'payroll_approval_request',
                    'run_id' => $run->id,
                    'approval_request_id' => $approvalRequest->id,
                    'action_url' => '/payroll?tab=Approvals',
                ]
            );

            // Send email notification (if configured)
            if ($approver->email && config('mail.enabled', false)) {
                $this->sendEmail(
                    to: $approver->email,
                    subject: "Payroll Approval Required: {$run->period->name}",
                    template: 'payroll-approval-pending',
                    data: [
                        'approver_name' => $approver->name,
                        'request_number' => $approvalRequest->request_number,
                        'period_name' => $run->period->name ?? 'Unknown Period',
                        'total_net' => number_format($run->total_net, 2),
                        'employee_count' => $run->employees()->count(),
                        'prepared_by' => $preparer->name,
                        'submitted_at' => $run->submitted_at?->format('Y-m-d H:i:s'),
                        'approval_url' => config('app.frontend_url') . '/payroll?tab=Approvals',
                        'requester_comment' => $approvalRequest->requester_comment,
                    ]
                );
            }

            Log::info('Payroll approval notification sent', [
                'run_id' => $run->id,
                'approver_id' => $approver->id,
                'approval_request_id' => $approvalRequest->id,
                'channels' => ['memo', 'email'],
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send payroll approval notification', [
                'run_id' => $run->id,
                'approver_id' => $approver->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return false;
        }
    }

    /**
     * Notify preparer that payroll was approved
     */
    public function notifyApprovalApproved(PayrollRun $run, User $approver): bool
    {
        try {
            $preparer = $run->preparedBy;
            
            // Create internal memo
            $this->sendMemo(
                sender: $approver,
                recipient: $preparer,
                subject: "✅ Payroll Approved: {$run->period->name}",
                body: $this->buildApprovalApprovedBody($run, $approver),
                priority: 'normal',
                metadata: [
                    'type' => 'payroll_approved',
                    'run_id' => $run->id,
                    'action_url' => '/payroll?tab=Periods',
                ]
            );

            // Send email notification
            if ($preparer->email && config('mail.enabled', false)) {
                $this->sendEmail(
                    to: $preparer->email,
                    subject: "Payroll Run Approved: {$run->period->name}",
                    template: 'payroll-approved',
                    data: [
                        'preparer_name' => $preparer->name,
                        'period_name' => $run->period->name ?? 'Unknown Period',
                        'approved_by' => $approver->name,
                        'approved_at' => $run->approved_at?->format('Y-m-d H:i:s'),
                        'total_net' => number_format($run->total_net, 2),
                        'run_url' => config('app.frontend_url') . '/payroll?tab=Periods',
                    ]
                );
            }

            Log::info('Payroll approved notification sent', [
                'run_id' => $run->id,
                'preparer_id' => $preparer->id,
                'approver_id' => $approver->id,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send payroll approved notification', [
                'run_id' => $run->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Notify preparer that payroll was rejected
     */
    public function notifyApprovalRejected(PayrollRun $run, User $approver, string $reason): bool
    {
        try {
            $preparer = $run->preparedBy;
            
            // Create internal memo
            $this->sendMemo(
                sender: $approver,
                recipient: $preparer,
                subject: "❌ Payroll Rejected: {$run->period->name}",
                body: $this->buildApprovalRejectedBody($run, $approver, $reason),
                priority: 'high',
                metadata: [
                    'type' => 'payroll_rejected',
                    'run_id' => $run->id,
                    'action_url' => '/payroll?tab=Periods',
                ]
            );

            // Send email notification
            if ($preparer->email && config('mail.enabled', false)) {
                $this->sendEmail(
                    to: $preparer->email,
                    subject: "Payroll Run Rejected: {$run->period->name}",
                    template: 'payroll-rejected',
                    data: [
                        'preparer_name' => $preparer->name,
                        'period_name' => $run->period->name ?? 'Unknown Period',
                        'rejected_by' => $approver->name,
                        'rejected_at' => $run->rejected_at?->format('Y-m-d H:i:s'),
                        'rejection_reason' => $reason,
                        'run_url' => config('app.frontend_url') . '/payroll?tab=Periods',
                    ]
                );
            }

            Log::info('Payroll rejected notification sent', [
                'run_id' => $run->id,
                'preparer_id' => $preparer->id,
                'approver_id' => $approver->id,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send payroll rejected notification', [
                'run_id' => $run->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send escalation notification for overdue approval
     */
    public function notifyApprovalEscalation(PayrollRun $run, ApprovalRequest $approvalRequest, User $approver): bool
    {
        try {
            $hoursOverdue = now()->diffInHours($approvalRequest->submitted_at);
            $preparer = $run->preparedBy;
            
            // Create internal memo
            $this->sendMemo(
                sender: $preparer,
                recipient: $approver,
                subject: "⚠️ URGENT: Overdue Payroll Approval - {$run->period->name}",
                body: $this->buildEscalationBody($run, $approvalRequest, $hoursOverdue),
                priority: 'urgent',
                metadata: [
                    'type' => 'payroll_escalation',
                    'run_id' => $run->id,
                    'hours_overdue' => $hoursOverdue,
                    'action_url' => '/payroll?tab=Approvals',
                ]
            );

            // Send email notification
            if ($approver->email && config('mail.enabled', false)) {
                $this->sendEmail(
                    to: $approver->email,
                    subject: "URGENT: Payroll Approval Overdue - {$run->period->name}",
                    template: 'payroll-approval-escalation',
                    data: [
                        'approver_name' => $approver->name,
                        'request_number' => $approvalRequest->request_number,
                        'period_name' => $run->period->name ?? 'Unknown Period',
                        'hours_overdue' => $hoursOverdue,
                        'submitted_at' => $approvalRequest->submitted_at?->format('Y-m-d H:i:s'),
                        'approval_url' => config('app.frontend_url') . '/payroll?tab=Approvals',
                    ]
                );
            }

            Log::warning('Payroll approval escalation notification sent', [
                'run_id' => $run->id,
                'approver_id' => $approver->id,
                'hours_overdue' => $hoursOverdue,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send payroll escalation notification', [
                'run_id' => $run->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send internal memo using the Memo system
     */
    private function sendMemo(User $sender, User $recipient, string $subject, string $body, string $priority, array $metadata): void
    {
        try {
            DB::transaction(function () use ($sender, $recipient, $subject, $body, $priority, $metadata) {
                $memo = Memo::create([
                    'sender_id' => $sender->id,
                    'organization_id' => $sender->organization_id ?? 1,
                    'subject' => $subject,
                    'body' => $body,
                    'body_plain' => strip_tags($body),
                    'priority' => $priority,
                    'status' => 'sent',
                    'type' => 'notification',
                    'sent_at' => now(),
                    'requires_read_receipt' => true,
                    'is_confidential' => false,
                    'metadata' => $metadata,
                ]);

                MemoRecipient::create([
                    'memo_id' => $memo->id,
                    'recipient_id' => $recipient->id,
                    'recipient_type' => 'to',
                    'status' => 'delivered',
                    'delivered_at' => now(),
                ]);
            });
        } catch (\Exception $e) {
            Log::error('Failed to create memo', [
                'sender_id' => $sender->id,
                'recipient_id' => $recipient->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Build approval pending email body
     */
    private function buildApprovalPendingBody(PayrollRun $run, ApprovalRequest $approvalRequest, User $preparer): string
    {
        $employeeCount = $run->employees()->count();
        $totalNet = number_format($run->total_net, 2);
        
        return <<<HTML
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #8252e9;">Payroll Approval Required</h2>
            <p>Hello,</p>
            <p><strong>{$preparer->name}</strong> has submitted a payroll run for your approval.</p>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Period:</strong> {$run->period->name}</p>
                <p><strong>Request Number:</strong> {$approvalRequest->request_number}</p>
                <p><strong>Employees:</strong> {$employeeCount}</p>
                <p><strong>Total Net Pay:</strong> \${$totalNet}</p>
                <p><strong>Submitted:</strong> {$run->submitted_at->format('M d, Y H:i')}</p>
            </div>
            
            {$this->formatComment($approvalRequest->requester_comment)}
            
            <p style="margin-top: 30px;">
                <a href="{config('app.frontend_url')}/payroll?tab=Approvals" 
                   style="background: #8252e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Review & Approve
                </a>
            </p>
            
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
                This is an automated notification from the Payroll System.
            </p>
        </div>
        HTML;
    }

    /**
     * Build approval approved email body
     */
    private function buildApprovalApprovedBody(PayrollRun $run, User $approver): string
    {
        $totalNet = number_format($run->total_net, 2);
        
        return <<<HTML
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #10b981;">Payroll Approved ✓</h2>
            <p>Good news!</p>
            <p>Your payroll run for <strong>{$run->period->name}</strong> has been approved by <strong>{$approver->name}</strong>.</p>
            
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <p><strong>Period:</strong> {$run->period->name}</p>
                <p><strong>Total Net Pay:</strong> \${$totalNet}</p>
                <p><strong>Approved:</strong> {$run->approved_at->format('M d, Y H:i')}</p>
            </div>
            
            <p>The payroll is now finalized and ready for processing.</p>
            
            <p style="margin-top: 30px;">
                <a href="{config('app.frontend_url')}/payroll?tab=Periods" 
                   style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    View Payroll Run
                </a>
            </p>
        </div>
        HTML;
    }

    /**
     * Build approval rejected email body
     */
    private function buildApprovalRejectedBody(PayrollRun $run, User $approver, string $reason): string
    {
        return <<<HTML
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #ef4444;">Payroll Rejected</h2>
            <p>Your payroll run for <strong>{$run->period->name}</strong> has been rejected by <strong>{$approver->name}</strong>.</p>
            
            <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                <p><strong>Rejection Reason:</strong></p>
                <p>{$reason}</p>
            </div>
            
            <p>Please review the feedback, make necessary corrections, and resubmit the payroll run.</p>
            
            <p style="margin-top: 30px;">
                <a href="{config('app.frontend_url')}/payroll?tab=Periods" 
                   style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Review & Resubmit
                </a>
            </p>
        </div>
        HTML;
    }

    /**
     * Build escalation email body
     */
    private function buildEscalationBody(PayrollRun $run, ApprovalRequest $approvalRequest, int $hoursOverdue): string
    {
        return <<<HTML
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #f59e0b;">⚠️ URGENT: Overdue Payroll Approval</h2>
            <p>This is a reminder that the following payroll approval is overdue:</p>
            
            <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p><strong>Period:</strong> {$run->period->name}</p>
                <p><strong>Request Number:</strong> {$approvalRequest->request_number}</p>
                <p><strong>Submitted:</strong> {$approvalRequest->submitted_at->format('M d, Y H:i')}</p>
                <p><strong>Overdue by:</strong> {$hoursOverdue} hours</p>
            </div>
            
            <p><strong>Please review and approve this payroll run as soon as possible to avoid delays in payment processing.</strong></p>
            
            <p style="margin-top: 30px;">
                <a href="{config('app.frontend_url')}/payroll?tab=Approvals" 
                   style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Review Now
                </a>
            </p>
        </div>
        HTML;
    }

    /**
     * Format comment for email
     */
    private function formatComment(?string $comment): string
    {
        if (!$comment) {
            return '';
        }
        
        return <<<HTML
        <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p><strong>Message from preparer:</strong></p>
            <p style="font-style: italic;">"{$comment}"</p>
        </div>
        HTML;
    }

    /**
     * Send email (stub for now, can be replaced with actual mail service)
     */
    private function sendEmail(string $to, string $subject, string $template, array $data): void
    {
        // For now, just log. In production, use Laravel Mail:
        // Mail::to($to)->send(new PayrollNotificationMail($subject, $template, $data));
        
        Log::info('Email notification queued', [
            'to' => $to,
            'subject' => $subject,
            'template' => $template,
        ]);
    }
}
