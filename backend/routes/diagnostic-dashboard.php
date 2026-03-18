<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

Route::prefix('v1')->group(function () {
    Route::get('/diagnostic/dashboard-test', function (Request $request) {
    $user = $request->user();
    
    if (!$user) {
        return response()->json(['error' => 'Not authenticated'], 401);
    }
    
    $employee = $user->employeeProfile;
    
    if (!$employee) {
        return response()->json([
            'error' => 'No employee profile',
            'user_id' => $user->id,
            'user_email' => $user->email,
        ]);
    }
    
    $service = new \App\Services\DashboardService();
    $summary = $service->getPersonalSummary($employee->id);
    $leaveBalance = $service->getLeaveBalance($employee->id);
    
    // Get today's attendance
    $todayRecord = \App\Models\AttendanceRecord::where('employee_id', $employee->id)
        ->whereDate('attendance_date', now()->toDateString())
        ->first();
    
    $clockStatus = 'not_started';
    $clockInTime = null;
    
    if ($todayRecord && $todayRecord->check_in_time) {
        $clockStatus = $todayRecord->check_out_time ? 'clocked_out' : 'clocked_in';
        $clockInTime = $todayRecord->check_in_time->format('H:i:s');
    }
    
    // Get performance submissions
    $submissions = \App\Models\PerformanceSubmission::where('employee_id', $employee->id)
        ->where('status', 'submitted')
        ->whereNotNull('score')
        ->get();
    
    return response()->json([
        'user' => [
            'id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
        ],
        'employee' => [
            'id' => $employee->id,
            'full_name' => $employee->full_name,
        ],
        'summary' => $summary,
        'leave_balance' => $leaveBalance,
        'clock_status' => $clockStatus,
        'clock_in_time' => $clockInTime,
        'performance_count' => $submissions->count(),
        'latest_score' => $submissions->count() > 0 ? $submissions->last()->score : null,
    ]);
    })->middleware('auth:sanctum');
});
