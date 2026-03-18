<?php

namespace Database\Seeders;

use App\Models\OrganizationSetting;
use Illuminate\Database\Seeder;

class PayrollPolicySeeder extends Seeder
{
    public function run(): void
    {
        $policy = [
            // Attendance Policies
            'attendance' => [
                'late_penalty_enabled' => true,
                'late_penalty_type' => 'hourly_rate', // flat_amount, hourly_rate
                'late_penalty_value' => 1, // 1 hour deduction
                'grace_period_minutes' => 15,
                'absent_penalty_type' => 'daily_pay', // flat_amount, daily_pay
                'absent_penalty_multiplier' => 1,
            ],
            // Performance Policies
            'performance' => [
                'bonus_enabled' => true,
                'bonus_threshold' => 80, // Score needed for bonus
                'bonus_percentage' => 5, // 5% of salary
                'penalty_enabled' => true,
                'penalty_threshold' => 40, // Score below which penalty applies
                'penalty_percentage' => 5, // 5% deduction
                'aggregate_target' => 70, // Standard target
            ],
            // Overtime Policies
            'overtime' => [
                'enabled' => true,
                'multiplier' => 1.5,
                'min_minutes' => 30,
                'auto_approve' => false,
            ]
        ];

        OrganizationSetting::updateOrCreate(
            ['key' => 'payroll_policy'],
            [
                'value' => $policy,
                'type' => 'array',
            ]
        );
    }
}
