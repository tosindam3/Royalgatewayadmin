<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Biometric Attendance Sync Scheduler
Schedule::command('attendance:sync --queue')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/biometric-sync.log'));

// Mark absent employees at end of day (11:59 PM)
Schedule::command('attendance:mark-absent')
    ->dailyAt('23:59')
    ->appendOutputTo(storage_path('logs/absent-marking.log'));

// Aggregate attendance records daily at 1 AM
Schedule::command('attendance:aggregate --today')
    ->dailyAt('01:00')
    ->appendOutputTo(storage_path('logs/aggregation.log'));
