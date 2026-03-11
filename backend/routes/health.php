<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| Health Check Routes
|--------------------------------------------------------------------------
|
| These routes provide health check endpoints for monitoring the
| application status, database connectivity, and other services.
|
*/

Route::get('/health', function () {
    $checks = [];
    $overall_status = 'healthy';
    
    // Basic application check
    $checks['app'] = [
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
        'version' => config('app.version', '1.0.0'),
        'environment' => config('app.env'),
    ];
    
    // Database connectivity check
    try {
        DB::connection()->getPdo();
        $checks['database'] = [
            'status' => 'ok',
            'connection' => config('database.default'),
        ];
    } catch (Exception $e) {
        $checks['database'] = [
            'status' => 'error',
            'message' => 'Database connection failed',
        ];
        $overall_status = 'unhealthy';
    }
    
    // Cache check
    try {
        $test_key = 'health_check_' . time();
        Cache::put($test_key, 'test', 10);
        $cached_value = Cache::get($test_key);
        Cache::forget($test_key);
        
        $checks['cache'] = [
            'status' => $cached_value === 'test' ? 'ok' : 'error',
            'driver' => config('cache.default'),
        ];
        
        if ($checks['cache']['status'] === 'error') {
            $overall_status = 'unhealthy';
        }
    } catch (Exception $e) {
        $checks['cache'] = [
            'status' => 'error',
            'message' => 'Cache system failed',
        ];
        $overall_status = 'unhealthy';
    }
    
    // Storage check
    try {
        $storage_path = storage_path('app');
        $is_writable = is_writable($storage_path);
        
        $checks['storage'] = [
            'status' => $is_writable ? 'ok' : 'error',
            'path' => $storage_path,
            'writable' => $is_writable,
        ];
        
        if (!$is_writable) {
            $overall_status = 'unhealthy';
        }
    } catch (Exception $e) {
        $checks['storage'] = [
            'status' => 'error',
            'message' => 'Storage check failed',
        ];
        $overall_status = 'unhealthy';
    }
    
    // Queue check (if using database queue)
    if (config('queue.default') === 'database') {
        try {
            $failed_jobs = DB::table('failed_jobs')->count();
            $checks['queue'] = [
                'status' => 'ok',
                'driver' => config('queue.default'),
                'failed_jobs' => $failed_jobs,
            ];
        } catch (Exception $e) {
            $checks['queue'] = [
                'status' => 'error',
                'message' => 'Queue check failed',
            ];
            $overall_status = 'unhealthy';
        }
    }
    
    $response = [
        'status' => $overall_status,
        'timestamp' => now()->toISOString(),
        'checks' => $checks,
    ];
    
    return response()->json($response, $overall_status === 'healthy' ? 200 : 503);
});

Route::get('/health/simple', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
    ]);
});

Route::get('/health/database', function () {
    try {
        DB::connection()->getPdo();
        
        // Test a simple query
        $result = DB::select('SELECT 1 as test');
        
        return response()->json([
            'status' => 'ok',
            'connection' => config('database.default'),
            'timestamp' => now()->toISOString(),
        ]);
    } catch (Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Database connection failed',
            'timestamp' => now()->toISOString(),
        ], 503);
    }
});

Route::get('/health/detailed', function () {
    $system_info = [];
    
    // PHP Information
    $system_info['php'] = [
        'version' => PHP_VERSION,
        'memory_limit' => ini_get('memory_limit'),
        'max_execution_time' => ini_get('max_execution_time'),
        'upload_max_filesize' => ini_get('upload_max_filesize'),
    ];
    
    // Laravel Information
    $system_info['laravel'] = [
        'version' => app()->version(),
        'environment' => config('app.env'),
        'debug' => config('app.debug'),
        'timezone' => config('app.timezone'),
    ];
    
    // Server Information
    $system_info['server'] = [
        'software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'php_sapi' => php_sapi_name(),
        'os' => PHP_OS,
    ];
    
    // Disk Space
    $system_info['disk'] = [
        'free_space' => disk_free_space('/'),
        'total_space' => disk_total_space('/'),
    ];
    
    // Memory Usage
    $system_info['memory'] = [
        'current_usage' => memory_get_usage(true),
        'peak_usage' => memory_get_peak_usage(true),
        'limit' => ini_get('memory_limit'),
    ];
    
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
        'system' => $system_info,
    ]);
});

Route::get('/version', function () {
    return response()->json([
        'app_name' => config('app.name'),
        'version' => config('app.version', '1.0.0'),
        'laravel_version' => app()->version(),
        'php_version' => PHP_VERSION,
        'environment' => config('app.env'),
        'timestamp' => now()->toISOString(),
    ]);
});