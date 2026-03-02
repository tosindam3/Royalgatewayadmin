<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\SalaryStructure;
use App\Models\EmployeeSalary;
use App\Models\Employee;
use App\Models\PayrollItem;
use App\Models\PayrollPeriod;
use App\Models\AttendanceRecord;
use App\Models\User;
use App\Services\PayrollRunBuilder;
use Carbon\Carbon;
use Illuminate\Support\Facades\Artisan;

class PayrollDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Ensure Prerequisites exist
        if (PayrollPeriod::count() === 0) {
            $this->command->info('Seeding Payroll Periods...');
            Artisan::call('db:seed', ['--class' => 'PayrollPeriodsSeeder']);
        }

        // 2. Create default payroll items
        $this->seedPayrollItems();

        // 3. Create Salary Structures
        $this->seedSalaryStructures();

        // 4. Map Employees & Seed Connected Data
        $this->seedEmployeeData();

        // 5. Generate a Payroll Run for the last month
        $this->generateSampleRun();
    }

    private function seedPayrollItems()
    {
        PayrollItem::firstOrCreate(['code' => 'BASIC'], ['name' => 'Basic Salary', 'type' => 'earning', 'method' => 'fixed', 'default_value' => 0, 'active' => true, 'is_taxable' => true, 'is_statutory' => false]);
        PayrollItem::firstOrCreate(['code' => 'HOU'], ['name' => 'Housing Allowance', 'type' => 'earning', 'method' => 'percent_of_base', 'default_value' => 20, 'active' => true, 'is_taxable' => true, 'is_statutory' => false]);
        PayrollItem::firstOrCreate(['code' => 'PAYE'], ['name' => 'Income Tax', 'type' => 'deduction', 'method' => 'percent_of_base', 'default_value' => 10, 'active' => true, 'is_taxable' => false, 'is_statutory' => true]);
        PayrollItem::firstOrCreate(['code' => 'PEN'], ['name' => 'Pension Fund', 'type' => 'deduction', 'method' => 'percent_of_base', 'default_value' => 8, 'active' => true, 'is_taxable' => false, 'is_statutory' => true]);
    }

    private function seedSalaryStructures()
    {
        $basic = PayrollItem::where('code', 'BASIC')->first();
        $housing = PayrollItem::where('code', 'HOU')->first();
        $tax = PayrollItem::where('code', 'PAYE')->first();
        $pension = PayrollItem::where('code', 'PEN')->first();

        SalaryStructure::firstOrCreate(
            ['name' => 'Standard Corporate Grade'],
            [
                'description' => 'Default structure for most office-based roles.',
                'earnings_components' => [$basic->id, $housing->id],
                'deductions_components' => [$tax->id, $pension->id],
                'is_active' => true
            ]
        );

        SalaryStructure::firstOrCreate(
            ['name' => 'Executive Grade'],
            [
                'description' => 'Premium structure for senior management.',
                'earnings_components' => [$basic->id, $housing->id],
                'deductions_components' => [$tax->id, $pension->id],
                'is_active' => true
            ]
        );
    }

    private function seedEmployeeData()
    {
        $standard = SalaryStructure::where('name', 'Standard Corporate Grade')->first();
        $exec = SalaryStructure::where('name', 'Executive Grade')->first();
        $period = PayrollPeriod::where('status', 'closed')->latest('end_date')->first();

        $employees = Employee::take(15)->get();
        foreach ($employees as $index => $employee) {
            // Salary Mapping
            EmployeeSalary::updateOrCreate(
                ['employee_id' => $employee->id],
                [
                    'salary_structure_id' => $index < 3 ? $exec->id : $standard->id,
                    'base_salary' => $index < 3 ? 15000 : 5000,
                    'effective_date' => Carbon::now()->subMonths(3)->startOfMonth(),
                    'is_active' => true
                ]
            );

            // Attendance Data for the last closed period
            if ($period) {
                $this->seedAttendanceForEmployee($employee, $period);
            }
        }

        // Performance Scores - Only seed if they don't exist for the period
        if ($period && \App\Models\PerformanceMonthlyScore::where('period_id', $period->id)->count() === 0) {
            $this->command->info('Seeding Performance Scores...');
            Artisan::call('db:seed', ['--class' => 'PerformanceScoresSeeder']);
        }
    }

    private function seedAttendanceForEmployee($employee, $period)
    {
        $startDate = Carbon::parse($period->start_date);
        $endDate = Carbon::parse($period->end_date);

        for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            if ($date->isWeekend()) continue;

            // 90% chance of being present
            $status = rand(1, 10) > 1 ? 'present' : 'absent';
            $late = $status === 'present' ? (rand(1, 10) > 8 ? rand(5, 45) : 0) : 0;
            $overtime = $status === 'present' ? (rand(1, 10) > 7 ? rand(60, 180) : 0) : 0;

            AttendanceRecord::updateOrCreate(
                ['employee_id' => $employee->id, 'attendance_date' => $date->toDateString()],
                [
                    'status' => $status,
                    'check_in_time' => $status === 'present' ? $date->copy()->setTime(9, $late) : null,
                    'check_out_time' => $status === 'present' ? $date->copy()->setTime(17, $overtime / 60) : null,
                    'late_minutes' => $late,
                    'overtime_minutes' => $overtime,
                    'work_minutes' => $status === 'present' ? 480 : 0,
                    'department_id' => $employee->department_id,
                    'branch_id' => $employee->branch_id,
                ]
            );
        }
    }

    private function generateSampleRun()
    {
        $period = PayrollPeriod::where('status', 'closed')->latest('end_date')->first();
        if (!$period) return;

        $admin = User::first();
        if (!$admin) return;

        // Clean up previous sample data to ensure a fresh "Pending" state for the demo
        \App\Models\PayrollRun::where('note', 'System generated sample run for verification.')->forceDelete();
        \App\Models\ApprovalRequest::where('requestable_type', \App\Models\PayrollRun::class)->withTrashed()->forceDelete();

        // Ensure Workflow exists
        $workflow = \App\Models\ApprovalWorkflow::where('code', 'payroll_run_approval')->first();
        if (!$workflow) {
            Artisan::call('db:seed', ['--class' => 'PayrollWorkflowSeeder']);
            $workflow = \App\Models\ApprovalWorkflow::where('code', 'payroll_run_approval')->first();
        }

        $builder = app(PayrollRunBuilder::class);
        
        $run = $builder->create([
            'period_id' => $period->id,
            'scope_type' => 'all',
            'approver_user_id' => $admin->id,
            'note' => 'System generated sample run for verification.'
        ], $admin);

        // Create an Approval Request for this run for EVERY user to ensure visibility in the demo
        $users = User::all();
        foreach ($users as $user) {
            $reqNum = \App\Models\ApprovalRequest::generateRequestNumber();
            if ($user->id > 2) {
                // For users beyond the first two, add a suffix to keep request numbers unique if needed
                // though the generateRequestNumber should ideally handle it, the seeder logic previously
                // used a suffix for ID 2.
                $reqNum .= '-' . $user->id;
            }
            
            \App\Models\ApprovalRequest::create([
                'request_number' => $reqNum,
                'workflow_id' => $workflow->id,
                'requestable_type' => \App\Models\PayrollRun::class,
                'requestable_id' => $run->id,
                'requester_id' => $admin->id,
                'status' => 'pending',
                'current_approver_id' => $user->id,
                'current_step' => 1,
                'requester_comment' => "Please review this payroll run (Assigned to User: {$user->name}).",
                'submitted_at' => now(),
            ]);
        }

        $run->update([
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $this->command->info('Sample Payroll Run generated and sent for approval.');
    }
}
