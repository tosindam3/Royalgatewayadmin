<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== DEBUGGING SAME DEVICE, DIFFERENT RESULTS ===\n\n";

echo "Since both users are on the SAME device, they get the SAME coordinates.\n";
echo "The issue must be in the BACKEND validation logic.\n\n";

// Get both users
$admin = App\Models\User::where('email', 'analytictosin@gmail.com')
    ->with(['employeeProfile.branch', 'employeeProfile.workplace'])
    ->first();

$employee = App\Models\User::where('email', 'tosinfanimo3@gmail.com')
    ->with(['employeeProfile.branch', 'employeeProfile.workplace'])
    ->first();

echo "=== ADMIN (Oluwatosin) ===\n";
if ($admin && $admin->employeeProfile) {
    $emp = $admin->employeeProfile;
    echo "Employee ID: {$emp->id}\n";
    echo "Branch ID: {$emp->branch_id}\n";
    echo "Branch Name: " . ($emp->branch ? $emp->branch->name : 'None') . "\n";
    echo "Allow Mobile Check-in: " . ($emp->allow_mobile_checkin ? 'YES' : 'NO') . "\n";
    echo "Workplace: " . ($emp->workplace ? $emp->workplace->name : 'None') . "\n";
    if ($emp->workplace) {
        echo "  - Workplace Lat: {$emp->workplace->latitude}\n";
        echo "  - Workplace Lng: {$emp->workplace->longitude}\n";
        echo "  - Workplace Radius: {$emp->workplace->radius_meters}m\n";
    }
} else {
    echo "No employee profile found\n";
}

echo "\n=== EMPLOYEE (Lazarus) ===\n";
if ($employee && $employee->employeeProfile) {
    $emp = $employee->employeeProfile;
    echo "Employee ID: {$emp->id}\n";
    echo "Branch ID: {$emp->branch_id}\n";
    echo "Branch Name: " . ($emp->branch ? $emp->branch->name : 'None') . "\n";
    echo "Allow Mobile Check-in: " . ($emp->allow_mobile_checkin ? 'YES' : 'NO') . "\n";
    echo "Workplace: " . ($emp->workplace ? $emp->workplace->name : 'None') . "\n";
    if ($emp->workplace) {
        echo "  - Workplace Lat: {$emp->workplace->latitude}\n";
        echo "  - Workplace Lng: {$emp->workplace->longitude}\n";
        echo "  - Workplace Radius: {$emp->workplace->radius_meters}m\n";
    }
} else {
    echo "No employee profile found\n";
}

echo "\n=== COMPARISON ===\n";
if ($admin && $employee && $admin->employeeProfile && $employee->employeeProfile) {
    $adminEmp = $admin->employeeProfile;
    $employeeEmp = $employee->employeeProfile;
    
    if ($adminEmp->branch_id === $employeeEmp->branch_id) {
        echo "✅ SAME BRANCH: Both in Branch ID {$adminEmp->branch_id}\n";
    } else {
        echo "❌ DIFFERENT BRANCHES:\n";
        echo "   Admin: Branch ID {$adminEmp->branch_id}\n";
        echo "   Employee: Branch ID {$employeeEmp->branch_id}\n";
        echo "   This could cause different geofence matching!\n";
    }
    
    if ($adminEmp->allow_mobile_checkin === $employeeEmp->allow_mobile_checkin) {
        echo "✅ SAME MOBILE CHECK-IN PERMISSION\n";
    } else {
        echo "❌ DIFFERENT MOBILE CHECK-IN PERMISSION:\n";
        echo "   Admin: " . ($adminEmp->allow_mobile_checkin ? 'Allowed' : 'Blocked') . "\n";
        echo "   Employee: " . ($employeeEmp->allow_mobile_checkin ? 'Allowed' : 'Blocked') . "\n";
    }
    
    $adminWorkplace = $adminEmp->workplace_id;
    $employeeWorkplace = $employeeEmp->workplace_id;
    
    if ($adminWorkplace === $employeeWorkplace) {
        echo "✅ SAME WORKPLACE ASSIGNMENT\n";
    } else {
        echo "⚠️ DIFFERENT WORKPLACE ASSIGNMENT:\n";
        echo "   Admin: " . ($adminWorkplace ?? 'None') . "\n";
        echo "   Employee: " . ($employeeWorkplace ?? 'None') . "\n";
        echo "   This could trigger workplace radius validation!\n";
    }
}

