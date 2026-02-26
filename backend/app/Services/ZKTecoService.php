<?php

namespace App\Services;

use App\ZKTeco\ZKConstants;
use App\ZKTeco\ZKSocket;
use App\Models\AttendanceLog;
use App\Models\BiometricDevice;
use App\Models\Employee;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class ZKTecoService
{
    public function syncDevice(BiometricDevice $device): array
    {
        $socket = new ZKSocket($device->ip_address, $device->port);
        $synced = $dupes = $errors = 0;

        try {
            $socket->connect();
            $socket->disableDevice();
            $records = $socket->getAttendance();
            $socket->enableDevice();

            // Bulk-load employees to avoid N+1 queries
            $employeeMap = Employee::whereNotNull('biometric_id')
                ->pluck('id', 'biometric_id');

            // Bulk-check existing logs for today (avoids per-record queries)
            $existing = AttendanceLog::where('source', 'biometric')
                ->whereIn('employee_id', $employeeMap->values())
                ->pluck(DB::raw("CONCAT(employee_id, '_', timestamp)"));

            $toInsert = [];

            foreach ($records as $rec) {
                $empId = $employeeMap[$rec['user_id']] ?? null;
                if (!$empId) continue;

                $key = "{$empId}_{$rec['timestamp']}";
                if ($existing->contains($key)) {
                    $dupes++; 
                    continue;
                }

                $toInsert[] = [
                    'employee_id' => $empId,
                    'check_type'  => ZKConstants::PUNCH_MAP[$rec['punch']] ?? 'check_in',
                    'timestamp'   => $rec['timestamp'],
                    'source'      => 'biometric',
                    'device_id'   => $device->device_serial,
                    'verified'    => true,
                    'sync_status' => 'synced',
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ];
            }

            // Single bulk insert instead of per-record inserts
            if (!empty($toInsert)) {
                foreach (array_chunk($toInsert, 500) as $chunk) {
                    AttendanceLog::insert($chunk);
                    $synced += count($chunk);
                }
            }

            $device->update(['last_sync' => now()]);

            return [
                'success'    => true,
                'device'     => $device->device_name,
                'total'      => count($records),
                'synced'     => $synced,
                'duplicates' => $dupes,
                'errors'     => $errors,
            ];
        } catch (RuntimeException $e) {
            Log::error('ZKTeco sync failed', [
                'device' => $device->device_name, 
                'error' => $e->getMessage()
            ]);
            return ['success' => false, 'error' => $e->getMessage()];
        } finally {
            $socket->disconnect();
        }
    }

    public function testConnection(string $ip, int $port = 4370): array
    {
        $socket = new ZKSocket($ip, $port, timeout: 3);
        try {
            $socket->connect();
            $socket->disconnect();
            return ['success' => true, 'message' => "Connected to {$ip}:{$port}"];
        } catch (RuntimeException $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function syncAll(): array
    {
        return BiometricDevice::where('is_active', true)
            ->get()
            ->map(fn($d) => $this->syncDevice($d))
            ->all();
    }
}
