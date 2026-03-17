<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

Route::get('/health', function () {
    $checks = [
        'status' => 'healthy',
        'timestamp' => now()->toIso8601String(),
        'checks' => []
    ];

    // Database check
    try {
        DB::connection()->getPdo();
        $checks['checks']['database'] = 'ok';
    } catch (\Exception $e) {
        $checks['status'] = 'unhealthy';
        $checks['checks']['database'] = 'failed: ' . $e->getMessage();
    }

    // Cache check
    try {
        Cache::put('health_check', true, 10);
        $checks['checks']['cache'] = Cache::get('health_check') ? 'ok' : 'failed';
    } catch (\Exception $e) {
        $checks['status'] = 'degraded';
        $checks['checks']['cache'] = 'failed: ' . $e->getMessage();
    }

    // Storage check
    try {
        $testFile = storage_path('logs/health_check.txt');
        file_put_contents($testFile, 'test');
        $checks['checks']['storage'] = is_readable($testFile) ? 'ok' : 'failed';
        @unlink($testFile);
    } catch (\Exception $e) {
        $checks['status'] = 'degraded';
        $checks['checks']['storage'] = 'failed: ' . $e->getMessage();
    }

    // Queue check
    try {
        $queueSize = DB::table('jobs')->count();
        $checks['checks']['queue'] = [
            'status' => 'ok',
            'pending_jobs' => $queueSize
        ];
    } catch (\Exception $e) {
        $checks['checks']['queue'] = 'failed: ' . $e->getMessage();
    }

    // Version info
    $checks['version'] = [
        'app' => config('app.version', 'unknown'),
        'php' => PHP_VERSION,
        'laravel' => app()->version()
    ];

    $statusCode = $checks['status'] === 'healthy' ? 200 : 503;
    
    return response()->json($checks, $statusCode);
});

Route::get('/health/ready', function () {
    // Readiness check - is the app ready to serve traffic?
    try {
        DB::connection()->getPdo();
        return response()->json(['status' => 'ready'], 200);
    } catch (\Exception $e) {
        return response()->json(['status' => 'not ready', 'error' => $e->getMessage()], 503);
    }
});

Route::get('/health/live', function () {
    // Liveness check - is the app alive?
    return response()->json(['status' => 'alive'], 200);
});
