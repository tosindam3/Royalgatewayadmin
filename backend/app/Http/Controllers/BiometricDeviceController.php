<?php

namespace App\Http\Controllers;

use App\Models\BiometricDevice;
use App\Services\BiometricSyncService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class BiometricDeviceController extends Controller
{
    use ApiResponse;

    public function __construct(protected BiometricSyncService $syncService) {}

    public function index()
    {
        $devices = BiometricDevice::with('workplace')
            ->orderBy('is_active', 'desc')
            ->orderBy('device_name')
            ->get();

        return $this->success('Devices retrieved successfully.', $devices);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'device_name' => 'required|string|max:100',
            'device_serial' => 'required|string|max:50|unique:biometric_devices',
            'ip_address' => 'required|ip',
            'port' => 'nullable|integer|min:1|max:65535',
            'location' => 'nullable|string|max:255',
            'workplace_id' => 'nullable|exists:workplaces,id',
            'is_active' => 'boolean',
        ]);

        $device = BiometricDevice::create($data);

        return $this->success('Device created successfully.', $device, 201);
    }

    public function show(int $id)
    {
        $device = BiometricDevice::with('workplace')->findOrFail($id);
        return $this->success('Device retrieved successfully.', $device);
    }

    public function update(Request $request, int $id)
    {
        $device = BiometricDevice::findOrFail($id);

        $data = $request->validate([
            'device_name' => 'sometimes|string|max:100',
            'device_serial' => 'sometimes|string|max:50|unique:biometric_devices,device_serial,' . $id,
            'ip_address' => 'sometimes|ip',
            'port' => 'sometimes|integer|min:1|max:65535',
            'location' => 'nullable|string|max:255',
            'workplace_id' => 'nullable|exists:workplaces,id',
            'is_active' => 'boolean',
        ]);

        $device->update($data);

        return $this->success('Device updated successfully.', $device);
    }

    public function destroy(int $id)
    {
        $device = BiometricDevice::findOrFail($id);
        $device->delete();

        return $this->success('Device deleted successfully.');
    }

    public function testConnection(int $id)
    {
        $device = BiometricDevice::findOrFail($id);
        $result = $this->syncService->testConnection($device->ip_address, $device->port);

        if ($result['success']) {
            return $this->success('Connection successful.', $result);
        }

        return $this->error('Connection failed: ' . ($result['error'] ?? 'Unknown error'), 422);
    }

    public function sync(int $id)
    {
        $device = BiometricDevice::findOrFail($id);
        $result = $this->syncService->syncDevice($id);

        if ($result['success']) {
            return $this->success('Sync completed successfully.', $result);
        }

        return $this->error('Sync failed: ' . ($result['error'] ?? 'Unknown error'), 422);
    }

    public function syncAll()
    {
        $results = $this->syncService->syncAll();
        return $this->success('Sync completed for all devices.', $results);
    }
}
