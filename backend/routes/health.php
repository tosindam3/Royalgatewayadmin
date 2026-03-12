<?php

use Illuminate\Support\Facades\Route;

// Health Check Routes (no authentication required)
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
        'service' => 'HR360 API'
    ]);
});

Route::get('/ping', function () {
    return response()->json(['message' => 'pong']);
});