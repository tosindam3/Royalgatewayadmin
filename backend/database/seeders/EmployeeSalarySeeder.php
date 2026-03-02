<?php

namespace Database\Seeders;

use App\Models\Employee;
use Illuminate\Database\Seeder;

class EmployeeSalarySeeder extends Seeder
{
    public function run(): void
    {
        $employees = Employee::all();
        
        if ($employees->isEmpty()) {
            $this->command->warn('No employees found. Please seed employees first.');
            return;
        }
        
        $salaryRanges = [
            'junior' => [50000, 80000],
            'mid' => [80000, 120000],
            'senior' => [120000, 200000],
        ];
        
        $updated = 0;
        
        foreach ($employees as $employee) {
            // Randomly assign salary tier
            $tier = ['junior', 'mid', 'senior'][rand(0, 2)];
            $range = $salaryRanges[$tier];
            
            $baseSalary = rand($range[0], $range[1]);
            
            $employee->update([
                'base_salary' => $baseSalary,
                'bank_account_number' => '00' . rand(10000000, 99999999),
                'bank_name' => ['First Bank', 'GTBank', 'Access Bank', 'Zenith Bank'][rand(0, 3)],
                'tax_id' => 'TIN-' . rand(100000, 999999),
            ]);
            
            $updated++;
        }
        
        $this->command->info("Updated {$updated} employees with salary information");
    }
}
