<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Employee;
use App\Models\EmployeeSalary;
use App\Models\SalaryStructure;
use App\Models\PayrollItem;
use App\Models\PayrollPeriod;
use App\Models\PayrollRun;
use App\Models\PayrollRunEmployee;
use App\Models\ApprovalWorkflow;
use App\Models\ApprovalStep;
use App\Models\ApprovalRequest;
use App\Models\AttendanceRecord;
use App\Models\User;
use App\Services\PayrollRunBuilder;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class UnifiedPayrollSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Starting Unified Payroll Seeder...');

        DB::beginTransaction();
        try {
            // 1. Setup Payroll Items
            $items = $this->seedPayrollItems();

            // 2. Setup Approval Workflow
            $workflow = $this->seedApprovalWorkflow();

            // 3. Setup Salary Structures
            $structures = $this->seedSalaryStructures($items);

            // 4. Map Salaries to Existing Employees
            $this->assignSalariesToEmployees($structures);

            // 5. Setup Payroll Periods (Feb and March 2026)
            $periods = $this->seedPayrollPeriods();

            // 6. Create Approved Payroll Run for Feb 2026
            $this->seedHistoricalRun($periods['Feb'], $workflow);

            // 7. Create Draft Payroll Run for March 2026
            $this->seedDraftRun($periods['March']);

            DB::commit();
            $this->command->info('✓ Unified Payroll Seeder completed successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('Seeder failed: ' . $e->getMessage());
            throw $e;
        }
    }

    private function seedPayrollItems(): array
    {
        $this->command->info('Seeding Payroll Items...');
        $items = [
            ['code' => 'BASIC', 'name' => 'Basic Salary', 'type' => 'earning', 'method' => 'fixed', 'default_value' => 0, 'active' => true, 'is_taxable' => true, 'is_statutory' => false],
            ['code' => 'HOU', 'name' => 'Housing Allowance', 'type' => 'earning', 'method' => 'percent_of_base', 'default_value' => 20, 'active' => true, 'is_taxable' => true, 'is_statutory' => false],
            ['code' => 'PAYE', 'name' => 'Income Tax', 'type' => 'deduction', 'method' => 'percent_of_base', 'default_value' => 10, 'active' => true, 'is_taxable' => false, 'is_statutory' => true],
            ['code' => 'PEN', 'name' => 'Pension Fund', 'type' => 'deduction', 'method' => 'percent_of_base', 'default_value' => 8, 'active' => true, 'is_taxable' => false, 'is_statutory' => true],
        ];

        $created = [];
        foreach ($items as $item) {
            $created[$item['code']] = PayrollItem::updateOrCreate(['code' => $item['code']], $item);
        }
        return $created;
    }

    private function seedApprovalWorkflow(): ApprovalWorkflow
    {
        $this->command->info('Seeding Approval Workflow...');
        $workflow = ApprovalWorkflow::updateOrCreate(
            ['code' => 'payroll_run_approval'],
            [
                'name' => 'Payroll Run Approval',
                'module' => 'payroll',
                'trigger_event' => 'submitted',
                'description' => 'Standard workflow for payroll approval',
                'is_active' => true,
                'is_system' => true,
                'priority' => 1,
            ]
        );

        ApprovalStep::updateOrCreate(
            ['workflow_id' => $workflow->id, 'step_order' => 1],
            [
                'name' => 'Finance Director Approval',
                'approver_type' => 'user',
                'is_required' => true,
            ]
        );

        return $workflow;
    }

    private function seedSalaryStructures(array $items): array
    {
        $this->command->info('Seeding Salary Structures...');
        $structures = [
            [
                'name' => 'Standard Grade',
                'description' => 'Default structure for most staff.',
                'earnings' => ['BASIC', 'HOU'],
                'deductions' => ['PAYE', 'PEN']
            ],
            [
                'name' => 'Executive Grade',
                'description' => 'Premium structure for management.',
                'earnings' => ['BASIC', 'HOU'],
                'deductions' => ['PAYE', 'PEN']
            ]
        ];

        $created = [];
        foreach ($structures as $s) {
            $eIds = collect($s['earnings'])->map(fn($c) => $items[$c]->id)->toArray();
            $dIds = collect($s['deductions'])->map(fn($c) => $items[$c]->id)->toArray();

            $created[$s['name']] = SalaryStructure::updateOrCreate(
                ['name' => $s['name']],
                [
                    'description' => $s['description'],
                    'earnings_components' => $eIds,
                    'deductions_components' => $dIds,
                    'is_active' => true
                ]
            );
        }
        return $created;
    }

    private function assignSalariesToEmployees(array $structures): void
    {
        $this->command->info('Assigning Salaries to Employees...');
        $employees = Employee::all();
        $standard = $structures['Standard Grade'];
        $executive = $structures['Executive Grade'];

        foreach ($employees as $index => $employee) {
            EmployeeSalary::updateOrCreate(
                ['employee_id' => $employee->id],
                [
                    'salary_structure_id' => $index < 3 ? $executive->id : $standard->id,
                    'base_salary' => $index < 3 ? 15000 : 5000,
                    'effective_date' => Carbon::now()->subMonths(3)->startOfMonth(),
                    'is_active' => true
                ]
            );

            // Also update the employee model if it has redundant fields
            $employee->update([
                'base_salary' => $index < 3 ? 15000 : 5000,
                'bank_name' => 'Global Bank',
                'bank_account_number' => '0012345678',
                'tax_id' => 'TIN-ABC' . $employee->id
            ]);
        }
    }

    private function seedPayrollPeriods(): array
    {
        $this->command->info('Seeding Payroll Periods...');
        
        $feb = PayrollPeriod::updateOrCreate(
            ['year' => 2026, 'month' => 2],
            [
                'start_date' => '2026-02-01',
                'end_date' => '2026-02-28',
                'working_days' => 20,
                'status' => 'closed',
            ]
        );

        $march = PayrollPeriod::updateOrCreate(
            ['year' => 2026, 'month' => 3],
            [
                'start_date' => '2026-03-01',
                'end_date' => '2026-03-31',
                'working_days' => 22,
                'status' => 'open',
            ]
        );

        return ['Feb' => $feb, 'March' => $march];
    }

    private function seedHistoricalRun(PayrollPeriod $period, ApprovalWorkflow $workflow): void
    {
        $this->command->info('Seeding Approved Payroll Run for Feb 2026...');
        $admin = User::first();
        if (!$admin) return;

        // Seed some attendance for Feb to make it look real
        $this->seedAttendance($period);

        $builder = app(PayrollRunBuilder::class);
        $run = $builder->create([
            'period_id' => $period->id,
            'scope_type' => 'all',
            'approver_user_id' => $admin->id,
            'note' => 'Final Feb 2026 Payroll'
        ], $admin);

        // Transition to Approved
        $run->update([
            'status' => 'approved',
            'submitted_at' => Carbon::now()->subDays(15),
            'approved_at' => Carbon::now()->subDays(14),
        ]);

        // Create the approval request record to satisfy historical view requirements
        ApprovalRequest::create([
            'request_number' => 'PR-' . $period->year . $period->month . '-001',
            'workflow_id' => $workflow->id,
            'requestable_type' => PayrollRun::class,
            'requestable_id' => $run->id,
            'requester_id' => $admin->id,
            'current_approver_id' => $admin->id,
            'status' => 'approved',
            'current_step' => 1,
            'submitted_at' => $run->submitted_at,
            'completed_at' => $run->approved_at,
        ]);
    }

    private function seedDraftRun(PayrollPeriod $period): void
    {
        $this->command->info('Seeding Draft Payroll Run for March 2026...');
        $admin = User::first();
        if (!$admin) return;

        $builder = app(PayrollRunBuilder::class);
        $builder->create([
            'period_id' => $period->id,
            'scope_type' => 'all',
            'approver_user_id' => $admin->id,
            'note' => 'Initial March Payroll Draft'
        ], $admin);
    }

    private function seedAttendance(PayrollPeriod $period): void
    {
        $employees = Employee::take(10)->get();
        $start = Carbon::parse($period->start_date);
        $end = Carbon::parse($period->end_date);

        foreach ($employees as $employee) {
            for ($date = $start->copy(); $date->lte($end); $date->addDay()) {
                if ($date->isWeekend()) continue;

                AttendanceRecord::updateOrCreate(
                    ['employee_id' => $employee->id, 'attendance_date' => $date->toDateString()],
                    [
                        'status' => rand(1, 10) > 1 ? 'present' : 'absent',
                        'check_in_time' => $date->copy()->setTime(9, rand(0, 15)),
                        'check_out_time' => $date->copy()->setTime(17, rand(0, 30)),
                        'department_id' => $employee->department_id,
                        'branch_id' => $employee->branch_id,
                    ]
                );
            }
        }
    }
}
