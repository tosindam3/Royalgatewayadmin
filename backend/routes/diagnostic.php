<?php

use Illuminate\Support\Facades\Route;
use App\Models\User;
use App\Models\Organization;
use App\Models\Employee;
use App\Models\Department;
use App\Models\Branch;
use App\Models\AttendanceRecord;
use App\Models\LeaveRequest;
use App\Models\ChatMessage;

// TEMPORARY DIAGNOSTIC ROUTE - REMOVE AFTER USE
Route::get('/diagnostic/dashboard-data', function () {
    // Security check - only allow in specific conditions
    if (config('app.env') !== 'production' || !request()->hasHeader('X-Diagnostic-Key')) {
        abort(404);
    }
    
    if (request()->header('X-Diagnostic-Key') !== 'temp-diagnostic-2026') {
        abort(403);
    }

    $data = [];

    // Find superadmin user
    $user = User::where('email', 'admin@royalgatewayadmin.com')->first();
    
    if ($user) {
        $data['superadmin'] = [
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'has_employee' => $user->employee ? true : false,
        ];
        
        if ($user->employee) {
            $data['superadmin']['employee'] = [
                'id' => $user->employee->id,
                'organization_id' => $user->employee->organization_id,
                'department' => $user->employee->department->name ?? 'N/A',
                'designation' => $user->employee->designation->name ?? 'N/A',
            ];
        }
    } else {
        $data['superadmin'] = 'NOT FOUND';
    }

    // System statistics
    $data['statistics'] = [
        'total_organizations' => Organization::count(),
        'total_employees' => Employee::count(),
        'total_users' => User::count(),
        'total_departments' => Department::count(),
        'total_branches' => Branch::count(),
    ];

    // Recent activity
    $data['recent_activity'] = [
        'attendance_last_7_days' => AttendanceRecord::where('date', '>=', now()->subDays(7))->count(),
        'pending_leave_requests' => LeaveRequest::where('status', 'pending')->count(),
        'chat_messages_24h' => ChatMessage::where('created_at', '>=', now()->subDay())->count(),
    ];

    // Organizations list
    $data['organizations'] = Organization::with('employees')->get()->map(function ($org) {
        return [
            'id' => $org->id,
            'name' => $org->name,
            'employee_count' => $org->employees->count(),
        ];
    });

    return response()->json($data);
});
