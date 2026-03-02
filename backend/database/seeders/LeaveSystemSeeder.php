<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class LeaveSystemSeeder extends Seeder
{
    /**
     * Run the leave system seeders in correct order
     */
    public function run(): void
    {
        $this->command->info('🌱 Starting Leave System Seeding...');
        $this->command->newLine();
        
        // 1. Seed leave types
        $this->command->info('📋 Seeding Leave Types...');
        $this->call(LeaveTypesSeeder::class);
        $this->command->newLine();
        
        // 2. Seed holidays
        $this->command->info('🎉 Seeding Holidays...');
        $this->call(HolidaysSeeder::class);
        $this->command->newLine();
        
        // 3. Initialize leave balances for all employees
        $this->command->info('💰 Initializing Leave Balances...');
        $this->call(LeaveBalancesSeeder::class);
        $this->command->newLine();
        
        // 4. Generate sample leave requests
        $this->command->info('📝 Generating Sample Leave Requests...');
        $this->call(LeaveRequestsSeeder::class);
        $this->command->newLine();
        
        $this->command->info('✅ Leave System Seeding Completed Successfully!');
    }
}
