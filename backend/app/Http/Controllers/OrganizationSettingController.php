<?php

namespace App\Http\Controllers;

use App\Models\OrganizationSetting;
use App\Helpers\CurrencyHelper;
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

    /**
     * Get currency settings
     */
    public function getCurrencySettings(): JsonResponse
    {
        $settings = CurrencyHelper::getSettings();
        return $this->success($settings, 'Currency settings retrieved successfully.');
    }

    /**
     * Get list of available currencies
     */
    public function getCurrencyList(): JsonResponse
    {
        $currencies = CurrencyHelper::getCurrencyList();
        return $this->success($currencies, 'Currency list retrieved successfully.');
    }

    /**
     * Update currency settings
     */
    public function updateCurrencySettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'currency_code' => 'required|string|max:3',
            'currency_symbol' => 'required|string|max:10',
            'currency_position' => 'required|in:before,after',
            'decimal_separator' => 'required|string|max:1',
            'thousand_separator' => 'required|string|max:1',
            'decimal_places' => 'required|integer|min:0|max:4',
        ]);

        $settings = [
            'payroll.currency_code' => $validated['currency_code'],
            'payroll.currency_symbol' => $validated['currency_symbol'],
            'payroll.currency_position' => $validated['currency_position'],
            'payroll.decimal_separator' => $validated['decimal_separator'],
            'payroll.thousand_separator' => $validated['thousand_separator'],
            'payroll.decimal_places' => $validated['decimal_places'],
        ];

        foreach ($settings as $key => $value) {
            OrganizationSetting::updateOrCreate(
                ['key' => $key],
                ['value' => $value, 'type' => gettype($value)]
            );
        }

        return $this->success(CurrencyHelper::getSettings(), 'Currency settings updated successfully.');
    }
}
