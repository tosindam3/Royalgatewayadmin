<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Disable foreign key checks to truncate safely
        Schema::disableForeignKeyConstraints();
        DB::table('role_permissions')->truncate();
        DB::table('user_roles')->truncate();
        DB::table('permissions')->truncate();
        DB::table('roles')->truncate();
        Schema::enableForeignKeyConstraints();

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
            'attendance' => ['view', 'clock', 'correct', 'approve-correction', 'export', 'settings'],
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

            'ceo' => Role::create([
                'name' => 'ceo',
                'display_name' => 'CEO',
                'description' => 'Executive level oversight and organizational reporting',
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
        // Super Admin & CEO - All permissions with 'all' scope
        $fullAccessPerms = [];
        foreach ($permissions as $permission) {
            $fullAccessPerms[$permission->id] = ['scope_level' => 'all'];
        }
        $roles['super_admin']->permissions()->sync($fullAccessPerms);
        $roles['ceo']->permissions()->sync($fullAccessPerms);

        // HR Manager - Full HR scope
        $hrPerms = [];
        foreach ($permissions as $key => $permission) {
            // HR Managers usually shouldn't delete roles or workflows unless they are also admins
            $scope = str_contains($key, 'delete') ? 'branch' : 'all';
            if (str_starts_with($key, 'roles.') || str_starts_with($key, 'workflows.')) {
                $scope = 'none';
            }
            
            if ($scope !== 'none') {
                $hrPerms[$permission->id] = ['scope_level' => 'all'];
            }
        }
        $roles['hr_manager']->permissions()->sync($hrPerms);

        // Branch Manager
        $branchPerms = [];
        foreach ($permissions as $key => $permission) {
            $module = explode('.', $key)[0];
            if (in_array($module, ['employees', 'attendance', 'leave', 'performance', 'reports', 'payroll'])) {
                $branchPerms[$permission->id] = ['scope_level' => 'branch'];
            }
        }
        $roles['branch_manager']->permissions()->sync($branchPerms);

        // Department Head
        $deptPerms = [];
        foreach ($permissions as $key => $permission) {
            $module = explode('.', $key)[0];
            if (in_array($module, ['employees', 'attendance', 'leave', 'performance', 'reports'])) {
                $deptPerms[$permission->id] = ['scope_level' => 'department'];
            }
        }
        $roles['department_head']->permissions()->sync($deptPerms);

        // Employee
        $employeeModules = [
            'employees.view' => 'self',
            'attendance.view' => 'self',
            'attendance.clock' => 'self',
            'attendance.correct' => 'self',
            'leave.view' => 'self',
            'leave.apply' => 'self',
            'performance.view' => 'self',
        ];
        $empPerms = [];
        foreach ($employeeModules as $key => $scope) {
            if (isset($permissions[$key])) {
                $empPerms[$permissions[$key]->id] = ['scope_level' => $scope];
            }
        }
        $roles['employee']->permissions()->sync($empPerms);
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
