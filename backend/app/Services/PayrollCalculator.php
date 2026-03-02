<?php

namespace App\Services;

/**
 * PayrollCalculator - Pure, deterministic payroll calculation logic
 * 
 * This service contains NO database queries or side effects.
 * All inputs must be provided explicitly for reproducibility.
 */
class PayrollCalculator
{
    // Configuration constants
    private const LATE_PENALTY_MULTIPLIER = 1.0;
    private const OVERTIME_MULTIPLIER = 1.5;
    private const PERFORMANCE_BONUS_THRESHOLD = 80;
    private const PERFORMANCE_PENALTY_THRESHOLD = 60;
    private const PERFORMANCE_BONUS_PERCENT = 0.05; // 5%
    private const PERFORMANCE_PENALTY_PERCENT = 0.03; // 3%
    private const WORKING_HOURS_PER_DAY = 8;

    /**
     * Calculate payroll for a single employee
     * 
     * @param array $input [
     *   'base_salary' => float,
     *   'absent_days' => int,
     *   'late_minutes' => int,
     *   'overtime_hours' => float,
     *   'performance_score' => int,
     *   'working_days' => int
     * ]
     * @return array [
     *   'gross' => float,
     *   'total_deductions' => float,
     *   'net' => float,
     *   'earnings' => array,
     *   'deductions' => array
     * ]
     */
    public function calculate(array $input): array
    {
        $baseSalary = (float) ($input['base_salary'] ?? 0);
        $absentDays = (int) ($input['absent_days'] ?? 0);
        $lateMinutes = (int) ($input['late_minutes'] ?? 0);
        $overtimeHours = (float) ($input['overtime_hours'] ?? 0);
        $performanceScore = (int) ($input['performance_score'] ?? 0);
        $workingDays = (int) ($input['working_days'] ?? 22);

        // Calculate rates
        $dailyRate = $workingDays > 0 ? $baseSalary / $workingDays : 0;
        $hourlyRate = $dailyRate / self::WORKING_HOURS_PER_DAY;

        // Calculate earnings
        $earnings = [];
        $earnings[] = [
            'code' => 'BASE_SALARY',
            'label' => 'Base Salary',
            'amount' => round($baseSalary, 2),
        ];

        // Overtime pay
        $overtimePay = 0;
        if ($overtimeHours > 0) {
            $overtimePay = $overtimeHours * $hourlyRate * self::OVERTIME_MULTIPLIER;
            $earnings[] = [
                'code' => 'OVERTIME',
                'label' => 'Overtime Pay',
                'amount' => round($overtimePay, 2),
            ];
        }

        // Performance bonus (score >= 80)
        $performanceBonus = 0;
        if ($performanceScore >= self::PERFORMANCE_BONUS_THRESHOLD) {
            $performanceBonus = $baseSalary * self::PERFORMANCE_BONUS_PERCENT;
            $earnings[] = [
                'code' => 'PERFORMANCE_BONUS',
                'label' => 'Performance Bonus',
                'amount' => round($performanceBonus, 2),
            ];
        }

        // Calculate deductions
        $deductions = [];

        // Absent days deduction
        $absentDeduction = 0;
        if ($absentDays > 0) {
            $absentDeduction = $absentDays * $dailyRate;
            $deductions[] = [
                'code' => 'ABSENT_DEDUCTION',
                'label' => 'Absent Days Deduction',
                'amount' => round($absentDeduction, 2),
            ];
        }

        // Late penalty
        $latePenalty = 0;
        if ($lateMinutes > 0) {
            $lateHours = $lateMinutes / 60;
            $latePenalty = $lateHours * $hourlyRate * self::LATE_PENALTY_MULTIPLIER;
            $deductions[] = [
                'code' => 'LATE_PENALTY',
                'label' => 'Late Penalty',
                'amount' => round($latePenalty, 2),
            ];
        }

        // Performance penalty (score < 60)
        $performancePenalty = 0;
        if ($performanceScore > 0 && $performanceScore < self::PERFORMANCE_PENALTY_THRESHOLD) {
            $performancePenalty = $baseSalary * self::PERFORMANCE_PENALTY_PERCENT;
            $deductions[] = [
                'code' => 'PERFORMANCE_PENALTY',
                'label' => 'Performance Penalty',
                'amount' => round($performancePenalty, 2),
            ];
        }

        // Calculate totals
        $grossPay = $baseSalary + $overtimePay + $performanceBonus;
        $totalDeductions = $absentDeduction + $latePenalty + $performancePenalty;
        $netPay = $grossPay - $totalDeductions;

        return [
            'gross' => round($grossPay, 2),
            'total_deductions' => round($totalDeductions, 2),
            'net' => round($netPay, 2),
            'earnings' => $earnings,
            'deductions' => $deductions,
        ];
    }

    /**
     * Get calculation metadata (for debugging/auditing)
     */
    public function getCalculationMetadata(): array
    {
        return [
            'version' => 1,
            'constants' => [
                'late_penalty_multiplier' => self::LATE_PENALTY_MULTIPLIER,
                'overtime_multiplier' => self::OVERTIME_MULTIPLIER,
                'performance_bonus_threshold' => self::PERFORMANCE_BONUS_THRESHOLD,
                'performance_penalty_threshold' => self::PERFORMANCE_PENALTY_THRESHOLD,
                'performance_bonus_percent' => self::PERFORMANCE_BONUS_PERCENT,
                'performance_penalty_percent' => self::PERFORMANCE_PENALTY_PERCENT,
                'working_hours_per_day' => self::WORKING_HOURS_PER_DAY,
            ],
        ];
    }
}
