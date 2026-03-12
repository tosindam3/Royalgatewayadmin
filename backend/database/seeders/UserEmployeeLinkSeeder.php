<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Employee;
use App\Models\Role;
use App\Models\Permission;

class UserEmployeeLinkSeeder extends Seeder
{
    public function run(): void
    {
        // Create roles if they don't exist
        $adminRole = Role::firstOrCreate(
            ['name' => 'Super Admin'],
            [
                'display_name' => 'Super Admin',
                'description' => 'Full system access',
                'is_system' => true,
                'is_active' => true
            ]
        );

        $hrRole = Role::firstOrCreate(
            ['name' => 'HR Manager'],
            [
                'display_name' => 'HR Manager',
                'description' => 'HR management access',
                'is_system' => true,
                'is_active' => true
            ]
        );

        $managerRole = Role::firstOrCreate(
            ['name' => 'Manager'],
            [
                'display_name' => 'Manager',
                'description' => 'Team management access',
                'is_system' => true,
                'is_active' => true
            ]
        );

        $employeeRole = Role::firstOrCreate(
            ['name' => 'Employee'],
            [
                'display_name' => 'Employee',
                'description' => 'Basic employee access',
                'is_system' => true,
                'is_active' => true
            ]
        );

        // Create basic permissions
        $permissions = [
            'view_attendance' => ['display' => 'View Attendance', 'module' => 'attendance', 'action' => 'view', 'description' => 'View attendance records'],
            'manage_attendance' => ['display' => 'Manage Attendance', 'module' => 'attendance', 'action' => 'manage', 'description' => 'Manage attendance settings'],
            'view_employees' => ['display' => 'View Employees', 'module' => 'employees', 'action' => 'view', 'description' => 'View employee records'],
            'manage_employees' => ['display' => 'Manage Employees', 'module' => 'employees', 'action' => 'manage', 'description' => 'Manage employee records'],
            'view_payroll' => ['display' => 'View Payroll', 'module' => 'payroll', 'action' => 'view', 'description' => 'View payroll information'],
            'manage_payroll' => ['display' => 'Manage Payroll', 'module' => 'payroll', 'action' => 'manage', 'description' => 'Manage payroll'],
            'view_reports' => ['display' => 'View Reports', 'module' => 'reports', 'action' => 'view', 'description' => 'View reports'],
            'export_reports' => ['display' => 'Export Reports', 'module' => 'reports', 'action' => 'export', 'description' => 'Export reports'],
        ];

        foreach ($permissions as $name => $data) {
            Permission::firstOrCreate(
                ['name' => $name],
                [
                    'display_name' => $data['display'],
                    'module' => $data['module'],
                    'action' => $data['action'],
                    'description' => $data['description'],
                    'is_system' => true
                ]
            );
        }

        // Assign all permissions to admin role
        $adminRole->permissions()->sync(Permission::all()->pluck('id'));

        // Assign HR permissions
        $hrPermissions = Permission::whereIn('name', [
            'view_attendance', 'manage_attendance', 'view_employees', 
            'manage_employees', 'view_payroll', 'manage_payroll', 
            'view_reports', 'export_reports'
        ])->pluck('id');
        $hrRole->permissions()->sync($hrPermissions);

        // Assign manager permissions
        $managerPermissions = Permission::whereIn('name', [
            'view_attendance', 'view_employees', 'view_reports', 'export_reports'
        ])->pluck('id');
        $managerRole->permissions()->sync($managerPermissions);

        // Assign employee permissions
        $employeePermissions = Permission::whereIn('name', [
            'view_attendance', 'view_reports'
        ])->pluck('id');
        $employeeRole->permissions()->sync($employeePermissions);

        // Link admin user to an employee
        $adminUser = User::where('email', 'admin@hr360.com')->first();
        if ($adminUser) {
            // Find or create an admin employee
            $adminEmployee = Employee::where('email', 'admin@hr360.com')->first();
            
            if (!$adminEmployee) {
                // Get first branch or create a default one
                $branch = \App\Models\Branch::first();
                if (!$branch) {
                    $branch = \App\Models\Branch::create([
                        'code' => 'HQ-MAIN',
                        'name' => 'Headquarters',
                        'location' => 'Main Office',
                        'type' => 'HQ',
                        'is_hq' => true,
                        'timezone' => 'UTC',
                        'status' => 'active',
                    ]);
                }

                // Get or create department
                $department = \App\Models\Department::first();
                if (!$department) {
                    $department = \App\Models\Department::create([
                        'code' => 'DEPT-ADMIN',
                        'name' => 'Administration',
                        'branch_id' => $branch->id,
                    ]);
                }

                // Get or create designation
                $designation = \App\Models\Designation::first();
                if (!$designation) {
                    $designation = \App\Models\Designation::create([
                        'code' => 'DES-ADMIN',
                        'name' => 'System Administrator',
                    ]);
                }

                // Create admin employee
                $adminEmployee = Employee::create([
                    'employee_code' => 'EMP-ADMIN',
                    'first_name' => 'System',
                    'last_name' => 'Administrator',
                    'email' => 'admin@hr360.com',
                    'phone' => '+1-555-0000',
                    'branch_id' => $branch->id,
                    'department_id' => $department->id,
                    'designation_id' => $designation->id,
                    'employment_type' => 'full-time',
                    'work_mode' => 'onsite',
                    'status' => 'active',
                    'hire_date' => now()->subYears(2),
                    'dob' => '1985-01-01',
                ]);
            }

            // Link user to employee
            $adminEmployee->user_id = $adminUser->id;
            $adminEmployee->save();

            // Assign admin role
            $adminUser->roles()->syncWithoutDetaching([
                $adminRole->id => [
                    'assigned_by' => null,
                    'assigned_at' => now(),
                ]
            ]);
            $adminUser->primary_role_id = $adminRole->id;
            $adminUser->save();

            echo "✓ Admin user linked to employee and assigned Super Admin role\n";
        }

        // Link test user to an employee
        $testUser = User::where('email', 'test@example.com')->first();
        if ($testUser) {
            // Link to first employee
            $employee = Employee::where('employee_code', 'EMP-00001')->first();
            
            if ($employee) {
                $employee->user_id = $testUser->id;
                $employee->save();

                // Assign employee role
                $testUser->roles()->syncWithoutDetaching([
                    $employeeRole->id => [
                        'assigned_by' => null,
                        'assigned_at' => now(),
                    ]
                ]);
                $testUser->primary_role_id = $employeeRole->id;
                $testUser->save();

                echo "✓ Test user linked to employee Kelly Robinson\n";
            }
        }

        echo "\n✓ User-Employee linking completed\n";
        echo "✓ Roles and permissions configured\n";
    }
}
