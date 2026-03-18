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
use App\Services\PayrollRunBuilder;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SinglePeriodPayrollSeeder extends Seeder
{
    /**
     * Run the single period payroll seeder.
     * This creates May 2026 period with a single DRAFT payroll run.
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting Single Period Payroll Seeder...');
        
        DB::beginTransaction();
        try {
            // 1. Setup basic Payroll Items if they don't exist
            $items = $this->seedPayrollItems();

            // 2. Setup a Test Salary Structure
            $structure = $this->seedSalaryStructure($items);

            // 3. Assign salaries to a subset of employees
            $this->assignSalaries($structure);

            // 4. Setup Single Payroll Period (May 2026)
            $period = PayrollPeriod::updateOrCreate(
                ['year' => 2026, 'month' => 5],
                [
                    'start_date' => '2026-05-01',
                    'end_date' => '2026-05-31',
                    'working_days' => 21,
                    'status' => 'open',
                ]
            );

            // 5. Seed Attendance for this period (1 day for 5 employees)
            $this->seedAttendance($period);

            // 6. Create exactly one DRAFT run (The starting point for E2E Test)
            // Use HR Admin or first available user as preparer
            $hrAdmin = User::whereHas('roles', fn($q) => $q->where('name', 'HR Admin'))->first() 
                      ?? User::whereHas('roles', fn($q) => $q->where('name', 'super_admin'))->first()
                      ?? User::first();

            if (!$hrAdmin) {
                throw new \Exception('No users found to act as payroll preparer.');
            }

            // Check if run already exists for this period
            $existingRun = PayrollRun::where('period_id', $period->id)->first();
            if ($existingRun) {
                $this->command->warn("  ⚠ A payroll run already exists for May 2026. Skipping creation.");
            } else {
                $builder = app(PayrollRunBuilder::class);
                $run = $builder->create([
                    'period_id' => $period->id,
                    'scope_type' => 'all',
                    'note' => 'May 2026 E2E Test Run'
                ], $hrAdmin);
                
                $this->command->info("  ✓ Created DRAFT payroll run for May 2026");
            }

            DB::commit();
            $this->command->info('');
            $this->command->info('✅ SinglePeriodPayrollSeeder completed successfully!');
            $this->command->info('   You can now test the flow from Preparation to Final Approval.');
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('❌ Seeder failed: ' . $e->getMessage());
            throw $e;
        }
    }

    private function seedPayrollItems(): array 
    {
        $items = [
            ['code' => 'BASIC', 'name' => 'Basic Salary', 'type' => 'earning', 'method' => 'fixed', 'default_value' => 0, 'active' => true, 'is_taxable' => true, 'is_statutory' => false],
            ['code' => 'TAX', 'name' => 'Income Tax', 'type' => 'deduction', 'method' => 'percent_of_base', 'default_value' => 10, 'active' => true, 'is_taxable' => false, 'is_statutory' => true],
        ];
        
        $created = [];
        foreach ($items as $item) {
            $created[$item['code']] = PayrollItem::updateOrCreate(['code' => $item['code']], $item);
        }
        return $created;
    }

    private function seedSalaryStructure($items) 
    {
        return SalaryStructure::updateOrCreate(
            ['name' => 'E2E Test Salary Structure'],
            [
                'description' => 'Simple structure for testing payroll lifecycle',
                'earnings_components' => [$items['BASIC']->id],
                'deductions_components' => [$items['TAX']->id],
                'is_active' => true,
            ]
        );
    }

    private function assignSalaries($structure): void
    {
        // Take up to 5 employees who don't have salaries yet
        $employees = Employee::where('status', 'active')
            ->whereDoesntHave('salary')
            ->take(5)
            ->get();
            
        // If all have salaries, take any 5
        if ($employees->isEmpty()) {
            $employees = Employee::where('status', 'active')->take(5)->get();
        }

        foreach ($employees as $employee) {
            EmployeeSalary::updateOrCreate(
                ['employee_id' => $employee->id],
                [
                    'salary_structure_id' => $structure->id,
                    'base_salary' => 5000,
                    'effective_date' => '2026-01-01',
                    'is_active' => true,
                ]
            );
        }
        $this->command->info("  ✓ Assigned salaries to " . $employees->count() . " employees");
    }

    private function seedAttendance(PayrollPeriod $period): void
    {
        $employees = Employee::whereHas('salary')->get();
        $startDate = Carbon::parse($period->start_date);
        
        foreach ($employees as $employee) {
            AttendanceRecord::updateOrCreate(
                [
                    'employee_id' => $employee->id, 
                    'attendance_date' => $startDate->toDateString()
                ],
                [
                    'status' => 'present',
                    'check_in_time' => $startDate->copy()->setTime(8,0),
                    'check_out_time' => $startDate->copy()->setTime(17,0),
                    'work_minutes' => 480,
                    'late_minutes' => 0,
                    'overtime_minutes' => 0,
                ]
            );
        }
        $this->command->info("  ✓ Seeded attendance records for " . $employees->count() . " employees");
    }
}
