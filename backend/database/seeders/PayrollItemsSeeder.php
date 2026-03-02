<?php

namespace Database\Seeders;

use App\Models\PayrollItem;
use Illuminate\Database\Seeder;

class PayrollItemsSeeder extends Seeder
{
    public function run(): void
    {
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
                'default_value' => 5.00,
                'active' => true,
                'description' => 'Performance-based bonus (score >= 80)',
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
                'name' => 'Housing Allowance',
                'code' => 'HOUSING',
                'type' => 'earning',
                'method' => 'fixed',
                'default_value' => 1000.00,
                'active' => true,
                'description' => 'Monthly housing allowance',
            ],
            
            // Deductions
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
                'default_value' => 3.00,
                'active' => true,
                'description' => 'Performance penalty (score < 60)',
            ],
            [
                'name' => 'Tax Withholding',
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
        ];
        
        foreach ($items as $item) {
            PayrollItem::create($item);
        }
        
        $this->command->info('Created ' . count($items) . ' payroll items');
    }
}
