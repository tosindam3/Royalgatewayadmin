<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== SEARCHING FOR OLUWATOSIN ===\n\n";

// Search for Oluwatosin
$users = App\Models\User::where('name', 'like', '%oluwatosin%')
    ->orWhere('name', 'like', '%Oluwatosin%')
    ->orWhere('email', 'like', '%oluwatosin%')
    ->with(['employeeProfile.branch', 'roles'])
    ->get();

if ($users->count() > 0) {
    foreach ($users as $user) {
        echo "Found: {$user->name}\n";
        echo "- User ID: {$user->id}\n";
        echo "- Email: {$user->email}\n";
        
        if ($user->employeeProfile) {
            echo "- Employee ID: {$user->employeeProfile->id}\n";
            echo "- Branch: " . ($user->employeeProfile->branch ? $user->employeeProfile->branch->name : 'No Branch') . "\n";
            echo "- Branch ID: {$user->employeeProfile->branch_id}\n";
        } else {
            echo "- No employee profile\n";
        }
        
        echo "- Roles: " . $user->roles->pluck('name')->implode(', ') . "\n";
        echo "\n";
    }
} else {
    echo "No users found with 'Oluwatosin' in name or email\n\n";
    
    // List all users
    echo "=== ALL USERS ===\n";
    $allUsers = App\Models\User::with('employeeProfile')->get();
    foreach ($allUsers as $u) {
        echo "{$u->id} - {$u->name} ({$u->email})\n";
    }
}
