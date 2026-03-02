<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$user = App\Models\User::where('email', 'tosinfanimo3@gmail.com')
    ->with(['employeeProfile.branch', 'roles'])
    ->first();

if (!$user) {
    echo "User not found\n";
    exit;
}

echo "=== LAZARUS LAWAL DETAILS ===\n\n";
echo "User ID: {$user->id}\n";
echo "Name: {$user->name}\n";
echo "Email: {$user->email}\n\n";

if ($user->employeeProfile) {
    $emp = $user->employeeProfile;
    echo "=== EMPLOYEE PROFILE ===\n";
    echo "Employee ID: {$emp->id}\n";
    echo "Employee Code: {$emp->employee_code}\n";
    echo "Branch: " . ($emp->branch ? $emp->branch->name : 'No Branch') . "\n";
    echo "Branch ID: {$emp->branch_id}\n";
    echo "Department ID: {$emp->department_id}\n";
    echo "Allow Mobile Check-in: " . ($emp->allow_mobile_checkin ? 'Yes' : 'No') . "\n";
    echo "Status: {$emp->status}\n\n";
} else {
    echo "No employee profile found\n\n";
}

echo "=== ROLES ===\n";
echo $user->roles->pluck('name')->implode(', ') . "\n\n";

// Check geofence zones for the branch
if ($user->employeeProfile && $user->employeeProfile->branch_id) {
    echo "=== GEOFENCE ZONES FOR BRANCH ===\n";
    $zones = App\Models\GeofenceZone::where('branch_id', $user->employeeProfile->branch_id)
        ->orWhereNull('branch_id')
        ->where('is_active', true)
        ->get();
    
    if ($zones->count() > 0) {
        foreach ($zones as $zone) {
            echo "- {$zone->name} (Branch: " . ($zone->branch_id ? "ID {$zone->branch_id}" : "Global") . ")\n";
            echo "  Lat: {$zone->latitude}, Lng: {$zone->longitude}, Radius: {$zone->radius}m\n";
        }
    } else {
        echo "No geofence zones configured\n";
    }
    echo "\n";
}

// Check total active geofence zones
$totalZones = App\Models\GeofenceZone::where('is_active', true)->count();
echo "=== TOTAL ACTIVE GEOFENCE ZONES ===\n";
echo "Total: {$totalZones}\n\n";

// Check today's attendance
echo "=== TODAY'S ATTENDANCE ===\n";
if ($user->employeeProfile) {
    $today = now()->toDateString();
    $logs = App\Models\AttendanceLog::where('employee_id', $user->employeeProfile->id)
        ->whereDate('timestamp', $today)
        ->orderBy('timestamp')
        ->get();
    
    if ($logs->count() > 0) {
        foreach ($logs as $log) {
            echo "- {$log->check_type} at {$log->timestamp} (Source: {$log->source})\n";
        }
    } else {
        echo "No attendance logs for today\n";
    }
}
