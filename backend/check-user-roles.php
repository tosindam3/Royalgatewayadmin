<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🔍 Checking user roles...\n\n";

$user = App\Models\User::where('email', 'tosinfanimo3@gmail.com')->first();

if (!$user) {
    echo "❌ User not found\n";
    exit(1);
}

echo "User: {$user->name}\n";
echo "Email: {$user->email}\n";
echo "User ID: {$user->id}\n\n";

echo "Roles:\n";
if ($user->roles->isEmpty()) {
    echo "  ❌ No roles assigned\n";
} else {
    foreach ($user->roles as $role) {
        echo "  ✅ {$role->name} ({$role->display_name})\n";
    }
}

echo "\nEmployee Profile:\n";
if ($user->employeeProfile) {
    echo "  ✅ Has employee profile (ID: {$user->employeeProfile->id})\n";
    echo "  Employee Code: {$user->employeeProfile->employee_code}\n";
    echo "  Department: " . ($user->employeeProfile->department->name ?? 'N/A') . "\n";
    echo "  Branch: " . ($user->employeeProfile->branch->name ?? 'N/A') . "\n";
} else {
    echo "  ❌ No employee profile\n";
}

echo "\n";
