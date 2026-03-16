#!/bin/bash
cd /home/u237094395/apps/royalgatewayadmin/backend

echo "=== Verifying admin@hr360.com role fix ==="
php artisan tinker --execute="
\$user = \App\Models\User::where('email','admin@hr360.com')->with('roles','primaryRole')->first();
if(\$user) {
  echo 'User: ' . \$user->email . PHP_EOL;
  echo 'Primary Role: ' . (\$user->primaryRole->name ?? 'NULL') . PHP_EOL;
  echo 'Primary Role Display: ' . (\$user->primaryRole->display_name ?? 'NULL') . PHP_EOL;
  echo 'Has dashboard.management: ' . (\$user->hasPermission('dashboard.management') ? 'YES ✓' : 'NO ✗') . PHP_EOL;
  echo 'Has chat.view: ' . (\$user->hasPermission('chat.view') ? 'YES ✓' : 'NO ✗') . PHP_EOL;
  echo 'All roles: ' . \$user->all_roles->pluck('name')->join(', ') . PHP_EOL;
} else {
  echo 'User not found!' . PHP_EOL;
}
"
