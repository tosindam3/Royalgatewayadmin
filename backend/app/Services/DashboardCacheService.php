<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class DashboardCacheService
{
    /**
     * Remember a dashboard metric with graceful Redis fallback.
     * On Redis failure, runs the callback directly and logs a warning.
     */
    public function remember(string $key, int $ttlSeconds, callable $callback): mixed
    {
        try {
            return Cache::remember($key, $ttlSeconds, $callback);
        } catch (\Exception $e) {
            Log::warning("DashboardCache: Redis unavailable for key [{$key}], running query directly.", [
                'error' => $e->getMessage(),
            ]);
            return $callback();
        }
    }

    /**
     * Invalidate one or more cache keys.
     */
    public function forget(string ...$keys): void
    {
        foreach ($keys as $key) {
            try {
                Cache::forget($key);
            } catch (\Exception $e) {
                Log::warning("DashboardCache: Could not forget key [{$key}].", ['error' => $e->getMessage()]);
            }
        }
    }

    /**
     * Build a scoped cache key.
     * Format: dashboard:{metric}:{user_id}:{scope_id}
     */
    public function key(string $metric, int|string $userId, int|string $scopeId = 'all'): string
    {
        return "dashboard:{$metric}:{$userId}:{$scopeId}";
    }

    // --- TTL constants (seconds) ---
    public const TTL_QUICK_STATS      = 300;   // 5 min
    public const TTL_ATTENDANCE_PULSE = 60;    // 1 min
    public const TTL_TALENT_TRENDS    = 900;   // 15 min
    public const TTL_DEMOGRAPHICS     = 3600;  // 1 hour
    public const TTL_MY_SUMMARY       = 120;   // 2 min
    public const TTL_PERFORMANCE      = 600;   // 10 min
    public const TTL_PAYROLL          = 300;   // 5 min
}
