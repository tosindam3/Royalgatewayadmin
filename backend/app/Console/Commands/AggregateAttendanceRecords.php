<?php

namespace App\Console\Commands;

use App\Services\AttendanceRecordAggregator;
use Illuminate\Console\Command;

class AggregateAttendanceRecords extends Command
{
    protected $signature = 'attendance:aggregate 
                            {--date= : Specific date to aggregate (YYYY-MM-DD)}
                            {--month= : Specific month to aggregate (YYYY-MM)}
                            {--from= : Start date for range (YYYY-MM-DD)}
                            {--to= : End date for range (YYYY-MM-DD)}
                            {--today : Aggregate today only}';

    protected $description = 'Aggregate attendance logs into daily records';

    public function handle(AttendanceRecordAggregator $aggregator): int
    {
        $this->info('Starting attendance aggregation...');

        if ($this->option('today')) {
            $date = now()->toDateString();
            $this->info("Aggregating for today: {$date}");
            $aggregator->aggregateForDate($date);
            $this->info('✓ Today aggregated successfully');
            return Command::SUCCESS;
        }

        if ($date = $this->option('date')) {
            $this->info("Aggregating for date: {$date}");
            $aggregator->aggregateForDate($date);
            $this->info('✓ Date aggregated successfully');
            return Command::SUCCESS;
        }

        if ($month = $this->option('month')) {
            $this->info("Aggregating for month: {$month}");
            $aggregator->aggregateMonth($month);
            $this->info('✓ Month aggregated successfully');
            return Command::SUCCESS;
        }

        if ($from = $this->option('from')) {
            $to = $this->option('to') ?? now()->toDateString();
            $this->info("Aggregating from {$from} to {$to}");
            $aggregator->aggregateDateRange($from, $to);
            $this->info('✓ Date range aggregated successfully');
            return Command::SUCCESS;
        }

        // Default: aggregate current month
        $month = now()->format('Y-m');
        $this->info("No options provided. Aggregating current month: {$month}");
        $aggregator->aggregateMonth($month);
        $this->info('✓ Current month aggregated successfully');

        return Command::SUCCESS;
    }
}
