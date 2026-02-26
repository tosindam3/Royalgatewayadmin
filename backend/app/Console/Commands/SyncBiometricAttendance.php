<?php

namespace App\Console\Commands;

use App\Jobs\SyncBiometricDeviceJob;
use App\Models\BiometricDevice;
use App\Services\BiometricSyncService;
use Illuminate\Console\Command;

class SyncBiometricAttendance extends Command
{
    protected $signature = 'attendance:sync {--device= : Device ID} {--test} {--queue : Dispatch to queue}';
    protected $description = 'Sync ZKTeco attendance records';

    public function handle(BiometricSyncService $sync)
    {
        if ($this->option('test')) {
            BiometricDevice::where('is_active', true)->each(function ($d) use ($sync) {
                $r = $sync->testConnection($d->ip_address, $d->port);
                $r['success']
                    ? $this->info("✓ {$d->device_name}: Connected successfully")
                    : $this->error("✗ {$d->device_name}: {$r['error']}");
            });
            return 0;
        }

        $deviceId = $this->option('device') ? (int)$this->option('device') : null;

        if ($this->option('queue')) {
            SyncBiometricDeviceJob::dispatch($deviceId);
            $this->info('Sync job dispatched to queue.');
            return 0;
        }

        $results = $deviceId ? [$sync->syncDevice($deviceId)] : $sync->syncAll();
        foreach ((array)$results as $r) {
            if (isset($r['success']) && $r['success']) {
                $this->info("✓ {$r['device']}: {$r['synced']} synced | {$r['duplicates']} dupes | {$r['errors']} errors");
            } else {
                $this->error("✗ " . ($r['error'] ?? 'Unknown error'));
            }
        }
        return 0;
    }
}
