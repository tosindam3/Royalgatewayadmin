#!/bin/bash
set -e

echo "🔧 Fixing admin role in production..."
echo ""

# SSH connection details
SSH_HOST="147.93.54.101"
SSH_PORT="65002"
SSH_USER="u237094395"
SSH_KEY="hostinger_key"
BACKEND_DIR="/home/u237094395/apps/royalgatewayadmin/backend"

# Upload the FixAdminRole command
echo "📤 Uploading FixAdminRole.php command..."
scp -i "$SSH_KEY" -P "$SSH_PORT" \
  backend/app/Console/Commands/FixAdminRole.php \
  "$SSH_USER@$SSH_HOST:$BACKEND_DIR/app/Console/Commands/"

echo ""
echo "🔄 Running role permission seeder..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" << 'ENDSSH'
cd /home/u237094395/apps/royalgatewayadmin/backend

# Seed roles and permissions
php artisan db:seed --class=RolePermissionSeeder --force

echo ""
echo "🔍 Checking current admin user status..."
php artisan tinker --execute="
\$user = \App\Models\User::where('email','admin@hr360.com')->with('roles','primaryRole')->first();
if(\$user) {
  echo 'User: ' . \$user->email . PHP_EOL;
  echo 'Primary Role ID: ' . (\$user->primary_role_id ?? 'NULL') . PHP_EOL;
  echo 'Roles: ' . \$user->roles->pluck('name')->join(', ') . PHP_EOL;
} else {
  echo 'User not found!' . PHP_EOL;
}
"

echo ""
echo "🔧 Fixing admin role assignment..."
php artisan fix:admin-role --email=admin@hr360.com

echo ""
echo "✅ Verifying fix..."
php artisan tinker --execute="
\$user = \App\Models\User::where('email','admin@hr360.com')->with('roles','primaryRole')->first();
if(\$user) {
  echo 'User: ' . \$user->email . PHP_EOL;
  echo 'Primary Role: ' . (\$user->primaryRole->name ?? 'NULL') . PHP_EOL;
  echo 'Has dashboard.management: ' . (\$user->hasPermission('dashboard.management') ? 'YES ✓' : 'NO ✗') . PHP_EOL;
  echo 'Has chat.view: ' . (\$user->hasPermission('chat.view') ? 'YES ✓' : 'NO ✗') . PHP_EOL;
  echo 'All roles: ' . \$user->all_roles->pluck('name')->join(', ') . PHP_EOL;
}
"

echo ""
echo "🧹 Clearing cache..."
php artisan optimize:clear

echo ""
echo "✅ Done! Admin user should now see the management dashboard."
ENDSSH

echo ""
echo "🎉 Production admin role fixed successfully!"
echo "   Login at: https://www.royalgatewayadmin.com"
echo "   Email: admin@hr360.com"
echo ""
