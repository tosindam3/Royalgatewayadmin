<?php
require '/home/u237094395/apps/royalgatewayadmin/backend/vendor/autoload.php';
$app = require '/home/u237094395/apps/royalgatewayadmin/backend/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$emails = ['admin@hr360.com', 'tosindam3@gmail.com'];

foreach ($emails as $email) {
    $user = \App\Models\User::where('email', $email)->with(['roles', 'primaryRole'])->first();
    if (!$user) { echo "$email: NOT FOUND\n"; continue; }

    echo "=== $email ===\n";
    echo "primary_role_id: {$user->primary_role_id}\n";
    echo "primaryRole: " . ($user->primaryRole ? $user->primaryRole->name : 'NULL') . "\n";
    echo "roles: " . $user->roles->pluck('name')->join(', ') . "\n";
    echo "all_roles: " . $user->all_roles->pluck('name')->join(', ') . "\n";
    echo "hasPermission(dashboard.management): " . ($user->hasPermission('dashboard.management') ? 'YES' : 'NO') . "\n\n";
}
