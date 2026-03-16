#!/bin/bash
cd /home/u237094395/apps/royalgatewayadmin/backend

echo "=== Check admin@hr360.com role details ==="
php artisan tinker --execute="
\$user = \App\Models\User::where('email','admin@hr360.com')->with('roles.permissions')->first();
if(\$user) {
    foreach(\$user->roles as \$r) {
        echo 'Role: ' . \$r->name . ' (display: ' . \$r->display_name . ')' . PHP_EOL;
        echo 'Has dashboard.management: ' . (\$user->hasPermission('dashboard.management') ? 'YES' : 'NO') . PHP_EOL;
        echo 'Has chat.view: ' . (\$user->hasPermission('chat.view') ? 'YES' : 'NO') . PHP_EOL;
        echo 'Has dashboard.view: ' . (\$user->hasPermission('dashboard.view') ? 'YES' : 'NO') . PHP_EOL;
    }
}
"

echo ""
echo "=== All roles in DB ==="
php artisan tinker --execute="
\App\Models\Role::all()->each(function(\$r) {
    echo \$r->id . ': ' . \$r->name . ' (' . \$r->display_name . ') perms: ' . \$r->permissions->count() . PHP_EOL;
});
"
