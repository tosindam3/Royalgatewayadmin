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
     *   'working_days' => int,
     *   'policy' => array // Global payroll policy from OrganizationSetting
     * ]
     * @return array
     */
    public function calculate(array $input): array
    {
        $baseSalary = (float) ($input['base_salary'] ?? 0);
        $absentDays = (int) ($input['absent_days'] ?? 0);
        $lateMinutes = (int) ($input['late_minutes'] ?? 0);
        $overtimeHours = (float) ($input['overtime_hours'] ?? 0);
        $performanceScore = (int) ($input['performance_score'] ?? 0);
        $workingDays = (int) ($input['working_days'] ?? 22);
        
        // Policy inputs
        $policy = $input['policy'] ?? [];
        $attPolicy = $policy['attendance'] ?? [];
        $perfPolicy = $policy['performance'] ?? [];
        $otPolicy = $policy['overtime'] ?? [];

        // Calculate rates
        $dailyRate = $workingDays > 0 ? $baseSalary / $workingDays : 0;
        $hourlyRate = $dailyRate / ($attPolicy['working_hours_per_day'] ?? 8);

        // Earnings
        $earnings = [];
        $earnings[] = [
            'code' => 'BASE_SALARY',
            'label' => 'Base Salary',
            'system_calculated' => round($baseSalary, 2),
            'amount' => round($baseSalary, 2),
        ];

        // Overtime Pay
        $overtimePay = 0;
        if ($overtimeHours > 0 && ($otPolicy['enabled'] ?? true)) {
            $multiplier = $otPolicy['multiplier'] ?? 1.5;
            $overtimePay = $overtimeHours * $hourlyRate * $multiplier;
            $earnings[] = [
                'code' => 'OVERTIME',
                'label' => 'Overtime Pay',
                'system_calculated' => round($overtimePay, 2),
                'amount' => round($overtimePay, 2),
            ];
        }

        // Performance Bonus
        $performanceBonus = 0;
        if (($perfPolicy['bonus_enabled'] ?? true) && $performanceScore >= ($perfPolicy['bonus_threshold'] ?? 80)) {
            $percent = ($perfPolicy['bonus_percentage'] ?? 5) / 100;
            $performanceBonus = $baseSalary * $percent;
            $earnings[] = [
                'code' => 'PERFORMANCE_BONUS',
                'label' => 'Performance Bonus',
                'system_calculated' => round($performanceBonus, 2),
                'amount' => round($performanceBonus, 2),
            ];
        }

        // Deductions
        $deductions = [];

        // Absent Days Deduction
        $absentDeduction = 0;
        if ($absentDays > 0) {
            $deductionType = $attPolicy['absent_penalty_type'] ?? 'daily_pay';
            if ($deductionType === 'daily_pay') {
                $multiplier = $attPolicy['absent_penalty_multiplier'] ?? 1;
                $absentDeduction = $absentDays * $dailyRate * $multiplier;
            } else {
                $absentDeduction = $absentDays * ($attPolicy['absent_penalty_flat_amount'] ?? 0);
            }

            $deductions[] = [
                'code' => 'ABSENT_DEDUCTION',
                'label' => 'Absent Days Deduction',
                'system_calculated' => round($absentDeduction, 2),
                'amount' => round($absentDeduction, 2),
            ];
        }

        // Late Penalty
        $latePenalty = 0;
        $gracePeriod = $attPolicy['grace_period_minutes'] ?? 15;
        if ($lateMinutes > $gracePeriod && ($attPolicy['late_penalty_enabled'] ?? true)) {
            $penaltyType = $attPolicy['late_penalty_type'] ?? 'hourly_rate';
            if ($penaltyType === 'hourly_rate') {
                $penaltyValue = $attPolicy['late_penalty_value'] ?? 1; // e.g. 1 hour
                $latePenalty = $penaltyValue * $hourlyRate;
            } else {
                $latePenalty = $attPolicy['late_penalty_flat_amount'] ?? 0;
            }

            $deductions[] = [
                'code' => 'LATE_PENALTY',
                'label' => 'Late Penalty',
                'system_calculated' => round($latePenalty, 2),
                'amount' => round($latePenalty, 2),
            ];
        }

        // Performance Deduction
        $performancePenalty = 0;
        if (($perfPolicy['penalty_enabled'] ?? true) && $performanceScore > 0 && $performanceScore < ($perfPolicy['penalty_threshold'] ?? 40)) {
            $percent = ($perfPolicy['penalty_percentage'] ?? 5) / 100;
            $performancePenalty = $baseSalary * $percent;
            $deductions[] = [
                'code' => 'PERFORMANCE_PENALTY',
                'label' => 'Performance Penalty',
                'system_calculated' => round($performancePenalty, 2),
                'amount' => round($performancePenalty, 2),
            ];
        }

        // Totals
        $grossPay = $baseSalary + $overtimePay + $performanceBonus;
        $totalDeductions = $absentDeduction + $latePenalty + $performancePenalty;
        $netPay = $grossPay - $totalDeductions;

        return [
            'gross' => round($grossPay, 2),
            'total_deductions' => round($totalDeductions, 2),
            'net' => round($netPay, 2),
            'earnings' => $earnings,
            'deductions' => $deductions,
            'policy_version' => $policy['version'] ?? 'default'
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
