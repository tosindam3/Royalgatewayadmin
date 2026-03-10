<?php

namespace App\Services;

use App\Models\AttendanceRecord;
use App\Models\Employee;
use App\Models\PayrollPeriod;
use App\Models\PayrollRun;
use App\Models\PayrollRunEmployee;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * PayrollRunBuilder - Creates and recalculates payroll runs
 * 
 * Orchestrates the process of:
 * 1. Determining employees by scope
 * 2. Fetching attendance summaries
 * 3. Fetching performance scores
 * 4. Calculating payroll for each employee
 * 5. Storing results in bulk
 */
class PayrollRunBuilder
{
    public function __construct(
        private PayrollCalculator $calculator,
        private PayrollRunGuard $guard
    ) {}

    /**
     * Create a new payroll run
     * 
     * @param array $data [
     *   'period_id' => int,
     *   'scope_type' => string,
     *   'scope_ref_id' => int|null,
     *   'approver_user_id' => int,
     *   'note' => string|null
     * ]
     * @param User $preparer
     * @return PayrollRun
     */
    public function create(array $data, User $preparer): PayrollRun
    {
        return DB::transaction(function () use ($data, $preparer) {
            // Create the payroll run
            $run = PayrollRun::create([
                'period_id' => $data['period_id'],
                'scope_type' => $data['scope_type'] ?? 'all',
                'scope_ref_id' => $data['scope_ref_id'] ?? null,
                'status' => 'draft',
                'prepared_by_user_id' => $preparer->id,
                'approver_user_id' => $data['approver_user_id'],
                'note' => $data['note'] ?? null,
                'total_gross' => 0,
                'total_deductions' => 0,
                'total_net' => 0,
            ]);

            // Generate employee rows
            $this->generateEmployeeRows($run);

            return $run->fresh(['period', 'preparedBy', 'approver']);
        });
    }

    /**
     * Recalculate an existing payroll run
     * 
     * @param PayrollRun $run
     * @return PayrollRun
     */
    public function recalculate(PayrollRun $run): PayrollRun
    {
        $this->guard->assertRecalculatable($run);

        return DB::transaction(function () use ($run) {
            // Delete existing employee rows
            $run->employees()->delete();

            // Regenerate employee rows
            $this->generateEmployeeRows($run);

            return $run->fresh(['period', 'preparedBy', 'approver']);
        });
    }

    /**
     * Generate employee rows for a payroll run
     * 
     * @param PayrollRun $run
     * @return void
     */
    private function generateEmployeeRows(PayrollRun $run): void
    {
        $period = $run->period;
        $employees = $this->getEmployeesByScope($run->scope_type, $run->scope_ref_id);

        if ($employees->isEmpty()) {
            Log::warning("No employees found for payroll run", [
                'run_id' => $run->id,
                'scope_type' => $run->scope_type,
                'scope_ref_id' => $run->scope_ref_id,
            ]);
            return;
        }

        $employeeIds = $employees->pluck('id')->toArray();

        // Fetch attendance summaries for the period
        $attendanceSummaries = $this->getAttendanceSummaries($period, $employeeIds);

        // Fetch performance scores for the period
        $performanceScores = $this->getPerformanceScores($period->id, $employeeIds);

        // Calculate payroll for each employee
        $employeeRows = [];
        $totalGross = 0;
        $totalDeductions = 0;
        $totalNet = 0;

        foreach ($employees as $employee) {
            $attendance = $attendanceSummaries[$employee->id] ?? [
                'absent_days' => 0,
                'late_minutes' => 0,
                'overtime_hours' => 0,
            ];

            $performanceScore = $performanceScores[$employee->id] ?? 0;

            $baseSalary = $employee->salary?->base_salary ?? 0;

            // Calculate payroll
            $calculation = $this->calculator->calculate([
                'base_salary' => $baseSalary,
                'absent_days' => $attendance['absent_days'],
                'late_minutes' => $attendance['late_minutes'],
                'overtime_hours' => $attendance['overtime_hours'],
                'performance_score' => $performanceScore,
                'working_days' => $period->working_days,
            ]);

            $employeeRows[] = [
                'payroll_run_id' => $run->id,
                'employee_id' => $employee->id,
                'base_salary_snapshot' => $baseSalary,
                'absent_days' => $attendance['absent_days'],
                'late_minutes' => $attendance['late_minutes'],
                'overtime_hours' => $attendance['overtime_hours'],
                'performance_score' => $performanceScore,
                'earnings_json' => json_encode($calculation['earnings']),
                'deductions_json' => json_encode($calculation['deductions']),
                'gross_pay' => $calculation['gross'],
                'total_deductions' => $calculation['total_deductions'],
                'net_pay' => $calculation['net'],
                'calc_version' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ];

            $totalGross += $calculation['gross'];
            $totalDeductions += $calculation['total_deductions'];
            $totalNet += $calculation['net'];
        }

        // Insert employee rows in chunks
        foreach (array_chunk($employeeRows, 200) as $chunk) {
            PayrollRunEmployee::insert($chunk);
        }

        // Update run totals
        $run->update([
            'total_gross' => round($totalGross, 2),
            'total_deductions' => round($totalDeductions, 2),
            'total_net' => round($totalNet, 2),
        ]);

        Log::info("Generated payroll run employee rows", [
            'run_id' => $run->id,
            'employee_count' => count($employeeRows),
            'total_gross' => $totalGross,
            'total_net' => $totalNet,
        ]);
    }

