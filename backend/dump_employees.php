<?php
use App\Models\Employee;
use App\Models\User;

foreach (Employee::with('user')->get() as $e) {
    echo "ID: {$e->id}, Name: {$e->full_name}, UserID: {$e->user_id}, User: " . ($e->user->name ?? 'N/A') . "\n";
}
