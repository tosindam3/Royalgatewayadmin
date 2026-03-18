<?php

use App\Models\AttendanceRecord;
use App\Models\Employee;
use App\Models\EmployeeSalary;
use App\Models\OrganizationSetting;
use App\Models\PayrollPeriod;
use App\Models\PayrollRun;
use App\Models\PayrollRunEmployee;
use App\Models\PerformanceSubmission;
use App\Models\User;
use App\Services\PayrollRunBuilder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;

// Bootstrap Laravel
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Starting Payroll Logic Verification...\n";

// 1. Initialize Policies
Artisan::call('db:seed', ['--class' => 'PayrollPolicySeeder']);

// Also seed individual keys to test the merge logic in PayrollRunBuilder
OrganizationSetting::updateOrCreate(['key' => 'attendance.grace_period_minutes'], ['value' => 10, 'type' => 'integer']);
OrganizationSetting::updateOrCreate(['key' => 'attendance.work_hours_per_day'], ['value' => 8, 'type' => 'integer']);
OrganizationSetting::updateOrCreate(['key' => 'performance.bonus_threshold'], ['value' => 85, 'type' => 'integer']);
OrganizationSetting::updateOrCreate(['key' => 'performance.bonus_percentage'], ['value' => 10, 'type' => 'integer']);

echo "✓ Policies initialized (Mixed Global & Individual).\n";

// 2. Find Test Employee (Kelly Robinson)
$employee = Employee::where('employee_code', 'EMP-00001')->first();
if (!$employee) {
    die("Employee EMP-00001 not found. Please seed employees first.\n");
}
echo "✓ Found employee: {$employee->full_name}\n";

// 3. Create a Payroll Period
$period = PayrollPeriod::updateOrCreate(
    ['year' => 2026, 'month' => 3],
    [
        'start_date' => '2026-03-01',
        'end_date' => '2026-03-31',
        'working_days' => 22,
        'status' => 'open'
    ]
);
echo "✓ Created Payroll Period: March 2026\n";

// 4. Create Attendance Records
// Clear old ones for this period
AttendanceRecord::where('employee_id', $employee->id)
    ->whereBetween('attendance_date', ['2026-03-01', '2026-03-31'])
    ->delete();

// - One day late (60 mins)
AttendanceRecord::create([
    'employee_id' => $employee->id,
    'attendance_date' => '2026-03-02',
    'late_minutes' => 60,
    'status' => 'on_time',
    'branch_id' => $employee->branch_id,
    'department_id' => $employee->department_id,
]);

// - One day absent
AttendanceRecord::create([
    'employee_id' => $employee->id,
    'attendance_date' => '2026-03-03',
    'status' => 'absent',
    'branch_id' => $employee->branch_id,
    'department_id' => $employee->department_id,
]);

// - Overtime (2 hours = 120 mins)
AttendanceRecord::create([
    'employee_id' => $employee->id,
    'attendance_date' => '2026-03-04',
    'overtime_minutes' => 120,
    'status' => 'present',
    'branch_id' => $employee->branch_id,
    'department_id' => $employee->department_id,
]);

echo "✓ Created 3 Attendance Records (Late, Absent, Overtime).\n";

// 5. Create Performance Submission
PerformanceSubmission::updateOrCreate(
    ['employee_id' => $employee->id, 'period' => 'March 2026'],
    [
        'score' => 90, // Should trigger bonus (threshold 80)
        'status' => 'approved',
        'department_id' => $employee->department_id,
        'branch_id' => $employee->branch_id,
        'form_data' => [],
    ]
);
echo "✓ Created Performance Submission (Score: 90).\n";

// 6. Run Payroll Builder
$builder = app(PayrollRunBuilder::class);
$preparer = User::where('role', 'super_admin')->first();

// Delete old run if exists
PayrollRun::where('period_id', $period->id)->delete();

$run = $builder->create([
    'period_id' => $period->id,
    'scope_type' => 'all',
], $preparer);

echo "✓ Payroll Run Created: ID {$run->id}\n";

// 7. Verify Results for Kelly
$kellyRun = PayrollRunEmployee::where('payroll_run_id', $run->id)
    ->where('employee_id', $employee->id)
    ->first();

if (!$kellyRun) {
    die("❌ Kelly not found in payroll run employees!\n");
}

$earnings = $kellyRun->earnings_json;
$deductions = $kellyRun->deductions_json;

echo "\n--- Calculation Results (Kelly Robinson) ---\n";
echo "Base Salary: " . number_format($kellyRun->base_salary_snapshot, 2) . "\n";
echo "Net Pay: " . number_format($kellyRun->net_pay, 2) . "\n";

echo "\nEarnings Breakdown:\n";
foreach ($earnings as $item) {
    echo "- {$item['label']}: " . number_format($item['amount'], 2) . " [Code: {$item['code']}]\n";
}

echo "\nDeductions Breakdown:\n";
foreach ($deductions as $item) {
    echo "- {$item['label']}: " . number_format($item['amount'], 2) . " [Code: {$item['code']}]\n";
}

// 8. Test Manual Adjustment
echo "\nTesting Manual Adjustment (Adding Bonus)...\n";
$controller = app(\App\Http\Controllers\PayrollRunController::class);
$request = new \Illuminate\Http\Request([
    'employee_id' => $employee->id,
    'item_code' => 'BASE_SALARY',
    'amount' => $kellyRun->base_salary_snapshot + 500,
    'note' => 'Test admin adjustment'
]);

// Log in as Super Admin
Auth::login($preparer);

$response = $controller->adjustItem($request, $run->id);
$resData = json_decode($response->getContent(), true);

echo "✓ Adjustment Response: " . $resData['message'] . "\n";
echo "✓ New Net Pay: " . number_format($resData['data']['net_pay'], 2) . "\n";

echo "\nVerification Completed Successfully!\n";
