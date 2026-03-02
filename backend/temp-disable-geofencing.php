<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== TEMPORARILY DISABLE GEOFENCING ===\n\n";

$zones = App\Models\GeofenceZone::where('is_active', true)->get();

if ($zones->count() === 0) {
    echo "No active zones found. Geofencing is already disabled.\n";
    exit;
}

echo "Found {$zones->count()} active zone(s):\n";
foreach ($zones as $zone) {
    echo "- {$zone->name} (ID: {$zone->id})\n";
}

echo "\nDisabling all zones...\n\n";

foreach ($zones as $zone) {
    $zone->is_active = false;
    $zone->save();
    echo "✅ Disabled: {$zone->name}\n";
}

echo "\n✅ ALL GEOFENCE ZONES DISABLED\n\n";
echo "Employees can now check in from ANYWHERE.\n\n";

echo "=== NEXT STEPS ===\n";
echo "1. Have Lazarus try to check in now (should work)\n";
echo "2. Get his actual location coordinates:\n";
echo "   - Open browser console (F12)\n";
echo "   - Run: navigator.geolocation.getCurrentPosition((p) => console.log('Lat:', p.coords.latitude, 'Lng:', p.coords.longitude));\n";
echo "3. Update the Lugbe zone with correct coordinates via admin panel\n";
echo "4. Re-enable the zone\n\n";

echo "To re-enable zones later:\n";
echo "- Go to: Attendance > Settings > Geofence Zones\n";
echo "- Click the toggle to activate zones\n";