    /**
     * Get employees by scope
     * 
     * @param string $scopeType
     * @param int|null $scopeRefId
     * @return \Illuminate\Database\Eloquent\Collection
     */
    private function getEmployeesByScope(string $scopeType, ?int $scopeRefId)
    {
        $query = Employee::where('status', 'active')
            ->with(['user:id,name', 'department:id,name', 'branch:id,name', 'salary.salaryStructure']);

        switch ($scopeType) {
            case 'department':
                if ($scopeRefId) {
                    $query->where('department_id', $scopeRefId);
                }
                break;
            case 'branch':
                if ($scopeRefId) {
                    $query->where('branch_id', $scopeRefId);
                }
                break;
            case 'custom':
                break;
            case 'all':
            default:
                break;
        }

        // Filter out employees with no active salary mapping (they cannot be processed)
        return $query->get()->filter(fn ($e) => $e->salary !== null);
    }

    /**
     * Get attendance summaries for employees in a period
     * 
     * @param PayrollPeriod $period
     * @param array $employeeIds
     * @return array [employee_id => ['absent_days' => int, 'late_minutes' => int, 'overtime_hours' => float]]
     */
    private function getAttendanceSummaries(PayrollPeriod $period, array $employeeIds): array
    {
        $records = AttendanceRecord::whereBetween('attendance_date', [
                $period->start_date,
                $period->end_date
            ])
            ->whereIn('employee_id', $employeeIds)
            ->get();

        $summaries = [];

        foreach ($employeeIds as $employeeId) {
            $employeeRecords = $records->where('employee_id', $employeeId);

            $summaries[$employeeId] = [
                'absent_days' => $employeeRecords->where('status', 'absent')->count(),
                'late_minutes' => $employeeRecords->sum('late_minutes'),
                'overtime_hours' => round($employeeRecords->sum('overtime_minutes') / 60, 2),
            ];
        }

        return $summaries;
    }

    /**
     * Get performance scores for employees in a period
     * 
     * @param int $periodId
     * @param array $employeeIds
     * @return array [employee_id => score]
     */
    private function getPerformanceScores(int $periodId, array $employeeIds): array
    {
        // PerformanceMonthlyScore model does not exist in this version.
        // Returning empty array so payroll processes with score = 0 (no bonus / no penalty).
        // Future: query performance submissions when the performance module integrates with payroll.
        return [];
    }
}
