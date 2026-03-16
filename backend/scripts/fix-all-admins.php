<?php

use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "--- Global Admin Fix Initialized ---\n";

$superAdminRole = Role::where('name', 'super_admin')->first();
if (!$superAdminRole) {
    echo "ERROR: 'super_admin' role not found.\n";
    exit(1);
}

// Find all possible admin accounts
$users = User::where('email', 'LIKE', '%admin%')
    ->orWhere('name', 'LIKE', '%Admin%')
    ->orWhere('primary_role_id', $superAdminRole->id)
    ->get();

echo "Found " . $users->count() . " potential admin accounts.\n";

foreach ($users as $user) {
    echo "Processing User ID: {$user->id} ({$user->email} / {$user->name})\n";
    
    // Assign role
    $user->primary_role_id = $superAdminRole->id;
    $user->save();
    
    $user->roles()->syncWithoutDetaching([$superAdminRole->id]);
    
    echo "  - Fixed Role: super_admin\n";
    echo "  - Current Management Permission: " . ($user->hasPermission('dashboard.management') ? 'YES' : 'NO') . "\n";
}

echo "--- Global Admin Fix Complete ---\n";
