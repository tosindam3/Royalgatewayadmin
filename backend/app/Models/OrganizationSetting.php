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
    ];

    protected $casts = [
        'value' => 'json',
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
     * Clear cache on save
     */
    protected static function booted()
    {
        static::saved(fn() => Cache::forget('settings.*'));
    }
}
