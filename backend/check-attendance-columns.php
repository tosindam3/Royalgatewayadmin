<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Attendance Records Table Columns ===\n\n";

$columns = DB::select('SHOW COLUMNS FROM attendance_records');

foreach ($columns as $col) {
    echo "- {$col->Field} ({$col->Type})\n";
}