echo "\n=== ACTIVE GEOFENCE ZONES ===\n";
$zones = App\Models\GeofenceZone::where('is_active', true)->get();

if ($zones->count() === 0) {
    echo "No active zones - geofencing is disabled\n";
} else {
    foreach ($zones as $zone) {
        echo "\nZone: {$zone->name}\n";
        echo "- ID: {$zone->id}\n";
        echo "- Branch: " . ($zone->branch_id ?? 'Global (all branches)') . "\n";
        echo "- Coordinates: Lat {$zone->latitude}, Lng {$zone->longitude}\n";
        echo "- Radius: {$zone->radius} meters\n";
        
        // Check which employees this zone applies to
        if ($zone->branch_id === null) {
            echo "- Applies to: ALL employees (global zone)\n";
        } else {
            echo "- Applies to: Only employees in Branch ID {$zone->branch_id}\n";
            
            if ($admin && $admin->employeeProfile && $admin->employeeProfile->branch_id == $zone->branch_id) {
                echo "  ✅ Admin is in this branch\n";
            } else {
                echo "  ❌ Admin is NOT in this branch\n";
            }
            
            if ($employee && $employee->employeeProfile && $employee->employeeProfile->branch_id == $zone->branch_id) {
                echo "  ✅ Employee is in this branch\n";
            } else {
                echo "  ❌ Employee is NOT in this branch\n";
            }
        }
    }
}

echo "\n=== CHECK-IN VALIDATION LOGIC ===\n\n";
echo "When a user tries to check in, the system:\n";
echo "1. Gets user's coordinates from browser\n";
echo "2. Calls findMatchingZone(lat, lng, employee_branch_id)\n";
echo "3. Checks branch-specific zones first\n";
echo "4. Then checks global zones\n";
echo "5. If no match and active zones exist → 422 error\n";
echo "6. If no match and no active zones → allow check-in\n\n";

echo "=== POSSIBLE ISSUES ===\n\n";

echo "Issue 1: Employee has 'allow_mobile_checkin' = false\n";
echo "  - Check: allow_mobile_checkin field in employees table\n";
echo "  - Fix: Set to true for employee\n\n";

echo "Issue 2: Zone is branch-specific but employee is in different branch\n";
echo "  - Check: Zone branch_id vs employee branch_id\n";
echo "  - Fix: Make zone global (branch_id = null) or assign employee to correct branch\n\n";

echo "Issue 3: Employee has workplace assigned with small radius\n";
echo "  - Check: workplace_id and workplace radius\n";
echo "  - Fix: Remove workplace assignment or increase radius\n\n";

echo "Issue 4: Coordinates are actually different (browser cache)\n";
echo "  - Check: Clear browser cache and try again\n";
echo "  - Fix: Hard refresh (Ctrl+Shift+R)\n\n";

echo "=== RECOMMENDED FIX ===\n\n";
echo "Run this to allow employee to check in:\n\n";
echo "php artisan tinker\n\n";
echo "\$emp = App\\Models\\Employee::find({$employee->employeeProfile->id});\n";
echo "\$emp->allow_mobile_checkin = true;\n";
echo "\$emp->workplace_id = null; // Remove workplace restriction\n";
echo "\$emp->save();\n\n";

echo "Or temporarily disable geofencing:\n";
echo "php backend/temp-disable-geofencing.php\n";
