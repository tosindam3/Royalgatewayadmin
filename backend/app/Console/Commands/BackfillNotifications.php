<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\MemoRecipient;
use App\Models\ApprovalRequest;
use App\Models\User;
use App\Notifications\SystemNotification;
use Illuminate\Support\Facades\Notification;

class BackfillNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:backfill-notifications';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Backfills legacy unread memos and pending approvals into the unified notifications table.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting notification backfill process...');

        // 1. Unread Memos
        $unreadMemos = MemoRecipient::with(['memo', 'recipient'])->whereNull('read_at')->get();
        $this->info('Found ' . $unreadMemos->count() . ' unread memos.');
        
        foreach ($unreadMemos as $recipient) {
            if ($recipient->recipient && $recipient->memo) {
                // Avoid duplicates by checking if similar notification exists
                $exists = $recipient->recipient->notifications()
                                ->where('data->type', 'MEMO')
                                ->where('data->actionUrl', '/communication/memo')
                                ->where('data->title', $recipient->memo->subject)
                                ->exists();
                                
                if (!$exists) {
                    $recipient->recipient->notify(new SystemNotification(
                        'MEMO',
                        $recipient->memo->subject,
                        'You have a new unread memo.',
                        '/communication/memo',
                        $recipient->memo->priority ?? 'MEDIUM'
                    ));
                }
            }
        }

        // 2. Pending Approvals
        $pendingApprovals = ApprovalRequest::with(['currentApprover'])->where('status', 'PENDING')->get();
        $this->info('Found ' . $pendingApprovals->count() . ' pending approvals.');
        
        foreach ($pendingApprovals as $approval) {
            $approver = $approval->currentApprover;
            if ($approver) {
                $exists = $approver->notifications()
                                ->where('data->type', 'PENDING_REVIEW')
                                ->where('data->actionUrl', '/approvals')
                                ->exists();
                if (!$exists) {
                    $approver->notify(new SystemNotification(
                        'PENDING_REVIEW',
                        'Pending Payroll Approval',
                        'Payroll run awaits your approval.',
                        '/approvals',
                        'HIGH'
                    ));
                }
            }
        }
        
        $this->info('Backfill complete!');
    }
}
