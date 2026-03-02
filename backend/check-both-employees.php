<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== CHECKING BOTH EMPLOYEES ===\n\n";

// Check Fanimo Oluwatosin (Admin)
$tosin = App\Models\User::where('email', 'tosindam3@gmail.com')
    ->with(['employeeProfile.branch'])
    ->first();

if ($tosin) {
    echo "FANIMO OLUWATOSIN (Admin)\n";
    echo "- User ID: {$tosin->id}\n";
    echo "- Email: {$tosin->email}\n";
    if ($tosin->employeeProfile) {
        echo "- Employee ID: {$tosin->employeeProfile->id}\n";
        echo "- Branch: " . ($tosin->employeeProfile->branch ? $tosin->employeeProfile->branch->name : 'No Branch') . "\n";
        echo "- Branch ID: {$tosin->employeeProfile->branch_id}\n";
    }
    echo "\n";
}

// Check Lazarus Lawal (Employee)
$lazarus = App\Models\User::where('email', 'tosinfanimo3@gmail.com')
    ->with(['employeeProfile.branch'])
    ->first();

if ($lazarus) {
    echo "LAZARUS LAWAL (Employee)\n";
    echo "- User ID: {$lazarus->id}\n";
    echo "- Email: {$lazarus->email}\n";
    if ($lazarus->employeeProfile) {
        echo "- Employee ID: {$lazarus->employeeProfile->id}\n";
        echo "- Branch: " . ($lazarus->employeeProfile->branch ? $lazarus->employeeProfile->branch->name : 'No Branch') . "\n";
        echo "- Branch ID: {$lazarus->employeeProfile->branch_id}\n";
    }
    echo "\n";
}

// Check if they're in the same branch
if ($tosin && $lazarus && $tosin->employeeProfile && $lazarus->employeeProfile) {
    if ($tosin->employeeProfile->branch_id === $lazarus->employeeProfile->branch_id) {
        echo "✅ Both employees are in the SAME branch (ID: {$tosin->employeeProfile->branch_id})\n\n";
    } else {
        echo "❌ Employees are in DIFFERENT branches\n";
        echo "   Tosin: Branch ID {$tosin->employeeProfile->branch_id}\n";
        echo "   Lazarus: Branch ID {$lazarus->employeeProfile->branch_id}\n\n";
    }
}

// Check the Test geofence zone
echo "=== TEST GEOFENCE ZONE ===\n";
$testZone = App\Models\GeofenceZone::where('name', 'Test')->first();

if ($testZone) {
    echo "Name: {$testZone->name}\n";
    echo "Branch ID: " . ($testZone->branch_id ?? 'NULL (Global)') . "\n";
    echo "Latitude: {$testZone->latitude}\n";
    echo "Longitude: {$testZone->longitude}\n";
    echo "Radius: {$testZone->radius} meters\n";
    echo "Active: " . ($testZone->is_active ? 'Yes' : 'No') . "\n";
    echo "Geometry Type: {$testZone->geometry_type}\n\n";
    
    // Check if zone matches the branch
    if ($lazarus && $lazarus->employeeProfile) {
        $lazarusBranchId = $lazarus->employeeProfile->branch_id;
        
        if ($testZone->branch_id === null) {
            echo "✅ Zone is GLOBAL - applies to all branches including Lazarus's branch\n";
        } elseif ($testZone->branch_id == $lazarusBranchId) {
            echo "✅ Zone is for Branch ID {$testZone->branch_id} - MATCHES Lazarus's branch\n";
        } else {
            echo "❌ Zone is for Branch ID {$testZone->branch_id} - DOES NOT MATCH Lazarus's branch (ID: {$lazarusBranchId})\n";
        }
    }
} else {
    echo "Test zone not found\n";
}

echo "\n=== ALL GEOFENCE ZONES ===\n";
$allZones = App\Models\GeofenceZone::all();
foreach ($allZones as $zone) {
    echo "- {$zone->name}: Branch ID " . ($zone->branch_id ?? 'NULL') . ", Active: " . ($zone->is_active ? 'Yes' : 'No') . "\n";
}
