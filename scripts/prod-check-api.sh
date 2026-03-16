#!/bin/bash
cd /home/u237094395/apps/royalgatewayadmin/backend

echo "=== Check admin@hr360.com all_roles output ==="
php artisan tinker --execute="
\$user = \App\Models\User::where('email','admin@hr360.com')->first();
echo 'primary_role_id: ' . \$user->primary_role_id . PHP_EOL;
echo 'primaryRole name: ' . (\$user->primaryRole ? \$user->primaryRole->name : 'NULL') . PHP_EOL;
echo 'roles count: ' . \$user->roles->count() . PHP_EOL;
foreach(\$user->roles as \$r) {
    echo '  role: ' . \$r->name . PHP_EOL;
}
echo 'all_roles:' . PHP_EOL;
foreach(\$user->all_roles as \$r) {
    echo '  ' . \$r->name . PHP_EOL;
}
echo 'hasPermission dashboard.management: ' . (\$user->hasPermission('dashboard.management') ? 'YES' : 'NO') . PHP_EOL;
"

echo ""
echo "=== Check tosindam3@gmail.com ==="
php artisan tinker --execute="
\$user = \App\Models\User::where('email','tosindam3@gmail.com')->first();
echo 'primary_role_id: ' . \$user->primary_role_id . PHP_EOL;
echo 'primaryRole name: ' . (\$user->primaryRole ? \$user->primaryRole->name : 'NULL') . PHP_EOL;
foreach(\$user->all_roles as \$r) {
    echo 'all_role: ' . \$r->name . PHP_EOL;
}
echo 'hasPermission dashboard.management: ' . (\$user->hasPermission('dashboard.management') ? 'YES' : 'NO') . PHP_EOL;
"
