#!/bin/bash
cd /home/u237094395/apps/royalgatewayadmin/backend

echo "=== Checking organization_settings table ==="
php artisan tinker --execute="
\$settings = \App\Models\OrganizationSetting::first();
if(\$settings) {
  echo 'Settings found: ' . PHP_EOL;
  echo 'Company Name: ' . (\$settings->company_name ?? 'NULL') . PHP_EOL;
  echo 'Primary Color: ' . (\$settings->primary_color ?? 'NULL') . PHP_EOL;
  echo 'Logo URL: ' . (\$settings->logo_url ?? 'NULL') . PHP_EOL;
} else {
  echo 'No settings found! Creating default settings...' . PHP_EOL;
  \$settings = \App\Models\OrganizationSetting::create([
    'organization_id' => 1,
    'company_name' => 'HR360',
    'primary_color' => '#8252e9',
    'secondary_color' => '#6366f1',
    'logo_url' => '',
  ]);
  echo 'Default settings created!' . PHP_EOL;
}
"

echo ""
echo "=== Testing brand settings endpoint ==="
curl -s https://www.royalgatewayadmin.com/api/v1/brand-settings | head -20

echo ""
echo "=== Checking route list for brand-settings ==="
php artisan route:list --path=brand-settings

echo ""
echo "Done!"
