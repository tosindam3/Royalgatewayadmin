<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🔧 Assigning HR Admin role to lazarus lawal...\n\n";

$user = App\Models\User::where('email', 'tosinfanimo3@gmail.com')->first();

if (!$user) {
    echo "❌ User not found\n";
    exit(1);
}

// Find or create HR Manager role
$hrManagerRole = App\Models\Role::where('name', 'hr_manager')->first();

if (!$hrManagerRole) {
    echo "❌ HR Manager role not found. Please run RolePermissionSeeder first.\n";
    echo "Run: php artisan db:seed --class=RolePermissionSeeder\n";
    exit(1);
}

// Check if user already has the role
if ($user->hasRole('hr_manager')) {
    echo "ℹ️  User already has HR Manager role\n";
} else {
    // Assign the role
    $user->assignRole($hrManagerRole);
    echo "✅ Assigned HR Manager role to {$user->name}\n";
}

echo "\nCurrent roles:\n";
foreach ($user->fresh()->roles as $role) {
    echo "  • {$role->display_name} ({$role->name})\n";
}

echo "\n✅ Done! User can now access settings.\n";
