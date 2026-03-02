<?php

namespace Database\Seeders;

use App\Models\PayrollPeriod;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class PayrollPeriodsSeeder extends Seeder
{
    public function run(): void
    {
        $periods = [];
        
        // Create last 6 months of periods
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i)->startOfMonth();
            $year = $date->year;
            $month = $date->month;
            
            $startDate = $date->copy()->startOfMonth();
            $endDate = $date->copy()->endOfMonth();
            
            // Calculate working days (weekdays only)
            $workingDays = 0;
            $current = $startDate->copy();
            while ($current->lte($endDate)) {
                if ($current->isWeekday()) {
                    $workingDays++;
                }
                $current->addDay();
            }
            
            // Current month is open, past months are closed
            $status = ($i === 0) ? 'open' : 'closed';
            
            $periods[] = [
                'year' => $year,
                'month' => $month,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'working_days' => $workingDays,
                'status' => $status,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        
        PayrollPeriod::insert($periods);
        
        $this->command->info('Created ' . count($periods) . ' payroll periods');
    }
}
