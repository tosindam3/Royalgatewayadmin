<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\{
    Employee,
    EmployeeSalary,
    SalaryStructure,
    PayrollPeriod,
    PayrollItem,
    PayrollRun,
    PayrollRunEmployee,
    AttendanceRecord,
    PerformanceSubmission,
    ApprovalWorkflow,
    ApprovalRequest,
    User,
    Branch,
    Department
};
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class PayrollVerificationSeeder extends Seeder
{
    /**
     * Comprehensive seeder to verify all payroll endpoints
     * Creates realistic data using existing employees, attendance, and performance records
     */
    public function run(): void
    {
        $this->command->info('Starting Payroll Verification Seeder...');

        DB::beginTransaction();
        try {
            // 1. Ensure prerequisites
            $this->ensurePrerequisites();

            // 2. Create payroll items
            $items = $this->createPayrollItems();

            // 3. Create salary structures
            $structures = $this->createSalaryStructures($items);

            // 4. Assign salaries to employees
            $this->assignEmployeeSalaries($structures);

            // 5. Create payroll periods
            $periods = $this->createPayrollPeriods();

            // 6. Seed attendance data for periods
            $this->seedAttendanceData($periods);

            // 7. Seed performance data
            $this->seedPerformanceData($periods);

            // 8. Create sample payroll runs
            $this->createPayrollRuns($periods);

            DB::commit();
            $this->command->info('✓ Payroll Verification Seeder completed successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('Seeder failed: ' . $e->getMessage());
            throw $e;
        }
    }

    private function ensurePrerequisites(): void
    {
        $this->command->info('Checking prerequisites...');

        if (Employee::count() === 0) {
            $this->command->warn('No employees found. Running EmployeeSeeder...');
            $this->call(EmployeeSeeder::class);
        }

        if (User::count() === 0) {
            $this->command->error('No users found. Please run UserSeeder first.');
            throw new \Exception('Users required');
        }

        $this->command->info('✓ Prerequisites verified');
    }

    private function createPayrollItems(): array
    {
        $this->command->info('Creating payroll items...');

        $items = [
            // Earnings
            [
                'name' => 'Base Salary',
                'code' => 'BASE_SALARY',
                'type' => 'earning',
                'method' => 'fixed',
                'default_value' => 0,
                'active' => true,
                'description' => 'Monthly base salary',
            ],
            [
                'name' => 'Housing Allowance',
                'code' => 'HOUSING',
                'type' => 'earning',
                'method' => 'percent_of_base',
                'default_value' => 20.00,
                'active' => true,
                'description' => 'Housing allowance (20% of base)',
            ],
            [
                'name' => 'Transport Allowance',
                'code' => 'TRANSPORT',
                'type' => 'earning',
                'method' => 'fixed',
                'default_value' => 500.00,
                'active' => true,
                'description' => 'Monthly transport allowance',
            ],
            [
                'name' => 'Overtime Pay',
                'code' => 'OVERTIME',
                'type' => 'earning',
                'method' => 'fixed',
                'default_value' => 0,
                'active' => true,
                'description' => 'Overtime compensation',
            ],
            [
                'name' => 'Performance Bonus',
                'code' => 'PERFORMANCE_BONUS',
                'type' => 'earning',
                'method' => 'percent_of_base',
                'default_value' => 10.00,
                'active' => true,
                'description' => 'Performance-based bonus (score >= 80)',
            ],
            
            // Deductions
            [
                'name' => 'Income Tax',
                'code' => 'TAX',
                'type' => 'deduction',
                'method' => 'percent_of_base',
                'default_value' => 10.00,
                'active' => true,
                'description' => 'Income tax withholding',
            ],
            [
                'name' => 'Pension Contribution',
                'code' => 'PENSION',
                'type' => 'deduction',
                'method' => 'percent_of_base',
                'default_value' => 8.00,
                'active' => true,
                'description' => 'Pension fund contribution',
            ],
            [
                'name' => 'Absent Days Deduction',
                'code' => 'ABSENT_DEDUCTION',
                'type' => 'deduction',
                'method' => 'fixed',
                'default_value' => 0,
                'active' => true,
                'description' => 'Deduction for absent days',
            ],
            [
                'name' => 'Late Penalty',
                'code' => 'LATE_PENALTY',
                'type' => 'deduction',
                'method' => 'fixed',
                'default_value' => 0,
                'active' => true,
                'description' => 'Penalty for late arrivals',
            ],
            [
                'name' => 'Performance Penalty',
                'code' => 'PERFORMANCE_PENALTY',
                'type' => 'deduction',
                'method' => 'percent_of_base',
                'default_value' => 5.00,
                'active' => true,
                'description' => 'Performance penalty (score < 60)',
            ],
        ];

        $createdItems = [];
        foreach ($items as $item) {
            $createdItems[$item['code']] = PayrollItem::updateOrCreate(
                ['code' => $item['code']],
                $item
            );
        }

        $this->command->info('✓ Created ' . count($items) . ' payroll items');
        return $createdItems;
    }

    private function createSalaryStructures(array $items): array
    {
        $this->command->info('Creating salary structures...');

        $structures = [
            [
                'name' => 'Standard Employee Grade',
                'description' => 'Default structure for regular employees',
                'earnings' => ['BASE_SALARY', 'HOUSING', 'TRANSPORT', 'OVERTIME', 'PERFORMANCE_BONUS'],
                'deductions' => ['TAX', 'PENSION', 'ABSENT_DEDUCTION', 'LATE_PENALTY'],
            ],
            [
                'name' => 'Executive Grade',
                'description' => 'Premium structure for senior management',
                'earnings' => ['BASE_SALARY', 'HOUSING', 'TRANSPORT', 'OVERTIME', 'PERFORMANCE_BONUS'],
                'deductions' => ['TAX', 'PENSION', 'PERFORMANCE_PENALTY'],
            ],
            [
                'name' => 'Contract Worker Grade',
                'description' => 'Structure for contract and part-time workers',
                'earnings' => ['BASE_SALARY', 'TRANSPORT', 'OVERTIME'],
                'deductions' => ['TAX', 'ABSENT_DEDUCTION', 'LATE_PENALTY'],
            ],
        ];

        $createdStructures = [];
        foreach ($structures as $structure) {
            $earningsIds = collect($structure['earnings'])
                ->map(fn($code) => $items[$code]->id ?? null)
                ->filter()
                ->values()
                ->toArray();

            $deductionsIds = collect($structure['deductions'])
                ->map(fn($code) => $items[$code]->id ?? null)
                ->filter()
                ->values()
                ->toArray();

            $createdStructures[$structure['name']] = SalaryStructure::updateOrCreate(
                ['name' => $structure['name']],
                [
                    'description' => $structure['description'],
                    'earnings_components' => $earningsIds,
                    'deductions_components' => $deductionsIds,
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('✓ Created ' . count($structures) . ' salary structures');
        return $createdStructures;
    }

    private function assignEmployeeSalaries(array $structures): void
    {
        $this->command->info('Assigning salaries to employees...');

        $employees = Employee::where('status', 'active')->get();
        $count = 0;

        foreach ($employees as $index => $employee) {
            // Determine salary structure based on employment type and position
            $structure = match($employee->employment_type) {
                'contract', 'part-time' => $structures['Contract Worker Grade'],
                default => $index < 3 ? $structures['Executive Grade'] : $structures['Standard Employee Grade'],
            };

            // Determine base salary
            $baseSalary = match($employee->employment_type) {
                'contract' => rand(3000, 5000),
                'part-time' => rand(2000, 3500),
                default => $index < 3 ? rand(12000, 20000) : rand(5000, 10000),
            };

            EmployeeSalary::updateOrCreate(
                ['employee_id' => $employee->id],
                [
                    'salary_structure_id' => $structure->id,
                    'base_salary' => $baseSalary,
                    'effective_date' => Carbon::now()->subMonths(6)->startOfMonth(),
                    'is_active' => true,
                ]
            );
            $count++;
        }

        $this->command->info("✓ Assigned salaries to {$count} employees");
    }

    private function createPayrollPeriods(): array
    {
        $this->command->info('Creating payroll periods...');

        $periods = [];
        
        // Create last 6 months of periods
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i)->startOfMonth();
            $year = $date->year;
            $month = $date->month;
            
            $startDate = $date->copy()->startOfMonth();
            $endDate = $date->copy()->endOfMonth();
            
            // Calculate working days (weekdays only)
            $workingDays = 0;
            $current = $startDate->copy();
            while ($current->lte($endDate)) {
                if ($current->isWeekday()) {
                    $workingDays++;
                }
                $current->addDay();
            }
            
            // Current month is open, past months are closed
            $status = ($i === 0) ? 'open' : 'closed';
            
            $period = PayrollPeriod::updateOrCreate(
                ['year' => $year, 'month' => $month],
                [
                    'start_date' => $startDate->toDateString(),
                    'end_date' => $endDate->toDateString(),
                    'working_days' => $workingDays,
                    'status' => $status,
                ]
            );

            $periods[] = $period;
        }

        $this->command->info('✓ Created ' . count($periods) . ' payroll periods');
        return $periods;
    }

    private function seedAttendanceData(array $periods): void
    {
        $this->command->info('Seeding attendance data...');

        $employees = Employee::where('status', 'active')->get();
        $totalRecords = 0;

        // Only seed for closed periods
        $closedPeriods = collect($periods)->where('status', 'closed');

        foreach ($closedPeriods as $period) {
            $startDate = Carbon::parse($period->start_date);
            $endDate = Carbon::parse($period->end_date);

            foreach ($employees as $employee) {
                for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
                    if ($date->isWeekend()) continue;

                    // 85% chance of being present
                    $isPresent = rand(1, 100) <= 85;
                    $status = $isPresent ? 'present' : 'absent';
                    
                    // Late minutes (15% chance if present)
                    $lateMinutes = $isPresent && rand(1, 100) <= 15 ? rand(5, 60) : 0;
                    
                    // Overtime (20% chance if present)
                    $overtimeMinutes = $isPresent && rand(1, 100) <= 20 ? rand(30, 180) : 0;

                    AttendanceRecord::updateOrCreate(
                        [
                            'employee_id' => $employee->id,
                            'attendance_date' => $date->toDateString()
                        ],
                        [
                            'status' => $status,
                            'check_in_time' => $isPresent ? $date->copy()->setTime(9, $lateMinutes) : null,
                            'check_out_time' => $isPresent ? $date->copy()->setTime(17, $overtimeMinutes / 60) : null,
                            'late_minutes' => $lateMinutes,
                            'overtime_minutes' => $overtimeMinutes,
                            'work_minutes' => $isPresent ? 480 + $overtimeMinutes : 0,
                            'department_id' => $employee->department_id,
                            'branch_id' => $employee->branch_id,
                            'source' => 'biometric',
                            'approval_status' => 'approved',
                        ]
                    );
                    $totalRecords++;
                }
            }
        }

        $this->command->info("✓ Created {$totalRecords} attendance records");
    }

    private function seedPerformanceData(array $periods): void
    {
        $this->command->info('Seeding performance data...');

        $employees = Employee::where('status', 'active')->get();
        $count = 0;

        // Create performance submissions for closed periods
        $closedPeriods = collect($periods)->where('status', 'closed');

        foreach ($closedPeriods as $period) {
            $periodString = sprintf('%04d-%02d', $period->year, $period->month);

            foreach ($employees as $employee) {
                // 80% of employees have performance submissions
                if (rand(1, 100) > 80) continue;

                $score = rand(50, 100);
                $rating = match(true) {
                    $score >= 90 => 'excellent',
                    $score >= 80 => 'good',
                    $score >= 70 => 'satisfactory',
                    $score >= 60 => 'needs_improvement',
                    default => 'poor',
                };

                PerformanceSubmission::updateOrCreate(
                    [
                        'employee_id' => $employee->id,
                        'period' => $periodString,
                    ],
                    [
                        'department_id' => $employee->department_id,
                        'form_data' => [
                            'quality' => rand(1, 5),
                            'productivity' => rand(1, 5),
                            'teamwork' => rand(1, 5),
                            'communication' => rand(1, 5),
                        ],
                        'score' => $score,
                        'rating' => ['level' => $rating],
                        'breakdown' => [
                            'quality' => rand(10, 25),
                            'productivity' => rand(10, 25),
                            'teamwork' => rand(10, 25),
                            'communication' => rand(10, 25),
                        ],
                        'status' => 'reviewed',
                        'submitted_at' => Carbon::parse($period->end_date)->subDays(5),
                        'reviewed_at' => Carbon::parse($period->end_date)->subDays(2),
                        'reviewed_by' => User::first()->id,
                        'reviewer_comments' => 'Performance reviewed for ' . $period->name,
                    ]
                );
                $count++;
            }
        }

        $this->command->info("✓ Created {$count} performance submissions");
    }

    private function createPayrollRuns(array $periods): void
    {
        $this->command->info('Creating sample payroll runs...');

        $admin = User::first();
        $approver = User::skip(1)->first() ?? $admin;

        // Ensure approval workflow exists
        $workflow = ApprovalWorkflow::firstOrCreate(
            ['code' => 'payroll_run_approval'],
            [
                'name' => 'Payroll Run Approval',
                'description' => 'Standard approval workflow for payroll runs',
                'entity_type' => PayrollRun::class,
                'is_active' => true,
            ]
        );

        // Create runs for closed periods
        $closedPeriods = collect($periods)->where('status', 'closed')->take(3);
        $runCount = 0;

        foreach ($closedPeriods as $index => $period) {
            // Create different scope types for variety
            $scopeTypes = ['all', 'branch', 'department'];
            $scopeType = $scopeTypes[$index % count($scopeTypes)];
            
            $scopeRefId = null;
            if ($scopeType === 'branch') {
                $scopeRefId = Branch::first()->id ?? null;
            } elseif ($scopeType === 'department') {
                $scopeRefId = Department::first()->id ?? null;
            }

            // Create payroll run
            $run = PayrollRun::create([
                'period_id' => $period->id,
                'scope_type' => $scopeType,
                'scope_ref_id' => $scopeRefId,
                'status' => $index === 0 ? 'draft' : ($index === 1 ? 'submitted' : 'approved'),
                'prepared_by_user_id' => $admin->id,
                'approver_user_id' => $approver->id,
                'note' => "Payroll run for {$period->name} - {$scopeType} scope",
                'submitted_at' => $index >= 1 ? Carbon::parse($period->end_date)->addDays(2) : null,
                'approved_at' => $index === 2 ? Carbon::parse($period->end_date)->addDays(5) : null,
                'total_gross' => 0,
                'total_deductions' => 0,
                'total_net' => 0,
            ]);

            // Create payroll run employees
            $this->createPayrollRunEmployees($run, $period);

            // Create approval request for submitted/approved runs
            if ($index >= 1) {
                ApprovalRequest::create([
                    'request_number' => 'PR-' . str_pad($run->id, 6, '0', STR_PAD_LEFT),
                    'workflow_id' => $workflow->id,
                    'requestable_type' => PayrollRun::class,
                    'requestable_id' => $run->id,
                    'requester_id' => $admin->id,
                    'current_approver_id' => $approver->id,
                    'status' => $index === 2 ? 'approved' : 'pending',
                    'current_step' => 1,
                    'requester_comment' => "Please review payroll run for {$period->name}",
                    'submitted_at' => $run->submitted_at,
                    'completed_at' => $run->approved_at,
                ]);
            }

            $runCount++;
        }

        $this->command->info("✓ Created {$runCount} payroll runs with employee data");
    }

    private function createPayrollRunEmployees(PayrollRun $run, PayrollPeriod $period): void
    {
        $employees = Employee::where('status', 'active')
            ->with(['salary', 'attendanceRecords', 'performanceSubmissions'])
            ->get();

        $totalGross = 0;
        $totalDeductions = 0;
        $totalNet = 0;

        foreach ($employees as $employee) {
            if (!$employee->salary) continue;

            // Get attendance data for period
            $attendanceRecords = AttendanceRecord::where('employee_id', $employee->id)
                ->whereBetween('attendance_date', [$period->start_date, $period->end_date])
                ->get();

            $absentDays = $attendanceRecords->where('status', 'absent')->count();
            $lateMinutes = $attendanceRecords->sum('late_minutes');
            $overtimeHours = $attendanceRecords->sum('overtime_minutes') / 60;

            // Get performance score
            $periodString = sprintf('%04d-%02d', $period->year, $period->month);
            $performance = PerformanceSubmission::where('employee_id', $employee->id)
                ->where('period', $periodString)
                ->first();
            $performanceScore = $performance->score ?? 75;

            // Calculate earnings and deductions
            $baseSalary = $employee->salary->base_salary;
            $grossPay = $baseSalary;
            
            // Simple earnings calculation
            $earnings = [
                ['code' => 'BASE_SALARY', 'amount' => $baseSalary],
                ['code' => 'HOUSING', 'amount' => $baseSalary * 0.20],
                ['code' => 'TRANSPORT', 'amount' => 500],
            ];

            if ($overtimeHours > 0) {
                $earnings[] = ['code' => 'OVERTIME', 'amount' => $overtimeHours * 50];
            }

            if ($performanceScore >= 80) {
                $earnings[] = ['code' => 'PERFORMANCE_BONUS', 'amount' => $baseSalary * 0.10];
            }

            $earningsTotal = collect($earnings)->sum('amount');
            $grossPay = $earningsTotal;

            // Simple deductions calculation
            $deductions = [
                ['code' => 'TAX', 'amount' => $grossPay * 0.10],
                ['code' => 'PENSION', 'amount' => $baseSalary * 0.08],
            ];

            if ($absentDays > 0) {
                $deductions[] = ['code' => 'ABSENT_DEDUCTION', 'amount' => ($baseSalary / $period->working_days) * $absentDays];
            }

            if ($lateMinutes > 60) {
                $deductions[] = ['code' => 'LATE_PENALTY', 'amount' => 50];
            }

            if ($performanceScore < 60) {
                $deductions[] = ['code' => 'PERFORMANCE_PENALTY', 'amount' => $baseSalary * 0.05];
            }

            $deductionsTotal = collect($deductions)->sum('amount');
            $netPay = $grossPay - $deductionsTotal;

            PayrollRunEmployee::create([
                'payroll_run_id' => $run->id,
                'employee_id' => $employee->id,
                'base_salary_snapshot' => $baseSalary,
                'absent_days' => $absentDays,
                'late_minutes' => $lateMinutes,
                'overtime_hours' => $overtimeHours,
                'performance_score' => $performanceScore,
                'earnings_json' => $earnings,
                'deductions_json' => $deductions,
                'gross_pay' => $grossPay,
                'total_deductions' => $deductionsTotal,
                'net_pay' => $netPay,
                'calc_version' => 1,
            ]);

            $totalGross += $grossPay;
            $totalDeductions += $deductionsTotal;
            $totalNet += $netPay;
        }

        // Update run totals
        $run->update([
            'total_gross' => $totalGross,
            'total_deductions' => $totalDeductions,
            'total_net' => $totalNet,
        ]);
    }
}
