<?php

use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$email = 'admin@hr360.com';
echo "--- Diagnostic for $email ---\n";

$user = User::where('email', $email)->first();

if (!$user) {
    echo "ERROR: User $email not found.\n";
    exit(1);
}

echo "User ID: " . $user->id . "\n";
echo "Name: " . $user->name . "\n";
echo "Primary Role ID: " . ($user->primary_role_id ?? 'NULL') . "\n";
echo "Primary Role Name: " . ($user->primaryRole?->name ?? 'NONE') . "\n";

$roles = $user->roles()->pluck('name')->toArray();
echo "Additional Roles: " . (empty($roles) ? 'NONE' : implode(', ', $roles)) . "\n";

$isManagement = $user->hasPermission('dashboard.management');
echo "Has 'dashboard.management' permission: " . ($isManagement ? 'YES' : 'NO') . "\n";

if (!$isManagement) {
    echo "\nATTEMPTING FIX...\n";
    
    $superAdminRole = Role::where('name', 'super_admin')->first();
    if (!$superAdminRole) {
        echo "ERROR: 'super_admin' role not found in database.\n";
        exit(1);
    }
    
    echo "Found 'super_admin' role (ID: {$superAdminRole->id}).\n";
    
    // Set as primary role
    $user->primary_role_id = $superAdminRole->id;
    $user->save();
    echo "Updated primary_role_id to {$superAdminRole->id}.\n";
    
    // Also ensure it's in the roles relationship
    $user->roles()->syncWithoutDetaching([$superAdminRole->id]);
    echo "Synced 'super_admin' role.\n";
    
    // Re-verify
    $user->load('primaryRole', 'roles');
    $isManagementNow = $user->hasPermission('dashboard.management');
    echo "RE-VERIFY: Has 'dashboard.management' permission: " . ($isManagementNow ? 'YES' : 'NO') . "\n";
} else {
    echo "\nUser already has management permissions. No fix needed.\n";
}

echo "--- Diagnostic Complete ---\n";
