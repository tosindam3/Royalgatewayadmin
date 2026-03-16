#!/bin/bash
cd /home/u237094395/apps/royalgatewayadmin/backend

echo "=== Reassigning users to correct roles ==="
php artisan tinker --execute="
// Get correct roles
\$superAdmin = \App\Models\Role::where('name','super_admin')->first();
\$employee   = \App\Models\Role::where('name','employee')->first();

// admin@hr360.com -> super_admin
\$admin = \App\Models\User::where('email','admin@hr360.com')->first();
if(\$admin && \$superAdmin) {
    \$admin->roles()->sync([\$superAdmin->id]);
    \$admin->primary_role_id = \$superAdmin->id;
    \$admin->save();
    echo 'admin@hr360.com -> super_admin' . PHP_EOL;
}

// tosindam3@gmail.com -> super_admin (already correct name but re-sync to be safe)
\$tosin = \App\Models\User::where('email','tosindam3@gmail.com')->first();
if(\$tosin && \$superAdmin) {
    \$tosin->roles()->sync([\$superAdmin->id]);
    \$tosin->primary_role_id = \$superAdmin->id;
    \$tosin->save();
    echo 'tosindam3@gmail.com -> super_admin' . PHP_EOL;
}

// test@example.com -> employee (already correct, re-sync)
\$test = \App\Models\User::where('email','test@example.com')->first();
if(\$test && \$employee) {
    \$test->roles()->sync([\$employee->id]);
    \$test->primary_role_id = \$employee->id;
    \$test->save();
    echo 'test@example.com -> employee' . PHP_EOL;
}
"

echo ""
echo "=== Verify permissions after reassignment ==="
php artisan tinker --execute="
\$users = \App\Models\User::with('roles')->get();
foreach(\$users as \$u) {
    echo \$u->email . ':' . PHP_EOL;
    echo '  role: ' . \$u->roles->pluck('name')->join(', ') . PHP_EOL;
    echo '  dashboard.management: ' . (\$u->hasPermission('dashboard.management') ? 'YES' : 'NO') . PHP_EOL;
    echo '  dashboard.view: ' . (\$u->hasPermission('dashboard.view') ? 'YES' : 'NO') . PHP_EOL;
    echo '  chat.view: ' . (\$u->hasPermission('chat.view') ? 'YES' : 'NO') . PHP_EOL;
}
"
