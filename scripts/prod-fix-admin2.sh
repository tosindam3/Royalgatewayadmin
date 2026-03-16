#!/bin/bash
cd /home/u237094395/apps/royalgatewayadmin/backend

echo "=== Fix admin@hr360.com role assignment ==="
php artisan tinker --execute="
\$superAdmin = \App\Models\Role::where('name','super_admin')->first();
\$admin = \App\Models\User::where('email','admin@hr360.com')->first();

if(\$admin && \$superAdmin) {
    // Remove old roles first
    \$admin->roles()->detach();
    // Attach with required assigned_at field
    \$admin->roles()->attach(\$superAdmin->id, ['assigned_at' => now(), 'assigned_by' => \$admin->id]);
    \$admin->primary_role_id = \$superAdmin->id;
    \$admin->save();
    echo 'Fixed admin@hr360.com -> super_admin' . PHP_EOL;
} else {
    echo 'User or role not found' . PHP_EOL;
}
"

echo ""
echo "=== Verify admin@hr360.com ==="
php artisan tinker --execute="
\$u = \App\Models\User::where('email','admin@hr360.com')->with('roles')->first();
echo 'role: ' . \$u->roles->pluck('name')->join(', ') . PHP_EOL;
echo 'dashboard.management: ' . (\$u->hasPermission('dashboard.management') ? 'YES' : 'NO') . PHP_EOL;
echo 'dashboard.view: ' . (\$u->hasPermission('dashboard.view') ? 'YES' : 'NO') . PHP_EOL;
echo 'chat.view: ' . (\$u->hasPermission('chat.view') ? 'YES' : 'NO') . PHP_EOL;
"
