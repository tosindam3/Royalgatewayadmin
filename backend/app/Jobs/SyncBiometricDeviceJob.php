<?php

namespace App\Jobs;

use App\Services\BiometricSyncService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncBiometricDeviceJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(public readonly ?int $deviceId = null) {}

    public function handle(BiometricSyncService $sync): void
    {
        $result = $this->deviceId
            ? $sync->syncDevice($this->deviceId)
            : $sync->syncAll();

        if (is_array($result) && isset($result['success']) && $result['success']) {
            Log::info('Biometric sync job completed', compact('result'));
        } else {
            Log::warning('Biometric sync job completed with issues', compact('result'));
        }
    }

    public function failed(\Throwable $e): void
    {
        Log::error('Biometric sync job failed', ['error' => $e->getMessage()]);
    }
}
