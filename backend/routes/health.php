<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

/*
|--------------------------------------------------------------------------
| Health Check Routes
|--------------------------------------------------------------------------
|
| These routes are used by the deployment workflow to verify the site is up.
| They are public and should not contain sensitive information.
|
*/

Route::get('/health', function () {
    try {
        // Basic connectivity check
        DB::connection()->getPdo();
        
        return response()->json([
            'status' => 'ok',
            'timestamp' => now()->toIso8601String(),
            'database' => 'connected',
            'environment' => app()->environment(),
            'php_version' => PHP_VERSION,
        ], 200);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'timestamp' => now()->toIso8601String(),
            'message' => 'Database connection failed',
            'error' => app()->environment('production') ? 'Internal Server Error' : $e->getMessage(),
        ], 500);
    }
});
