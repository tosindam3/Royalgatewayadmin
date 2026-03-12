<?php

require __DIR__.'/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$columns = Schema::getColumnListing('employees');

echo "Employee table columns:\n";
echo implode(", ", $columns) . "\n\n";

$columns = Schema::getColumnListing('attendance_records');
echo "Attendance Records table columns:\n";
echo implode(", ", $columns) . "\n\n";

$columns = Schema::getColumnListing('attendance_logs');
echo "Attendance Logs table columns:\n";
echo implode(", ", $columns) . "\n";
