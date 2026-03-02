<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== GEOFENCE DIAGNOSIS ===\n\n";

// Get both employees
$oluwatosin = App\Models\User::where('email', 'analytictosin@gmail.com')
    ->with(['employeeProfile.branch'])
    ->first();

$lazarus = App\Models\User::where('email', 'tosinfanimo3@gmail.com')
    ->with(['employeeProfile.branch'])
    ->first();

echo "EMPLOYEE 1: Oluwatosin Fanimo (Admin)\n";
echo "- Email: {$oluwatosin->email}\n";
echo "- Employee ID: {$oluwatosin->employeeProfile->id}\n";
echo "- Branch: {$oluwatosin->employeeProfile->branch->name}\n";
echo "- Branch ID: {$oluwatosin->employeeProfile->branch_id}\n\n";

echo "EMPLOYEE 2: Lazarus Lawal (Employee)\n";
echo "- Email: {$lazarus->email}\n";
echo "- Employee ID: {$lazarus->employeeProfile->id}\n";
echo "- Branch: {$lazarus->employeeProfile->branch->name}\n";
echo "- Branch ID: {$lazarus->employeeProfile->branch_id}\n\n";

// Check if same branch
if ($oluwatosin->employeeProfile->branch_id === $lazarus->employeeProfile->branch_id) {
    echo "✅ BOTH IN SAME BRANCH: {$oluwatosin->employeeProfile->branch->name} (ID: {$oluwatosin->employeeProfile->branch_id})\n\n";
} else {
    echo "❌ DIFFERENT BRANCHES\n\n";
}

// Check Test geofence zone
echo "=== TEST GEOFENCE ZONE ===\n";
$testZone = App\Models\GeofenceZone::where('name', 'Test')->first();

if ($testZone) {
    echo "Name: {$testZone->name}\n";
    echo "Branch ID: " . ($testZone->branch_id ?? 'NULL (Global - applies to ALL branches)') . "\n";
    echo "Coordinates: Lat {$testZone->latitude}, Lng {$testZone->longitude}\n";
    echo "Radius: {$testZone->radius} meters\n";
    echo "Active: " . ($testZone->is_active ? 'YES' : 'NO') . "\n";
    echo "Geometry Type: {$testZone->geometry_type}\n\n";
    
    // Determine if zone applies to Lazarus
    if ($testZone->branch_id === null) {
        echo "✅ Zone is GLOBAL - applies to Lazarus's branch\n";
    } elseif ($testZone->branch_id == $lazarus->employeeProfile->branch_id) {
        echo "✅ Zone is for Branch ID {$testZone->branch_id} - MATCHES Lazarus's branch\n";
    } else {
        echo "❌ Zone is for Branch ID {$testZone->branch_id} - DOES NOT MATCH Lazarus's branch (ID: {$lazarus->employeeProfile->branch_id})\n";
    }
} else {
    echo "Test zone not found\n";
}

echo "\n=== PROBLEM ANALYSIS ===\n";
echo "The issue is that the Test zone coordinates (Lat: 17.36, Lng: -40.55) are in the Atlantic Ocean.\n";
echo "When Lazarus tries to check in from his actual location, it doesn't match this zone.\n\n";

echo "=== SOLUTION ===\n";
echo "1. Re-enable the Test zone\n";
echo "2. Update it with REAL coordinates where your office is located\n";
echo "3. Or create a new zone with correct coordinates\n\n";

echo "Would you like to:\n";
echo "A) Re-enable the Test zone (it's currently disabled)\n";
echo "B) Keep it disabled (allows check-in from anywhere)\n";
echo "C) Update coordinates to a real location\n";
