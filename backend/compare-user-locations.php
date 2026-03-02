<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== LOCATION DETECTION COMPARISON ===\n\n";

echo "IMPORTANT: Both users are using the SAME browser geolocation API.\n";
echo "If they're in the same location but getting different results, here's why:\n\n";

echo "=== POSSIBLE REASONS FOR DIFFERENT COORDINATES ===\n\n";

echo "1. DIFFERENT DEVICES:\n";
echo "   - Admin (Oluwatosin): Using Device A (e.g., laptop)\n";
echo "   - Employee (Lazarus): Using Device B (e.g., different laptop/phone)\n";
echo "   - Different devices = different GPS/WiFi capabilities\n";
echo "   - Result: Different accuracy and coordinates\n\n";

echo "2. DIFFERENT BROWSERS:\n";
echo "   - Chrome vs Firefox vs Safari\n";
echo "   - Each browser implements geolocation slightly differently\n";
echo "   - Result: Small variations in coordinates\n\n";

echo "3. DIFFERENT LOCATION METHODS:\n";
echo "   - Admin's device: Using WiFi positioning (accuracy: 100m)\n";
echo "   - Employee's device: Using IP geolocation (accuracy: 5000m)\n";
echo "   - Result: Completely different coordinates\n\n";

echo "4. TIMING DIFFERENCE:\n";
echo "   - Admin set up zone at Time A\n";
echo "   - Employee checking in at Time B\n";
echo "   - GPS coordinates can drift slightly over time\n";
echo "   - Result: Small variations (5-50 meters)\n\n";

echo "5. BROWSER PERMISSIONS:\n";
echo "   - Admin: Granted location permission → GPS used\n";
echo "   - Employee: Denied/blocked permission → IP fallback used\n";
echo "   - Result: Very different coordinates\n\n";

echo "=== CURRENT ZONE CONFIGURATION ===\n\n";

$zone = App\Models\GeofenceZone::where('is_active', true)->first();

if ($zone) {
    echo "Active Zone: {$zone->name}\n";
    echo "Coordinates: Lat {$zone->latitude}, Lng {$zone->longitude}\n";
    echo "Radius: {$zone->radius} meters\n";
    echo "Branch: " . ($zone->branch_id ?? 'Global') . "\n\n";
    
    echo "This zone was created when admin clicked 'Detect My Current Location'.\n";
    echo "The coordinates saved are what admin's device reported at that moment.\n\n";
} else {
    echo "No active zones found.\n\n";
}

echo "=== DIAGNOSTIC STEPS ===\n\n";

echo "Step 1: Check what ADMIN is getting NOW\n";
echo "---------------------------------------\n";
echo "1. Login as admin (Oluwatosin)\n";
echo "2. Open browser console (F12)\n";
echo "3. Run this code:\n\n";
echo "navigator.geolocation.getCurrentPosition((p) => {\n";
echo "  console.log('ADMIN Location:');\n";
echo "  console.log('Lat:', p.coords.latitude);\n";
echo "  console.log('Lng:', p.coords.longitude);\n";
echo "  console.log('Accuracy:', p.coords.accuracy, 'meters');\n";
echo "}, null, {enableHighAccuracy: true});\n\n";

echo "Step 2: Check what EMPLOYEE is getting NOW\n";
echo "-------------------------------------------\n";
echo "1. Login as employee (Lazarus)\n";
echo "2. Open browser console (F12)\n";
echo "3. Run the SAME code:\n\n";
echo "navigator.geolocation.getCurrentPosition((p) => {\n";
echo "  console.log('EMPLOYEE Location:');\n";
echo "  console.log('Lat:', p.coords.latitude);\n";
echo "  console.log('Lng:', p.coords.longitude);\n";
echo "  console.log('Accuracy:', p.coords.accuracy, 'meters');\n";
echo "}, null, {enableHighAccuracy: true});\n\n";

echo "Step 3: Compare the Results\n";
echo "---------------------------\n";
echo "If coordinates are SIMILAR (within 100 meters):\n";
echo "  → Both devices are working correctly\n";
echo "  → Zone radius might be too small\n";
echo "  → Solution: Increase zone radius to 1000 meters\n\n";

echo "If coordinates are VERY DIFFERENT (> 1km apart):\n";
echo "  → One device is using inaccurate method (IP geolocation)\n";
echo "  → Check accuracy values:\n";
echo "    - < 100m = Good (GPS/WiFi)\n";
echo "    - > 1000m = Bad (IP geolocation)\n";
echo "  → Solution: Use device with better GPS\n\n";

echo "=== TESTING TOOL ===\n\n";
echo "After getting both coordinates, test them:\n\n";
echo "php backend/test-geofence-with-location.php ADMIN_LAT ADMIN_LNG\n";
echo "php backend/test-geofence-with-location.php EMPLOYEE_LAT EMPLOYEE_LNG\n\n";

echo "This will show if each location is within the zone.\n\n";

echo "=== COMMON SCENARIO ===\n\n";
echo "What probably happened:\n";
echo "1. Admin used laptop to set up zone\n";
echo "2. Laptop used WiFi positioning (accuracy: 100m)\n";
echo "3. Saved coordinates: Lat X, Lng Y\n";
echo "4. Employee using different laptop\n";
echo "5. Employee's laptop using IP geolocation (accuracy: 5000m)\n";
echo "6. Employee's coordinates: Lat X+5km, Lng Y+5km\n";
echo "7. Employee is 'outside' the zone even though physically in same room!\n\n";

echo "=== SOLUTION ===\n\n";
echo "Option 1: Increase Zone Radius (Quick Fix)\n";
echo "-------------------------------------------\n";
echo "php artisan tinker\n";
echo "\$zone = App\\Models\\GeofenceZone::find({$zone->id});\n";
echo "\$zone->radius = 2000; // 2km radius\n";
echo "\$zone->save();\n\n";
echo "This accommodates location inaccuracy.\n\n";

echo "Option 2: Use Smartphone for Both (Best)\n";
echo "-----------------------------------------\n";
echo "1. Admin: Use smartphone to set up zone\n";
echo "2. Employee: Use smartphone to check in\n";
echo "3. Smartphones have GPS = much more accurate\n\n";

echo "Option 3: Temporarily Disable Geofencing\n";
echo "-----------------------------------------\n";
echo "php backend/temp-disable-geofencing.php\n\n";
echo "This allows testing without location restrictions.\n\n";

echo "=== KEY INSIGHT ===\n\n";
echo "The geolocation API is the SAME for both users.\n";
echo "The DIFFERENCE is in what each device reports:\n";
echo "- Device capabilities (GPS vs no GPS)\n";
echo "- Location method used (GPS vs WiFi vs IP)\n";
echo "- Accuracy of the method\n";
echo "- Browser permissions\n\n";

echo "Both users calling the same API doesn't mean they get the same result!\n";
echo "It's like two people measuring temperature with different thermometers.\n";
