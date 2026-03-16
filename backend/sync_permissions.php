<?php

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Support\Facades\DB;

DB::transaction(function () {
    $employeeRole = Role::where('name', 'employee')->first();
    if (!$employeeRole) {
        echo "Employee role not found!\n";
        return;
    }

    $permissions = [
        'employees.view' => 'self',
        'employees.update' => 'self',
        'attendance.view' => 'self',
        'attendance.clock' => 'self',
        'attendance.correct' => 'self',
        'leave.view' => 'self',
        'leave.apply' => 'self',
        'performance.view' => 'self',
        'performance.update' => 'self',
        'chat.view' => 'all',
        'chat.create-channel' => 'all',
        'memo.view' => 'all',
        'memo.create' => 'all',
        'dashboard.view' => 'self',
        'organization.view' => 'all',
        'branches.view' => 'all',
        'departments.view' => 'all',
        'designations.view' => 'all',
        'onboarding.view' => 'self',
        'onboarding.update' => 'self',
    ];

    $syncData = [];
    foreach ($permissions as $name => $scope) {
        $permission = Permission::where('name', $name)->first();
        if ($permission) {
            $syncData[$permission->id] = ['scope_level' => $scope];
        } else {
            echo "Warning: Permission {$name} not found.\n";
        }
    }

    $employeeRole->permissions()->sync($syncData);
    echo "Employee permissions synced successfully.\n";
});
