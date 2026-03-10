<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

echo "\n=== TESTING PAYROLL RUN EMPLOYEES ENDPOINT ===\n\n";

// Get a user
$user = App\Models\User::first();
if (!$user) {
    echo "ERROR: No users found!\n";
    exit(1);
}

echo "Testing as user: {$user->name} (ID: {$user->id})\n";
echo "User has employee profile: " . ($user->employeeProfile ? 'Yes' : 'No') . "\n\n";

// Simulate the controller logic
$runId = 4;
$run = App\Models\PayrollRun::with([
    'period',
    'preparedBy:id,name',
    'approver:id,name',
    'approvalRequest.actions.approver:id,name'
])->find($runId);

if (!$run) {
    echo "ERROR: Run #{$runId} not found!\n";
    exit(1);
}

echo "Run #{$run->id} found\n";
echo "Status: {$run->status}\n";
echo "Period: {$run->period->name}\n\n";

// Test the employees query
try {
    $employees = App\Models\PayrollRunEmployee::where('payroll_run_id', $runId)
        ->with(['employee.user:id,name', 'employee.department:id,name', 'employee.branch:id,name'])
        ->paginate(50);
    
    echo "✓ Query successful!\n";
    echo "Total employees: {$employees->total()}\n";
    echo "Current page: {$employees->currentPage()}\n";
    echo "Per page: {$employees->perPage()}\n\n";
    
    if ($employees->count() > 0) {
        echo "First employee data:\n";
        $first = $employees->first();
        echo "  ID: {$first->id}\n";
        echo "  Employee ID: {$first->employee_id}\n";
        echo "  Name: " . ($first->employee->user->name ?? 'N/A') . "\n";
        echo "  Staff ID: {$first->employee->staff_id}\n";
        echo "  Department: " . ($first->employee->department->name ?? 'N/A') . "\n";
        echo "  Branch: " . ($first->employee->branch->name ?? 'N/A') . "\n";
        echo "  Base Salary: \${$first->base_salary_snapshot}\n";
        echo "  Gross Pay: \${$first->gross_pay}\n";
        echo "  Deductions: \${$first->total_deductions}\n";
        echo "  Net Pay: \${$first->net_pay}\n";
    }
    
    echo "\n✓ Endpoint should work correctly!\n";
    
} catch (\Exception $e) {
    echo "✗ ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}

echo "\n=== TEST COMPLETE ===\n\n";
