<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== ALL GEOFENCE ZONES ===\n\n";

$zones = App\Models\GeofenceZone::all();

if ($zones->count() === 0) {
    echo "❌ NO GEOFENCE ZONES FOUND\n\n";
    echo "This means geofencing is effectively DISABLED.\n";
    echo "Employees should be able to check in from anywhere.\n\n";
    echo "If Lazarus is still getting 422 error, the issue is something else.\n\n";
} else {
    foreach ($zones as $zone) {
        echo "Zone: {$zone->name}\n";
        echo "- ID: {$zone->id}\n";
        echo "- Branch: " . ($zone->branch_id ?? 'Global') . "\n";
        echo "- Coordinates: Lat {$zone->latitude}, Lng {$zone->longitude}\n";
        echo "- Radius: {$zone->radius} meters\n";
        echo "- Active: " . ($zone->is_active ? 'YES' : 'NO') . "\n";
        echo "- Created: {$zone->created_at}\n";
        echo "\n";
    }
    
    $activeCount = $zones->where('is_active', true)->count();
    echo "Total zones: {$zones->count()}\n";
    echo "Active zones: {$activeCount}\n\n";
    
    if ($activeCount === 0) {
        echo "✅ No active zones - geofencing is DISABLED\n";
        echo "Employees can check in from anywhere\n";
    } else {
        echo "⚠️ {$activeCount} active zone(s) - geofencing is ENABLED\n";
        echo "Employees must be within a zone to check in\n";
    }
}

echo "\n=== CHECKING LAZARUS'S LOCATION ===\n";
echo "To debug, we need Lazarus's actual coordinates.\n";
echo "Ask Lazarus to:\n";
echo "1. Open browser console (F12)\n";
echo "2. Run: navigator.geolocation.getCurrentPosition((p) => console.log(p.coords.latitude, p.coords.longitude));\n";
echo "3. Share the coordinates\n";
echo "4. Then run: php backend/test-geofence-with-location.php LAT LNG\n";
