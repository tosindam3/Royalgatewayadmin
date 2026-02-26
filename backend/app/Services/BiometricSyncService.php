<?php

namespace App\Services;

use App\Models\BiometricDevice;
use Illuminate\Support\Facades\Log;

class BiometricSyncService
{
    public function __construct(protected ZKTecoService $zkService) {}

    public function syncDevice(int $id): array 
    { 
        $device = BiometricDevice::find($id);
        if (!$device) {
            return ['success' => false, 'error' => 'Device not found'];
        }

        return $this->zkService->syncDevice($device);
    }

    public function syncAll(): array            
    { 
        return $this->zkService->syncAll();
    }

    public function testConnection(string $ip, int $port = 4370): array 
    {
        return $this->zkService->testConnection($ip, $port);
    }
}
