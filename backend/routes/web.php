<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Attendance Dashboard (Inertia SSR)
Route::middleware(['auth:sanctum', 'verified'])->group(function () {
    Route::get('/attendance', [App\Http\Controllers\AttendanceDashboardController::class, 'index'])
        ->name('attendance.dashboard');
});
