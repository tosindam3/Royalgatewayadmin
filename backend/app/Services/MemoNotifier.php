<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

/**
 * MemoNotifier - Safe notification stub for Memo integration
 * 
 * CRITICAL: This service MUST NEVER throw exceptions.
 * Memo is not production-ready, so we use a log-only stub for v1.
 * 
 * In v2, this can be replaced with actual Memo API integration.
 */
class MemoNotifier
{
    /**
     * Send payroll submitted notification
     * 
     * @param int $recipientUserId
     * @param array $payload
     * @return bool Success status
     */
    public function sendPayrollSubmitted(int $recipientUserId, array $payload): bool
    {
        try {
            // v1: Log only (Memo not production-ready)
            Log::info("Memo notification: Payroll submitted", [
                'recipient_user_id' => $recipientUserId,
                'payload' => $payload,
            ]);

            // In v2, this would call Memo API:
            // $response = Http::post(config('memo.api_url') . '/notifications', [
            //     'recipient_id' => $recipientUserId,
            //     'type' => 'payroll_submitted',
            //     'data' => $payload,
            // ]);
            // return $response->successful();

            return true;
        } catch (\Exception $e) {
            // NEVER throw - just log and return false
            Log::error("Memo notification failed", [
                'recipient_user_id' => $recipientUserId,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Send payroll approved notification
     * 
     * @param int $recipientUserId
     * @param array $payload
     * @return bool Success status
     */
    public function sendPayrollApproved(int $recipientUserId, array $payload): bool
    {
        try {
            Log::info("Memo notification: Payroll approved", [
                'recipient_user_id' => $recipientUserId,
                'payload' => $payload,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error("Memo notification failed", [
                'recipient_user_id' => $recipientUserId,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Send payroll rejected notification
     * 
     * @param int $recipientUserId
     * @param array $payload
     * @return bool Success status
     */
    public function sendPayrollRejected(int $recipientUserId, array $payload): bool
    {
        try {
            Log::info("Memo notification: Payroll rejected", [
                'recipient_user_id' => $recipientUserId,
                'payload' => $payload,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error("Memo notification failed", [
                'recipient_user_id' => $recipientUserId,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
