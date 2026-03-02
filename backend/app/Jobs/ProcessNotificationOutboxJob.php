<?php

namespace App\Jobs;

use App\Models\NotificationOutbox;
use App\Services\MemoNotifier;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessNotificationOutboxJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $timeout = 60;

    /**
     * Execute the job
     */
    public function handle(MemoNotifier $notifier): void
    {
        // Pick pending notifications ready for retry
        $notifications = NotificationOutbox::readyForRetry()
            ->where('attempts', '<', 5) // Max 5 attempts
            ->limit(50) // Process in batches
            ->get();

        if ($notifications->isEmpty()) {
            Log::debug("No notifications to process");
            return;
        }

        Log::info("Processing notification outbox", [
            'count' => $notifications->count(),
        ]);

        foreach ($notifications as $notification) {
            $this->processNotification($notification, $notifier);
        }
    }

    /**
     * Process a single notification
     * 
     * @param NotificationOutbox $notification
     * @param MemoNotifier $notifier
     * @return void
     */
    private function processNotification(NotificationOutbox $notification, MemoNotifier $notifier): void
    {
        try {
            $notification->increment('attempts');

            $success = false;

            // Route to appropriate notifier method
            switch ($notification->event_key) {
                case 'payroll_submitted':
                    $success = $notifier->sendPayrollSubmitted(
                        $notification->recipient_user_id,
                        $notification->payload_json
                    );
                    break;

                case 'payroll_approved':
                    $success = $notifier->sendPayrollApproved(
                        $notification->recipient_user_id,
                        $notification->payload_json
                    );
                    break;

                case 'payroll_rejected':
                    $success = $notifier->sendPayrollRejected(
                        $notification->recipient_user_id,
                        $notification->payload_json
                    );
                    break;

                default:
                    Log::warning("Unknown notification event key", [
                        'event_key' => $notification->event_key,
                        'notification_id' => $notification->id,
                    ]);
                    $success = false;
            }

            if ($success) {
                $notification->update([
                    'status' => 'sent',
                    'last_error' => null,
                    'next_retry_at' => null,
                ]);

                Log::info("Notification sent successfully", [
                    'notification_id' => $notification->id,
                    'event_key' => $notification->event_key,
                ]);
            } else {
                $this->handleFailure($notification, 'Notification send returned false');
            }
        } catch (\Exception $e) {
            $this->handleFailure($notification, $e->getMessage());
        }
    }

    /**
     * Handle notification failure
     * 
     * @param NotificationOutbox $notification
     * @param string $error
     * @return void
     */
    private function handleFailure(NotificationOutbox $notification, string $error): void
    {
        $attempts = $notification->attempts;

        if ($attempts >= 5) {
            // Max attempts reached - mark as failed
            $notification->update([
                'status' => 'failed',
                'last_error' => $error,
                'next_retry_at' => null,
            ]);

            Log::error("Notification failed after max attempts", [
                'notification_id' => $notification->id,
                'attempts' => $attempts,
                'error' => $error,
            ]);
        } else {
            // Schedule retry with exponential backoff
            $backoffMinutes = pow(2, $attempts); // 2, 4, 8, 16 minutes
            $nextRetry = Carbon::now()->addMinutes($backoffMinutes);

            $notification->update([
                'status' => 'pending',
                'last_error' => $error,
                'next_retry_at' => $nextRetry,
            ]);

            Log::warning("Notification failed, will retry", [
                'notification_id' => $notification->id,
                'attempts' => $attempts,
                'next_retry_at' => $nextRetry->toIso8601String(),
                'error' => $error,
            ]);
        }
    }
}
