<?php

use Illuminate\Support\Facades\Route;

// Attendance Dashboard (Inertia SSR)
Route::middleware(['auth:sanctum', 'verified'])->group(function () {
    Route::get('/attendance', [App\Http\Controllers\AttendanceDashboardController::class, 'index'])
        ->name('attendance.dashboard');
});

// React SPA Routing - Disabled when frontend runs separately
// Route::get('/{any}', function () {
//     return file_get_contents(public_path('index.html'));
// })->where('any', '^(?!api).*$');
