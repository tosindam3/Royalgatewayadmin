<?php

namespace App\Http\Controllers;

use App\Models\OrganizationSetting;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class OrganizationSettingController extends Controller
{
    use ApiResponse;

    /**
     * Get all settings or filter by prefix
     */
    public function index(Request $request): JsonResponse
    {
        $prefix = $request->query('prefix');
        $query = OrganizationSetting::query();

        if ($prefix) {
            $query->where('key', 'like', "{$prefix}%");
        }

        $settings = $query->get()->pluck('value', 'key');

        return $this->success($settings, 'Settings retrieved successfully.');
    }

    /**
     * Get a specific setting
     */
    public function show(string $key): JsonResponse
    {
        $value = OrganizationSetting::get($key);
        return $this->success([$key => $value], 'Setting retrieved successfully.');
    }

    /**
     * Update or create multiple settings
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*' => 'nullable',
        ]);

        foreach ($validated['settings'] as $key => $value) {
            OrganizationSetting::updateOrCreate(
                ['key' => $key],
                ['value' => $value, 'type' => gettype($value)]
            );
        }

        return $this->success(null, 'Settings updated successfully.');
    }
}
