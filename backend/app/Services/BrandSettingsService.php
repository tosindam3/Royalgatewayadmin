<?php

namespace App\Services;

use App\Models\OrganizationSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class BrandSettingsService
{
    /**
     * Get all brand settings
     */
    public function getBrandSettings(): array
    {
        return Cache::remember('brand_settings', 86400, function () {
            return [
                'companyName' => OrganizationSetting::get('brand.company_name', 'HR360'),
                'logoUrl' => OrganizationSetting::get('brand.logo_url', ''),
                'primaryColor' => OrganizationSetting::get('brand.primary_color', '#8252e9'),
            ];
        });
    }

    /**
     * Update brand settings
     */
    public function updateBrandSettings(array $data): array
    {
        DB::beginTransaction();

        try {
            $settings = [
                'brand.company_name' => $data['companyName'],
                'brand.logo_url' => $data['logoUrl'] ?? '',
                'brand.primary_color' => $data['primaryColor'],
            ];

            $oldValues = $this->getBrandSettings();

            foreach ($settings as $key => $value) {
                OrganizationSetting::updateOrCreate(
                    ['key' => $key],
                    [
                        'value' => $value,
                        'type' => 'string',
                    ]
                );
            }

            // Clear cache
            Cache::forget('brand_settings');
            Cache::tags(['settings'])->flush();

            // Clear individual setting caches
            foreach (array_keys($settings) as $key) {
                Cache::forget("settings.{$key}");
            }

            DB::commit();

            return [
                'old' => $oldValues,
                'new' => $data,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Validate logo URL accessibility
     */
    public function validateLogoUrl(?string $url): bool
    {
        if (empty($url)) {
            return true; // Empty is valid (will use fallback)
        }

        // Basic URL validation
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }

        // Check if URL is accessible (optional, can be disabled for performance)
        try {
            $headers = @get_headers($url, 1);
            return $headers && strpos($headers[0], '200') !== false;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Reset brand settings to defaults
     */
    public function resetToDefaults(): array
    {
        $defaults = [
            'companyName' => 'HR360',
            'logoUrl' => '',
            'primaryColor' => '#8252e9',
        ];

        return $this->updateBrandSettings($defaults);
    }
}
