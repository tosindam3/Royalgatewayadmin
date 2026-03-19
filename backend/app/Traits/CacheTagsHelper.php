<?php

namespace App\Traits;

use Illuminate\Support\Facades\Cache;

trait CacheTagsHelper
{
    /**
     * Get cache with tags support, falls back to regular cache if tags not supported
     */
    protected function cacheWithTags(array $tags, string $key, int $ttl, callable $callback)
    {
        try {
            return Cache::tags($tags)->remember($key, $ttl, $callback);
        } catch (\BadMethodCallException $e) {
            // Fallback to regular cache if tags not supported (file driver)
            return Cache::remember($key, $ttl, $callback);
        }
    }

    /**
     * Flush cache tags, falls back to forgetting specific keys if tags not supported
     */
    protected function flushCacheTags(array $tags, array $keys = [])
    {
        try {
            Cache::tags($tags)->flush();
        } catch (\BadMethodCallException $e) {
            // Fallback to forgetting specific keys if provided
            foreach ($keys as $key) {
                Cache::forget($key);
            }
        }
    }
}
