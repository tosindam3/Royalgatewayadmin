<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Employee;
use App\Models\LeaveType;
use App\Services\LeaveService;

class LeaveBalancesSeeder extends Seeder
{
    public function run(): void
    {
        $leaveService = app(LeaveService::class);
        $currentYear = now()->year;
        
        // Get all active employees
        $employees = Employee::where('status', 'active')->get();
        
        $this->command->info("Initializing leave balances for {$employees->count()} employees...");
        
        $progressBar = $this->command->getOutput()->createProgressBar($employees->count());
        $progressBar->start();
        
        foreach ($employees as $employee) {
            $leaveService->initializeEmployeeBalances($employee, $currentYear);
            $progressBar->advance();
        }
        
        $progressBar->finish();
        $this->command->newLine();
        $this->command->info('Leave balances initialized successfully.');
    }
}
