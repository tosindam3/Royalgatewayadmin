<?php
// Check superadmin dashboard data

echo "=== Superadmin Dashboard Data Check ===" . PHP_EOL . PHP_EOL;

// Find superadmin user
$user = App\Models\User::where('email', 'admin@royalgatewayadmin.com')->first();

if ($user) {
    echo "Superadmin User Found:" . PHP_EOL;
    echo "  Name: " . $user->name . PHP_EOL;
    echo "  Email: " . $user->email . PHP_EOL;
    echo "  Role: " . $user->role . PHP_EOL;
    
    $employee = $user->employee;
    if ($employee) {
        echo "  Employee ID: " . $employee->id . PHP_EOL;
        echo "  Organization ID: " . ($employee->organization_id ?? 'NULL') . PHP_EOL;
        echo "  Department: " . ($employee->department->name ?? 'N/A') . PHP_EOL;
        echo "  Designation: " . ($employee->designation->name ?? 'N/A') . PHP_EOL;
    } else {
        echo "  No employee record linked" . PHP_EOL;
    }
} else {
    echo "Superadmin user not found!" . PHP_EOL;
}

echo PHP_EOL . "=== System Statistics ===" . PHP_EOL;
echo "Total Organizations: " . App\Models\Organization::count() . PHP_EOL;
echo "Total Employees: " . App\Models\Employee::count() . PHP_EOL;
echo "Total Users: " . App\Models\User::count() . PHP_EOL;
echo "Total Departments: " . App\Models\Department::count() . PHP_EOL;
echo "Total Branches: " . App\Models\Branch::count() . PHP_EOL;

echo PHP_EOL . "=== Recent Activity ===" . PHP_EOL;
echo "Attendance Records (last 7 days): " . App\Models\AttendanceRecord::where('date', '>=', now()->subDays(7))->count() . PHP_EOL;
echo "Leave Requests (pending): " . App\Models\LeaveRequest::where('status', 'pending')->count() . PHP_EOL;
echo "Chat Messages (last 24h): " . App\Models\ChatMessage::where('created_at', '>=', now()->subDay())->count() . PHP_EOL;

echo PHP_EOL . "=== Organizations List ===" . PHP_EOL;
$orgs = App\Models\Organization::with('employees')->get();
foreach ($orgs as $org) {
    echo "  - " . $org->name . " (ID: " . $org->id . ", Employees: " . $org->employees->count() . ")" . PHP_EOL;
}
