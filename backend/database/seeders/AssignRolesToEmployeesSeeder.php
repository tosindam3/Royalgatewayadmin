<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Employee;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class AssignRolesToEmployeesSeeder extends Seeder
{
    /**
     * Assign specific roles to 5 employees
     * 1 CEO, 1 Branch Manager, 1 HR Manager, 2 Employees
     */
    public function run(): void
    {
        echo "🚀 Assigning roles to employees...\n\n";

        // Get employees with user accounts
        $employees = Employee::whereNotNull('user_id')
            ->where('status', 'active')
            ->with('user')
            ->orderBy('id')
            ->take(10)
            ->get();

        if ($employees->count() < 5) {
            echo "❌ Not enough employees with user accounts. Found: " . $employees->count() . "\n";
            return;
        }

        // Get roles
        $roles = [
            'ceo' => Role::where('name', 'ceo')->first(),
            'branch_manager' => Role::where('name', 'branch_manager')->first(),
            'hr_manager' => Role::where('name', 'hr_manager')->first(),
            'employee' => Role::where('name', 'employee')->first(),
        ];

        // Verify roles exist
        foreach ($roles as $roleName => $role) {
            if (!$role) {
                echo "❌ Role '{$roleName}' not found! Please run RolePermissionSeeder first.\n";
                return;
            }
        }

        // Role assignments - select specific employees for each role
        $assignments = [
            ['employee_index' => 0, 'role' => 'ceo', 'title' => 'CEO'],
            ['employee_index' => 1, 'role' => 'branch_manager', 'title' => 'Branch Manager'],
            ['employee_index' => 2, 'role' => 'hr_manager', 'title' => 'HR Manager'],
            ['employee_index' => 3, 'role' => 'employee', 'title' => 'Employee'],
            ['employee_index' => 4, 'role' => 'employee', 'title' => 'Employee'],
        ];

        $updatedAccounts = [];
        $defaultPassword = 'Password123!';

        foreach ($assignments as $assignment) {
            $employee = $employees[$assignment['employee_index']];
            $user = $employee->user;
            $role = $roles[$assignment['role']];

            if (!$user) {
                echo "⚠️  Employee {$employee->full_name} has no user account. Skipping...\n";
                continue;
            }

            // Clear existing roles
            $user->roles()->detach();

            // Assign new role
            $user->assignRole($role);
            
            // Set as primary role
            $user->update(['primary_role_id' => $role->id]);

            // Reset password to default
            $user->update(['password' => Hash::make($defaultPassword)]);

            $updatedAccounts[] = [
                'employee_code' => $employee->employee_code,
                'name' => $employee->full_name,
                'email' => $employee->email,
                'role' => $assignment['title'],
                'password' => $defaultPassword,
            ];

            echo "✅ Updated account for: {$employee->full_name} ({$employee->employee_code})\n";
            echo "   Role: {$assignment['title']}\n";
            echo "   Email: {$employee->email}\n\n";
        }

        // Display summary
        echo "\n" . str_repeat('=', 80) . "\n";
        echo "🎉 ROLE ASSIGNMENT SUMMARY\n";
        echo str_repeat('=', 80) . "\n\n";

        foreach ($updatedAccounts as $account) {
            echo "👤 {$account['role']}\n";
            echo "   Employee Code: {$account['employee_code']}\n";
            echo "   Name: {$account['name']}\n";
            echo "   Email: {$account['email']}\n";
            echo "   Password: {$account['password']}\n";
            echo "\n";
        }

        echo str_repeat('=', 80) . "\n";
        echo "📝 Total accounts updated: " . count($updatedAccounts) . "\n";
        echo "🔐 Default password for all accounts: {$defaultPassword}\n";
        echo "⚠️  Users should change their password after first login\n";
        echo str_repeat('=', 80) . "\n";
    }
}
