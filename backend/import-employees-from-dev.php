<?php

/**
 * Import Employees and Attendance Data from Dev Export
 * 
 * This script imports employee and attendance data exported from development
 * into the production database.
 */

require __DIR__.'/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=================================================\n";
echo "Employee & Attendance Data Import Tool\n";
echo "=================================================\n\n";

// Check for filename argument
if ($argc < 2) {
    echo "Usage: php import-employees-from-dev.php <export_filename>\n";
    echo "Example: php import-employees-from-dev.php employee_attendance_export_2026-03-12_123456.json\n";
    exit(1);
}

$filename = $argv[1];
$filepath = storage_path('app/' . $filename);

// Check if file exists
if (!file_exists($filepath)) {
    echo "❌ Error: Export file not found: {$filepath}\n";
    exit(1);
}

echo "Import file: {$filepath}\n";
echo "File size: " . number_format(filesize($filepath) / 1024, 2) . " KB\n\n";

// Load export data
$exportData = json_decode(file_get_contents($filepath), true);

if (!$exportData) {
    echo "❌ Error: Invalid JSON file\n";
    exit(1);
}

echo "Export details:\n";
echo "  - Exported at: {$exportData['exported_at']}\n";
echo "  - Source environment: {$exportData['environment']}\n";
echo "  - Employees: " . count($exportData['employees']) . "\n";
echo "  - Salaries: " . count($exportData['employee_salaries']) . "\n";
echo "  - Attendance Records: " . count($exportData['attendance_records']) . "\n";
echo "  - Attendance Logs: " . count($exportData['attendance_logs']) . "\n\n";

// Check current environment
$env = app()->environment();
echo "Current environment: {$env}\n\n";

if ($env !== 'production') {
    echo "⚠️  WARNING: You are NOT in production environment!\n";
    echo "This script should typically be run in PRODUCTION.\n\n";
}

$confirm = readline("Do you want to proceed with the import? (yes/no): ");
if (strtolower($confirm) !== 'yes') {
    echo "Operation cancelled.\n";
    exit(0);
}

echo "\nStarting import...\n\n";

DB::beginTransaction();

try {
    // Import Employees
    echo "1. Importing employees...\n";
    $employeeCount = 0;
    foreach ($exportData['employees'] as $employee) {
        $employee = (array) $employee;
        
        // Check if employee exists
        $exists = DB::table('employees')->where('id', $employee['id'])->exists();
        
        if ($exists) {
            DB::table('employees')->where('id', $employee['id'])->update($employee);
        } else {
            DB::table('employees')->insert($employee);
        }
        $employeeCount++;
    }
    echo "   ✓ Imported/Updated {$employeeCount} employees\n";

    // Import Employee Salaries
    echo "2. Importing employee salaries...\n";
    $salaryCount = 0;
    foreach ($exportData['employee_salaries'] as $salary) {
        $salary = (array) $salary;
        
        // Check if salary record exists
        $exists = DB::table('employee_salaries')->where('id', $salary['id'])->exists();
        
        if ($exists) {
            DB::table('employee_salaries')->where('id', $salary['id'])->update($salary);
        } else {
            DB::table('employee_salaries')->insert($salary);
        }
        $salaryCount++;
    }
    echo "   ✓ Imported/Updated {$salaryCount} salary records\n";

    // Import Attendance Records
    echo "3. Importing attendance records...\n";
    $recordCount = 0;
    foreach ($exportData['attendance_records'] as $record) {
        $record = (array) $record;
        
        // Check if attendance record exists
        $exists = DB::table('attendance_records')
            ->where('employee_id', $record['employee_id'])
            ->where('attendance_date', $record['attendance_date'])
            ->exists();
        
        if ($exists) {
            DB::table('attendance_records')
                ->where('employee_id', $record['employee_id'])
                ->where('attendance_date', $record['attendance_date'])
                ->update($record);
        } else {
            DB::table('attendance_records')->insert($record);
        }
        $recordCount++;
    }
    echo "   ✓ Imported/Updated {$recordCount} attendance records\n";

    // Import Attendance Logs
    echo "4. Importing attendance logs...\n";
    $logCount = 0;
    foreach ($exportData['attendance_logs'] as $log) {
        $log = (array) $log;
        
        // Check if log exists
        $exists = DB::table('attendance_logs')->where('id', $log['id'])->exists();
        
        if (!$exists) {
            DB::table('attendance_logs')->insert($log);
            $logCount++;
        }
    }
    echo "   ✓ Imported {$logCount} new attendance logs\n";

    DB::commit();

    echo "\n=================================================\n";
    echo "✓ Import completed successfully!\n";
    echo "=================================================\n\n";

    echo "Summary:\n";
    echo "  - Employees: {$employeeCount} imported/updated\n";
    echo "  - Salaries: {$salaryCount} imported/updated\n";
    echo "  - Attendance Records: {$recordCount} imported/updated\n";
    echo "  - Attendance Logs: {$logCount} imported\n\n";

} catch (\Exception $e) {
    DB::rollBack();
    
    echo "\n❌ Error during import: " . $e->getMessage() . "\n";
    echo "Transaction rolled back. No changes were made.\n\n";
    exit(1);
}
