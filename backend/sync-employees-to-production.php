<?php

/**
 * Sync Employees and Attendance Data from Dev to Production
 * 
 * This script exports employee and attendance data from the development database
 * and prepares it for import into production.
 */

require __DIR__.'/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=================================================\n";
echo "Employee & Attendance Data Sync Tool\n";
echo "=================================================\n\n";

// Check current environment
$env = app()->environment();
echo "Current environment: {$env}\n\n";

if ($env === 'production') {
    echo "⚠️  WARNING: You are running this in PRODUCTION environment!\n";
    echo "This script should be run in DEVELOPMENT to export data.\n\n";
    
    $confirm = readline("Are you sure you want to continue? (yes/no): ");
    if (strtolower($confirm) !== 'yes') {
        echo "Operation cancelled.\n";
        exit(0);
    }
}

echo "Exporting data from current database...\n\n";

// Export Employees
echo "1. Exporting employees...\n";
$employees = DB::table('employees')
    ->select([
        'id', 'employee_code', 'biometric_id', 'workplace_id', 'work_schedule_id',
        'allow_mobile_checkin', 'base_salary', 'bank_account_number', 'bank_name',
        'tax_id', 'user_id', 'first_name', 'last_name', 'email', 'phone',
        'branch_id', 'department_id', 'designation_id', 'manager_id',
        'employment_type', 'work_mode', 'status', 'hire_date', 'dob',
        'avatar', 'blood_group', 'genotype', 'academics',
        'password_change_required', 'created_at', 'updated_at'
    ])
    ->get()
    ->toArray();

echo "   ✓ Exported " . count($employees) . " employees\n";

// Export Employee Salaries
echo "2. Exporting employee salaries...\n";
$salaries = DB::table('employee_salaries')
    ->select([
        'id', 'employee_id', 'salary_structure_id', 'base_salary',
        'effective_date', 'is_active', 'created_at', 'updated_at'
    ])
    ->get()
    ->toArray();

echo "   ✓ Exported " . count($salaries) . " salary records\n";

// Export Attendance Records
echo "3. Exporting attendance records...\n";
$attendanceRecords = DB::table('attendance_records')
    ->select([
        'id', 'employee_id', 'attendance_date', 'check_in_time', 'check_out_time',
        'work_minutes', 'late_minutes', 'overtime_minutes', 'break_minutes',
        'status', 'source', 'branch_id', 'department_id', 'approval_status',
        'payroll_locked', 'geo_lat', 'geo_long', 'geo_accuracy_m',
        'geofence_expected_lat', 'geofence_expected_long', 'geofence_radius_m',
        'geofence_distance_m', 'geofence_status', 'geofence_violation_reason',
        'created_at', 'updated_at'
    ])
    ->get()
    ->toArray();

echo "   ✓ Exported " . count($attendanceRecords) . " attendance records\n";

// Export Attendance Logs
echo "4. Exporting attendance logs...\n";
$attendanceLogs = DB::table('attendance_logs')
    ->select([
        'id', 'employee_id', 'check_type', 'timestamp', 'status',
        'geofence_zone_id', 'source', 'device_id', 'location_lat',
        'location_lng', 'photo_url', 'verified', 'sync_status',
        'created_at', 'updated_at'
    ])
    ->get()
    ->toArray();

echo "   ✓ Exported " . count($attendanceLogs) . " attendance logs\n";

// Create export data structure
$exportData = [
    'exported_at' => now()->toDateTimeString(),
    'environment' => $env,
    'employees' => $employees,
    'employee_salaries' => $salaries,
    'attendance_records' => $attendanceRecords,
    'attendance_logs' => $attendanceLogs,
];

// Save to JSON file
$filename = 'employee_attendance_export_' . date('Y-m-d_His') . '.json';
$filepath = storage_path('app/' . $filename);

file_put_contents($filepath, json_encode($exportData, JSON_PRETTY_PRINT));

echo "\n=================================================\n";
echo "✓ Export completed successfully!\n";
echo "=================================================\n\n";
echo "Export file: {$filepath}\n";
echo "File size: " . number_format(filesize($filepath) / 1024, 2) . " KB\n\n";

echo "Summary:\n";
echo "  - Employees: " . count($employees) . "\n";
echo "  - Salaries: " . count($salaries) . "\n";
echo "  - Attendance Records: " . count($attendanceRecords) . "\n";
echo "  - Attendance Logs: " . count($attendanceLogs) . "\n\n";

echo "Next steps:\n";
echo "1. Copy the export file to your production server\n";
echo "2. Run the import script: php import-employees-from-dev.php {$filename}\n\n";
