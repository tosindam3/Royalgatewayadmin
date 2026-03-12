<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProductionSafeSeeder extends Seeder
{
    /**
     * Run the production-safe database seeders.
     * This seeder only runs seeders that are safe for production environments.
     */
    public function run(): void
    {
        Log::info('Starting ProductionSafeSeeder');

        // Performance Template Seeder
        $this->runSeeder('PerformanceConfigSeeder', 'Performance templates and configurations');
        
        // Employee Seeders
        $this->runSeeder('EmployeeSeeder', 'Employee data');
        $this->runSeeder('EmployeeSalarySeeder', 'Employee salary structures');
        
        // Payroll Seeders
        $this->runSeeder('PayrollItemsSeeder', 'Payroll items (allowances, deductions)');
        $this->runSeeder('PayrollPeriodsSeeder', 'Payroll periods');
        $this->runSeeder('PayrollDataSeeder', 'Payroll data');
        $this->runSeeder('PayrollWorkflowSeeder', 'Payroll approval workflows');
        $this->runSeeder('PayrollVerificationSeeder', 'Payroll verification data');

        Log::info('ProductionSafeSeeder completed successfully');
    }

    /**
     * Run a specific seeder with error handling and logging
     */
    private function runSeeder(string $seederClass, string $description): void
    {
        try {
            $this->command->info("Seeding: {$description} ({$seederClass})");
            
            // Check if seeder class exists
            $fullClass = "Database\\Seeders\\{$seederClass}";
            if (!class_exists($fullClass)) {
                $this->command->warn("Seeder {$seederClass} not found, skipping...");
                Log::warning("Seeder {$seederClass} not found");
                return;
            }

            // Run the seeder
            $this->call($fullClass);
            
            $this->command->info("✓ {$description} seeded successfully");
            Log::info("{$seederClass} completed successfully");
            
        } catch (\Exception $e) {
            $this->command->error("✗ Failed to seed {$description}: {$e->getMessage()}");
            Log::error("Failed to run {$seederClass}: {$e->getMessage()}", [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            
            // Don't throw exception, continue with other seeders
            $this->command->warn("Continuing with remaining seeders...");
        }
    }
}
