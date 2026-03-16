<?php
use App\Models\User;
use App\Models\Employee;
use App\Models\Role;

$employeeRole = Role::where('name', 'employee')->first();
if (!$employeeRole) {
    echo "Employee role not found!\n";
    exit(1);
}

$employees = Employee::with('user')->get();
echo "Total employees: " . count($employees) . "\n";

foreach ($employees as $e) {
    $user = $e->user;
    if ($user) {
        if ($user->all_roles->isEmpty()) {
            echo "Assigning employee role to user: {$user->name} (ID: {$user->id})\n";
            $user->primary_role_id = $employeeRole->id;
            $user->save();
            
            // Also sync to user_roles table just in case
            $user->roles()->syncWithoutDetaching([$employeeRole->id]);
        } else {
            echo "User {$user->name} already has roles: " . $user->all_roles->pluck('name')->implode(', ') . "\n";
        }
    } else {
        echo "Employee {$e->full_name} has no linked user.\n";
    }
}

echo "Done!\n";
