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

        $settings = $query->get();
        
        $result = $settings->mapWithKeys(function($item) {
            return [$item->key => [
                'value' => $item->value,
                'proposed_value' => $item->proposed_value,
                'is_pending' => $item->is_pending_approval,
            ]];
        });

        return $this->success($result, 'Settings retrieved successfully.');
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
        $user = $request->user();
        $isSuperOrCeo = in_array($user->role, ['super_admin', 'ceo']);

        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*' => 'nullable',
        ]);

        foreach ($validated['settings'] as $key => $value) {
            $setting = OrganizationSetting::firstOrNew(['key' => $key]);
            
            if ($isSuperOrCeo) {
                $setting->value = $value;
                $setting->type = gettype($value);
                $setting->is_pending_approval = false;
                $setting->proposed_value = null;
                $setting->proposed_by_id = null;
            } else {
                $setting->proposed_value = $value;
                $setting->is_pending_approval = true;
                $setting->proposed_by_id = $user->id;
                // If it's a new setting, we need a placeholder type
                if (!$setting->exists) {
                    $setting->type = gettype($value);
                }
            }
            
            $setting->save();
        }

        $message = $isSuperOrCeo ? 'Settings updated successfully.' : 'Changes submitted for CEO approval.';
        return $this->success(null, $message);
    }

    /**
     * Get pending settings changes
     */
    public function pending(Request $request): JsonResponse
    {
        $pending = OrganizationSetting::where('is_pending_approval', true)
            ->with('proposed_by_id:id,name')
            ->get();
            
        return $this->success($pending, 'Pending changes retrieved.');
    }

    /**
     * Approve a setting change
     */
    public function approve(Request $request, string $key): JsonResponse
    {
        $user = $request->user();
        if (!in_array($user->role, ['super_admin', 'ceo'])) {
            return $this->error('Only CEO or Superadmin can approve settings.', 403);
        }

        $setting = OrganizationSetting::where('key', $key)->firstOrFail();
        
        if (!$setting->is_pending_approval) {
            return $this->error('No pending changes for this setting.', 400);
        }

        $setting->value = $setting->proposed_value;
        $setting->type = gettype($setting->proposed_value);
        $setting->is_pending_approval = false;
        $setting->proposed_value = null;
        $setting->proposed_by_id = null;
        $setting->save();

        return $this->success(null, 'Setting change approved.');
    }

    /**
     * Reject a setting change
     */
    public function reject(Request $request, string $key): JsonResponse
    {
        $user = $request->user();
        if (!in_array($user->role, ['super_admin', 'ceo'])) {
            return $this->error('Only CEO or Superadmin can reject settings.', 403);
        }

        $setting = OrganizationSetting::where('key', $key)->firstOrFail();
        $setting->is_pending_approval = false;
        $setting->proposed_value = null;
        $setting->proposed_by_id = null;
        $setting->save();

        return $this->success(null, 'Setting change rejected.');
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
