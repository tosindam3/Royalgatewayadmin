<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Support\Facades\DB;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            // Create Permissions
            $permissions = $this->createPermissions();
            
            // Create Roles
            $roles = $this->createRoles();
            
            // Assign Permissions to Roles
            $this->assignPermissions($roles, $permissions);
        });
    }

    private function createPermissions(): array
    {
        $modules = [
            'employees' => ['view', 'create', 'update', 'delete', 'export'],
            'attendance' => ['view', 'clock', 'correct', 'approve-correction', 'export'],
            'leave' => ['view', 'apply', 'approve', 'reject', 'cancel', 'export'],
            'payroll' => ['view', 'process', 'approve', 'export'],
            'performance' => ['view', 'create', 'update', 'approve', 'export'],
            'onboarding' => ['view', 'create', 'update', 'assign-tasks'],
            'branches' => ['view', 'create', 'update', 'delete'],
            'departments' => ['view', 'create', 'update', 'delete'],
            'designations' => ['view', 'create', 'update', 'delete'],
            'settings' => ['view', 'update'],
            'roles' => ['view', 'create', 'update', 'delete', 'assign'],
            'workflows' => ['view', 'create', 'update', 'delete'],
            'reports' => ['view', 'export'],
            'analytics' => ['view'],
        ];

        $permissions = [];

        foreach ($modules as $module => $actions) {
            foreach ($actions as $action) {
                $availableScopes = $this->getAvailableScopes($module, $action);
                
                $permission = Permission::create([
                    'name' => "{$module}.{$action}",
                    'display_name' => ucwords(str_replace('-', ' ', $action)) . ' ' . ucfirst($module),
                    'module' => $module,
                    'action' => $action,
                    'description' => "Permission to {$action} {$module}",
                    'available_scopes' => $availableScopes,
                    'is_system' => true,
                ]);

                $permissions["{$module}.{$action}"] = $permission;
            }
        }

        return $permissions;
    }

    private function getAvailableScopes(string $module, string $action): array
    {
        // Self-only actions
        if (in_array($action, ['clock', 'apply'])) {
            return ['self'];
        }

        // All scopes for most actions
        return ['all', 'branch', 'department', 'team', 'self'];
    }

    private function createRoles(): array
    {
        return [
            'super_admin' => Role::create([
                'name' => 'super_admin',
                'display_name' => 'Super Administrator',
                'description' => 'Full system access with all permissions',
                'default_scope' => 'all',
                'is_system' => true,
                'is_active' => true,
            ]),
            
            'admin' => Role::create([
                'name' => 'admin',
                'display_name' => 'Administrator',
                'description' => 'Organization-wide administrative access',
                'default_scope' => 'all',
                'is_system' => true,
                'is_active' => true,
            ]),
            
            'hr_manager' => Role::create([
                'name' => 'hr_manager',
                'display_name' => 'HR Manager',
                'description' => 'HR operations and employee management',
                'default_scope' => 'all',
                'is_system' => true,
                'is_active' => true,
            ]),
            
            'branch_manager' => Role::create([
                'name' => 'branch_manager',
                'display_name' => 'Branch Manager',
                'description' => 'Branch-level management and operations',
                'default_scope' => 'branch',
                'is_system' => true,
                'is_active' => true,
            ]),
            
            'department_head' => Role::create([
                'name' => 'department_head',
                'display_name' => 'Department Head',
                'description' => 'Department-level management',
                'default_scope' => 'department',
                'is_system' => true,
                'is_active' => true,
            ]),
            
            'team_lead' => Role::create([
                'name' => 'team_lead',
                'display_name' => 'Team Lead',
                'description' => 'Team management and direct reports',
                'default_scope' => 'team',
                'is_system' => true,
                'is_active' => true,
            ]),
            
            'employee' => Role::create([
                'name' => 'employee',
                'display_name' => 'Employee',
                'description' => 'Standard employee access',
                'default_scope' => 'self',
                'is_system' => true,
                'is_active' => true,
            ]),
        ];
    }

    private function assignPermissions(array $roles, array $permissions): void
    {
        // Super Admin - All permissions with 'all' scope
        $superAdminPerms = [];
        foreach ($permissions as $permission) {
            $superAdminPerms[$permission->id] = ['scope_level' => 'all'];
        }
        $roles['super_admin']->permissions()->sync($superAdminPerms);

        // Admin - Most permissions with 'all' scope
        $adminPerms = [];
        foreach ($permissions as $key => $permission) {
            if (!str_starts_with($key, 'roles.') && !str_starts_with($key, 'workflows.')) {
                $adminPerms[$permission->id] = ['scope_level' => 'all'];
            }
        }
        $roles['admin']->permissions()->sync($adminPerms);

        // HR Manager
        $hrPerms = [
            'employees.view' => 'all',
            'employees.create' => 'all',
            'employees.update' => 'all',
            'employees.export' => 'all',
            'attendance.view' => 'all',
            'attendance.approve-correction' => 'all',
            'leave.view' => 'all',
            'leave.approve' => 'all',
            'leave.reject' => 'all',
            'payroll.view' => 'all',
            'performance.view' => 'all',
            'performance.approve' => 'all',
            'onboarding.view' => 'all',
            'onboarding.create' => 'all',
            'onboarding.assign-tasks' => 'all',
            'reports.view' => 'all',
            'analytics.view' => 'all',
        ];
        $this->syncPermissions($roles['hr_manager'], $permissions, $hrPerms);

        // Branch Manager
        $branchPerms = [
            'employees.view' => 'branch',
            'employees.update' => 'branch',
            'attendance.view' => 'branch',
            'attendance.approve-correction' => 'branch',
            'leave.view' => 'branch',
            'leave.approve' => 'branch',
            'leave.reject' => 'branch',
            'performance.view' => 'branch',
            'performance.approve' => 'branch',
            'reports.view' => 'branch',
        ];
        $this->syncPermissions($roles['branch_manager'], $permissions, $branchPerms);

        // Department Head
        $deptPerms = [
            'employees.view' => 'department',
            'attendance.view' => 'department',
            'leave.view' => 'department',
            'leave.approve' => 'department',
            'performance.view' => 'department',
            'reports.view' => 'department',
        ];
        $this->syncPermissions($roles['department_head'], $permissions, $deptPerms);

        // Team Lead
        $teamPerms = [
            'employees.view' => 'team',
            'attendance.view' => 'team',
            'leave.view' => 'team',
            'leave.approve' => 'team',
            'performance.view' => 'team',
            'performance.create' => 'team',
        ];
        $this->syncPermissions($roles['team_lead'], $permissions, $teamPerms);

        // Employee
        $employeePerms = [
            'employees.view' => 'self',
            'attendance.view' => 'self',
            'attendance.clock' => 'self',
            'attendance.correct' => 'self',
            'leave.view' => 'self',
            'leave.apply' => 'self',
            'performance.view' => 'self',
        ];
        $this->syncPermissions($roles['employee'], $permissions, $employeePerms);
    }

    private function syncPermissions(Role $role, array $allPermissions, array $permissionMap): void
    {
        $syncData = [];
        foreach ($permissionMap as $permKey => $scope) {
            if (isset($allPermissions[$permKey])) {
                $syncData[$allPermissions[$permKey]->id] = ['scope_level' => $scope];
            }
        }
        $role->permissions()->sync($syncData);
    }
}
