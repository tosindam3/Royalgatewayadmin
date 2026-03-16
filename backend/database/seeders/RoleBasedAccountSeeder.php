<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Employee;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class RoleBasedAccountSeeder extends Seeder
{
    /**
     * Create user accounts for 5 existing employees with different roles
     * 1 CEO, 1 Branch Manager, 1 HR Manager, 2 Employees
     */
    public function run(): void
    {
        echo "🚀 Creating role-based user accounts for existing employees...\n\n";

        // Get employees without user accounts
        $employees = Employee::whereNull('user_id')
            ->where('status', 'active')
            ->orderBy('id')
            ->take(5)
            ->get();

        if ($employees->count() < 5) {
            echo "❌ Not enough employees without user accounts. Found: " . $employees->count() . "\n";
            echo "ℹ️  Creating accounts for available employees...\n\n";
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

        // Role assignments
        $roleAssignments = [
            ['role' => 'ceo', 'title' => 'CEO'],
            ['role' => 'branch_manager', 'title' => 'Branch Manager'],
            ['role' => 'hr_manager', 'title' => 'HR Manager'],
            ['role' => 'employee', 'title' => 'Employee'],
            ['role' => 'employee', 'title' => 'Employee'],
        ];

        $createdAccounts = [];
        $defaultPassword = 'Password123!';

        foreach ($employees as $index => $employee) {
            if (!isset($roleAssignments[$index])) {
                break;
            }

            $assignment = $roleAssignments[$index];
            $role = $roles[$assignment['role']];

            // Create user account
            $user = User::create([
                'name' => $employee->full_name,
                'email' => $employee->email,
                'password' => Hash::make($defaultPassword),
                'status' => 'active',
                'branch_id' => $employee->branch_id,
                'department_id' => $employee->department_id,
                'manager_id' => $employee->manager_id,
                'primary_role_id' => $role->id,
            ]);

            // Assign role
            $user->assignRole($role);

            // Link employee to user
            $employee->update(['user_id' => $user->id]);

            $createdAccounts[] = [
                'employee_code' => $employee->employee_code,
                'name' => $employee->full_name,
                'email' => $employee->email,
                'role' => $assignment['title'],
                'password' => $defaultPassword,
            ];

            echo "✅ Created account for: {$employee->full_name} ({$employee->employee_code})\n";
            echo "   Role: {$assignment['title']}\n";
            echo "   Email: {$employee->email}\n\n";
        }

        // Display summary
        echo "\n" . str_repeat('=', 80) . "\n";
        echo "🎉 ACCOUNT CREATION SUMMARY\n";
        echo str_repeat('=', 80) . "\n\n";

        foreach ($createdAccounts as $account) {
            echo "👤 {$account['role']}\n";
            echo "   Employee Code: {$account['employee_code']}\n";
            echo "   Name: {$account['name']}\n";
            echo "   Email: {$account['email']}\n";
            echo "   Password: {$account['password']}\n";
            echo "\n";
        }

        echo str_repeat('=', 80) . "\n";
        echo "📝 Total accounts created: " . count($createdAccounts) . "\n";
        echo "🔐 Default password for all accounts: {$defaultPassword}\n";
        echo "⚠️  Users should change their password after first login\n";
        echo str_repeat('=', 80) . "\n";
    }
}
