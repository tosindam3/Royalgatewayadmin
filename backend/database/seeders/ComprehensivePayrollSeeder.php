<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Employee;
use App\Models\EmployeeSalary;
use App\Models\SalaryStructure;
use App\Models\PayrollItem;
use App\Models\PayrollPeriod;
use App\Models\PayrollRun;
use App\Models\AttendanceRecord;
use App\Models\User;
use App\Models\Role;
use App\Models\Department;
use App\Models\Branch;
use App\Services\PayrollRunBuilder;
use App\Services\SubmitPayrollRunAction;
use App\Services\ApprovePayrollRunAction;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * ComprehensivePayrollSeeder - Demonstrates complete payroll approval workflow
 * 
 * This seeder creates:
 * 1. Payroll items (earnings/deductions)
 * 2. Salary structures
 * 3. Employee salary assignments
 * 4. Payroll periods
 * 5. Attendance records
 * 6. Multiple payroll runs in different states:
 *    - Approved run (Feb 2026) - completed workflow
 *    - Submitted run (March 2026) - pending at step 2
 *    - Draft run (April 2026) - not yet submitted
 * 
 * Prerequisites:
 * - PayrollWorkflowSeeder must run first
 * - Roles, employees, branches, departments must exist
 */
class ComprehensivePayrollSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🚀 Starting Comprehensive Payroll Seeder...');
        $this->command->info('This demonstrates the complete approval workflow from preparation to approval');

        DB::beginTransaction();
        try {
            // 1. Setup Payroll Items
            $items = $this->seedPayrollItems();

            // 2. Setup Salary Structures
            $structures = $this->seedSalaryStructures($items);

            // 3. Assign Salaries to Employees
            $this->assignSalariesToEmployees($structures);

            // 4. Setup Payroll Periods
            $periods = $this->seedPayrollPeriods();

            // 5. Seed Attendance Data
            $this->seedAttendanceForPeriod($periods['Feb']);
            $this->seedAttendanceForPeriod($periods['March']);

            // 6. Create APPROVED run for Feb (demonstrates completed workflow)
            $this->seedApprovedRun($periods['Feb']);

            // 7. Create SUBMITTED run for March (demonstrates pending approval)
            $this->seedSubmittedRun($periods['March']);

            // 8. Create DRAFT run for April (demonstrates preparation phase)
            $this->seedDraftRun($periods['April']);

            DB::commit();
            $this->command->info('');
            $this->command->info('✅ Comprehensive Payroll Seeder completed successfully!');
            $this->command->info('');
            $this->command->info('📊 Summary:');
            $this->command->info('  • Payroll Items: Created earnings and deductions');
            $this->command->info('  • Salary Structures: 3 structures (Junior, Mid, Senior)');
            $this->command->info('  • Periods: Feb, March, April 2026');
            $this->command->info('  • Feb Run: APPROVED (completed workflow)');
            $this->command->info('  • March Run: SUBMITTED (pending approval at step 2)');
            $this->command->info('  • April Run: DRAFT (not yet submitted)');
            $this->command->info('');
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('❌ Payroll seeder failed: ' . $e->getMessage());
            Log::error('Payroll seeder failed', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            throw $e;
        }
    }

    private function seedPayrollItems(): array
    {
        $this->command->info('📝 Seeding Payroll Items...');
        
        $items = [
            // Earnings
            ['code' => 'BASIC', 'name' => 'Basic Salary', 'type' => 'earning', 'method' => 'fixed', 'default_value' => 0, 'active' => true, 'is_taxable' => true, 'is_statutory' => false],
            ['code' => 'HRA', 'name' => 'Housing Allowance', 'type' => 'earning', 'method' => 'percentage', 'default_value' => 20, 'active' => true, 'is_taxable' => true, 'is_statutory' => false],
            ['code' => 'TRANSPORT', 'name' => 'Transport Allowance', 'type' => 'earning', 'method' => 'fixed', 'default_value' => 500, 'active' => true, 'is_taxable' => false, 'is_statutory' => false],
            ['code' => 'OVERTIME', 'name' => 'Overtime Pay', 'type' => 'earning', 'method' => 'hourly', 'default_value' => 25, 'active' => true, 'is_taxable' => true, 'is_statutory' => false],
            
            // Deductions
            ['code' => 'TAX', 'name' => 'Income Tax', 'type' => 'deduction', 'method' => 'percentage', 'default_value' => 10, 'active' => true, 'is_taxable' => false, 'is_statutory' => true],
            ['code' => 'PENSION', 'name' => 'Pension Contribution', 'type' => 'deduction', 'method' => 'percentage', 'default_value' => 8, 'active' => true, 'is_taxable' => false, 'is_statutory' => true],
            ['code' => 'HEALTH', 'name' => 'Health Insurance', 'type' => 'deduction', 'method' => 'fixed', 'default_value' => 150, 'active' => true, 'is_taxable' => false, 'is_statutory' => false],
        ];

        $created = [];
        foreach ($items as $item) {
            $created[$item['code']] = PayrollItem::updateOrCreate(['code' => $item['code']], $item);
        }
        
        $this->command->info("  ✓ Created {count($created)} payroll items");
        return $created;
    }

    private function seedSalaryStructures(array $items): array
    {
        $this->command->info('💰 Seeding Salary Structures...');
        
        $structures = [
            [
                'name' => 'Junior Level',
                'code' => 'JUNIOR',
                'description' => 'For entry-level and junior employees',
                'earnings' => ['BASIC', 'HRA', 'TRANSPORT', 'OVERTIME'],
                'deductions' => ['TAX', 'PENSION', 'HEALTH'],
            ],
            [
                'name' => 'Mid Level',
                'code' => 'MID',
                'description' => 'For mid-level employees',
                'earnings' => ['BASIC', 'HRA', 'TRANSPORT', 'OVERTIME'],
                'deductions' => ['TAX', 'PENSION', 'HEALTH'],
            ],
            [
                'name' => 'Senior Level',
                'code' => 'SENIOR',
                'description' => 'For senior and management employees',
                'earnings' => ['BASIC', 'HRA', 'TRANSPORT', 'OVERTIME'],
                'deductions' => ['TAX', 'PENSION', 'HEALTH'],
            ],
        ];

        $created = [];
        foreach ($structures as $struct) {
            $earningIds = collect($struct['earnings'])->map(fn($code) => $items[$code]->id)->toArray();
            $deductionIds = collect($struct['deductions'])->map(fn($code) => $items[$code]->id)->toArray();

            $created[$struct['code']] = SalaryStructure::updateOrCreate(
                ['code' => $struct['code']],
                [
                    'name' => $struct['name'],
                    'description' => $struct['description'],
                    'earnings_components' => $earningIds,
                    'deductions_components' => $deductionIds,
                    'is_active' => true,
                ]
            );
        }

        $this->command->info("  ✓ Created " . count($created) . " salary structures");
        return $created;
    }

    private function assignSalariesToEmployees(array $structures): void
    {
        $this->command->info('👥 Assigning Salaries to Employees...');
        
        $employees = Employee::where('status', 'active')->get();
        
        if ($employees->isEmpty()) {
            $this->command->warn('  ⚠ No active employees found. Skipping salary assignments.');
            return;
        }

        $count = 0;
        foreach ($employees as $employee) {
            // Skip if already has salary
            if ($employee->salary) {
                continue;
            }

            // Assign structure based on employee level or random
            $structureCode = collect(['JUNIOR', 'MID', 'SENIOR'])->random();
            $structure = $structures[$structureCode];

            // Base salary based on level
            $baseSalaries = [
                'JUNIOR' => rand(3000, 5000),
                'MID' => rand(5000, 8000),
                'SENIOR' => rand(8000, 15000),
            ];

            EmployeeSalary::create([
                'employee_id' => $employee->id,
                'salary_structure_id' => $structure->id,
                'base_salary' => $baseSalaries[$structureCode],
                'effective_date' => Carbon::now()->subMonths(3),
                'status' => 'active',
            ]);

            $count++;
        }

        $this->command->info("  ✓ Assigned salaries to {$count} employees");
    }

    private function seedPayrollPeriods(): array
    {
        $this->command->info('📅 Seeding Payroll Periods...');
        
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

        $april = PayrollPeriod::updateOrCreate(
            ['year' => 2026, 'month' => 4],
            [
                'start_date' => '2026-04-01',
                'end_date' => '2026-04-30',
                'working_days' => 22,
                'status' => 'open',
            ]
        );

        $this->command->info('  ✓ Created 3 payroll periods (Feb, March, April 2026)');
        return ['Feb' => $feb, 'March' => $march, 'April' => $april];
    }

    private function seedAttendanceForPeriod(PayrollPeriod $period): void
    {
        $employees = Employee::where('status', 'active')->with('salary')->get()->filter(fn($e) => $e->salary !== null);
        
        if ($employees->isEmpty()) {
            return;
        }

        $startDate = Carbon::parse($period->start_date);
        $endDate = Carbon::parse($period->end_date);

        foreach ($employees->take(20) as $employee) {
            $currentDate = $startDate->copy();
            
            while ($currentDate->lte($endDate)) {
                // Skip weekends
                if ($currentDate->isWeekend()) {
                    $currentDate->addDay();
                    continue;
                }

                // 90% present, 5% absent, 5% late
                $rand = rand(1, 100);
                
                if ($rand <= 90) {
                    // Present
                    AttendanceRecord::updateOrCreate(
                        [
                            'employee_id' => $employee->id,
                            'attendance_date' => $currentDate->toDateString(),
                        ],
                        [
                            'status' => 'present',
                            'clock_in' => $currentDate->copy()->setTime(8, rand(0, 30)),
                            'clock_out' => $currentDate->copy()->setTime(17, rand(0, 30)),
                            'late_minutes' => 0,
                            'overtime_minutes' => rand(0, 60),
                            'work_minutes' => 480 + rand(0, 60),
                        ]
                    );
                } elseif ($rand <= 95) {
                    // Absent
                    AttendanceRecord::updateOrCreate(
                        [
                            'employee_id' => $employee->id,
                            'attendance_date' => $currentDate->toDateString(),
                        ],
                        [
                            'status' => 'absent',
                            'clock_in' => null,
                            'clock_out' => null,
                            'late_minutes' => 0,
                            'overtime_minutes' => 0,
                            'work_minutes' => 0,
                        ]
                    );
                } else {
                    // Late
                    $lateMinutes = rand(15, 60);
                    AttendanceRecord::updateOrCreate(
                        [
                            'employee_id' => $employee->id,
                            'attendance_date' => $currentDate->toDateString(),
                        ],
                        [
                            'status' => 'present',
                            'clock_in' => $currentDate->copy()->setTime(8, 0)->addMinutes($lateMinutes),
                            'clock_out' => $currentDate->copy()->setTime(17, 0),
                            'late_minutes' => $lateMinutes,
                            'overtime_minutes' => 0,
                            'work_minutes' => 480 - $lateMinutes,
                        ]
                    );
                }

                $currentDate->addDay();
            }
        }
    }

    private function seedApprovedRun(PayrollPeriod $period): void
    {
        $this->command->info('✅ Creating APPROVED payroll run for Feb 2026...');
        $this->command->info('   This demonstrates a completed multi-level approval workflow');

        // Get users for workflow
        $hrAdmin = User::whereHas('roles', fn($q) => $q->where('name', 'HR Admin'))->first();
        $admin = User::whereHas('roles', fn($q) => $q->where('name', 'Admin'))->first() ?? User::first();

        if (!$hrAdmin || !$admin) {
            $this->command->warn('  ⚠ Required users not found. Skipping approved run.');
            return;
        }

        // Create run
        $builder = app(PayrollRunBuilder::class);
        $run = $builder->create([
            'period_id' => $period->id,
            'scope_type' => 'all',
            'note' => 'February 2026 Company-Wide Payroll - Completed'
        ], $hrAdmin);

        // Submit for approval (this will auto-assign first approver)
        $submitAction = app(SubmitPayrollRunAction::class);
        $submitAction->execute($run, $hrAdmin, 'Please review and approve February payroll');

        // Simulate multi-step approval
        $run->refresh();
        $approvalRequest = $run->approvalRequest;
        
        if ($approvalRequest) {
            // Approve through all steps until final approval
            $approveAction = app(ApprovePayrollRunAction::class);
            $maxSteps = 10; // Safety limit
            $stepCount = 0;
            
            while ($run->status === 'submitted' && $stepCount < $maxSteps) {
                $run->refresh();
                $currentApprover = User::find($run->approver_user_id);
                
                if (!$currentApprover) {
                    break;
                }

                $approveAction->execute($run, $currentApprover, "Approved at step " . ($stepCount + 1));
                $stepCount++;
            }

            $this->command->info("  ✓ Completed {$stepCount}-step approval workflow");
        }

        $this->command->info("  ✓ Feb run: APPROVED (Total: $" . number_format($run->total_net, 2) . ")");
    }

    private function seedSubmittedRun(PayrollPeriod $period): void
    {
        $this->command->info('⏳ Creating SUBMITTED payroll run for March 2026...');
        $this->command->info('   This demonstrates a run pending approval (stuck at step 2)');

        $hrAdmin = User::whereHas('roles', fn($q) => $q->where('name', 'HR Admin'))->first() ?? User::first();

        if (!$hrAdmin) {
            $this->command->warn('  ⚠ HR Admin not found. Skipping submitted run.');
            return;
        }

        // Create run
        $builder = app(PayrollRunBuilder::class);
        $run = $builder->create([
            'period_id' => $period->id,
            'scope_type' => 'all',
            'note' => 'March 2026 Company-Wide Payroll - Pending Approval'
        ], $hrAdmin);

        // Submit for approval
        $submitAction = app(SubmitPayrollRunAction::class);
        $result = $submitAction->execute($run, $hrAdmin, 'Please review March payroll. Includes 2 new hires.');

        // Approve first step only
        $run->refresh();
        if ($run->status === 'submitted' && $run->approver_user_id) {
            $firstApprover = User::find($run->approver_user_id);
            if ($firstApprover) {
                $approveAction = app(ApprovePayrollRunAction::class);
                $approveAction->execute($run, $firstApprover, 'First level approved - looks good');
                $this->command->info('  ✓ Approved step 1, now pending at step 2');
            }
        }

        $run->refresh();
        $this->command->info("  ✓ March run: SUBMITTED (Pending approval from: " . ($run->approver->name ?? 'Unknown') . ")");
    }

    private function seedDraftRun(PayrollPeriod $period): void
    {
        $this->command->info('📝 Creating DRAFT payroll run for April 2026...');
        $this->command->info('   This demonstrates the preparation phase before submission');

        $hrAdmin = User::whereHas('roles', fn($q) => $q->where('name', 'HR Admin'))->first() ?? User::first();

        if (!$hrAdmin) {
            $this->command->warn('  ⚠ HR Admin not found. Skipping draft run.');
            return;
        }

        // Create run but don't submit
        $builder = app(PayrollRunBuilder::class);
        $run = $builder->create([
            'period_id' => $period->id,
            'scope_type' => 'all',
            'note' => 'April 2026 Company-Wide Payroll - Work in Progress'
        ], $hrAdmin);

        $this->command->info("  ✓ April run: DRAFT (Total: $" . number_format($run->total_net, 2) . ", {$run->employees()->count()} employees)");
    }
}
