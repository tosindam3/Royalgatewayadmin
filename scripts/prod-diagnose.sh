#!/bin/bash
cd /home/u237094395/apps/royalgatewayadmin/backend

echo "=== Users and their roles ==="
php artisan tinker --execute="
\$users = \App\Models\User::with('roles')->get();
foreach(\$users as \$u) {
    \$roles = \$u->roles->pluck('name')->join(', ');
    echo \$u->email . ' => [' . \$roles . ']' . PHP_EOL;
}
"

echo ""
echo "=== Permissions on 'employee' role ==="
php artisan tinker --execute="
\$role = \App\Models\Role::where('name','employee')->with('permissions')->first();
if(\$role) {
    foreach(\$role->permissions as \$p) {
        echo \$p->name . PHP_EOL;
    }
} else {
    echo 'employee role not found' . PHP_EOL;
}
"

echo ""
echo "=== Check dashboard.view and chat.view exist ==="
php artisan tinker --execute="
echo 'dashboard.view: ' . \App\Models\Permission::where('name','dashboard.view')->count() . PHP_EOL;
echo 'dashboard.management: ' . \App\Models\Permission::where('name','dashboard.management')->count() . PHP_EOL;
echo 'chat.view: ' . \App\Models\Permission::where('name','chat.view')->count() . PHP_EOL;
"

echo ""
echo "=== Migration status (last 10) ==="
php artisan migrate:status | tail -15
