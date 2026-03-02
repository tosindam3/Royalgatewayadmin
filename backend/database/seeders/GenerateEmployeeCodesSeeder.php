<?php

namespace Database\Seeders;

use App\Models\Employee;
use Illuminate\Database\Seeder;

class GenerateEmployeeCodesSeeder extends Seeder
{
    /**
     * Generate employee codes for existing employees that don't have one
     */
    public function run(): void
    {
        $this->command->info('🔍 Checking for employees without employee_code...');
        
        $employeesWithoutCode = Employee::whereNull('employee_code')
            ->orWhere('employee_code', '')
            ->get();
        
        if ($employeesWithoutCode->isEmpty()) {
            $this->command->info('✅ All employees already have employee codes');
            return;
        }
        
        $this->command->info("📝 Found {$employeesWithoutCode->count()} employees without codes");
        
        foreach ($employeesWithoutCode as $employee) {
            $year = $employee->created_at ? $employee->created_at->format('Y') : date('Y');
            
            // Get the last employee code for this year
            $lastEmployee = Employee::withTrashed()
                ->where('employee_code', 'like', "RG-{$year}-%")
                ->orderBy('employee_code', 'desc')
                ->first();
            
            if ($lastEmployee && preg_match('/RG-\d{4}-(\d{4})/', $lastEmployee->employee_code, $matches)) {
                $number = intval($matches[1]) + 1;
            } else {
                $number = Employee::where('employee_code', 'like', "RG-{$year}-%")->count() + 1;
            }
            
            $employeeCode = "RG-{$year}-" . str_pad($number, 4, '0', STR_PAD_LEFT);
            
            $employee->employee_code = $employeeCode;
            $employee->save();
            
            $userName = $employee->user->name ?? $employee->full_name;
            $this->command->info("✅ Generated code {$employeeCode} for {$userName}");
        }
        
        $this->command->info('🎉 Employee code generation complete!');
    }
}
