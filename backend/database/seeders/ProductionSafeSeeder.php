<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProductionSafeSeeder extends Seeder
{
    /**
     * Run the production-safe database seeders.
     * Only seeds reference/config data — never sample employee data.
     */
    public function run(): void
    {
        if (app()->environment('production')) {
            $this->command->warn('ProductionSafeSeeder running in PRODUCTION — only config/reference data will be seeded.');
        }

        Log::info('Starting ProductionSafeSeeder');

        // Roles & Permissions — must run first so all other data is permission-aware
        $this->runSeeder('RolePermissionSeeder', 'Roles and permissions (idempotent)');

        // Performance Template Seeder
        $this->runSeeder('PerformanceConfigSeeder', 'Performance templates and configurations');

        // Payroll workflow config (not sample data)
        $this->runSeeder('PayrollWorkflowSeeder', 'Payroll approval workflows');

        // NOTE: EmployeeSeeder, ComprehensivePayrollSeeder, and any other sample-data
        // seeders are intentionally excluded here. Never seed sample employees in production.

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
