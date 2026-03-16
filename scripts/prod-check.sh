#!/bin/bash
cd /home/u237094395/apps/royalgatewayadmin/backend

echo "=== DB Check ==="
php artisan tinker --execute="echo 'Roles: ' . \App\Models\Role::count(); echo PHP_EOL; echo 'Permissions: ' . \App\Models\Permission::count(); echo PHP_EOL; echo 'Users: ' . \App\Models\User::count(); echo PHP_EOL; echo 'Employees: ' . \App\Models\Employee::count(); echo PHP_EOL;"
