<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class OrganizationSetting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'type',
        'proposed_value',
        'is_pending_approval',
        'proposed_by_id',
    ];

    protected $casts = [
        'value' => 'json',
        'proposed_value' => 'json',
        'is_pending_approval' => 'boolean',
    ];

    /**
     * Get a setting value with caching
     */
    public static function get(string $key, $default = null)
    {
        return Cache::remember("settings.{$key}", 86400, function () use ($key, $default) {
            $setting = self::where('key', $key)->first();
            return $setting ? $setting->value : $default;
        });
    }

    /**
     * Clear cache on save and delete
     */
    protected static function booted()
    {
        static::saved(function ($setting) {
            Cache::forget("settings.{$setting->key}");
            Cache::forget('brand_settings');
        });

        static::deleted(function ($setting) {
            Cache::forget("settings.{$setting->key}");
            Cache::forget('brand_settings');
        });
    }
}
