<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class AttendanceRolesSeeder extends Seeder
{
    /**
     * Assign attendance roles to test users
     * Note: Roles are already created by RolePermissionSeeder
     */
    public function run(): void
    {
        $this->command->info('🔍 Checking existing roles...');
        
        // Verify roles exist
        $requiredRoles = ['super_admin', 'ceo', 'hr_manager', 'branch_manager', 'department_head', 'employee'];
        $existingRoles = Role::whereIn('name', $requiredRoles)->pluck('name')->toArray();
        
        if (count($existingRoles) < count($requiredRoles)) {
            $this->command->warn('⚠️  Some roles are missing. Please run RolePermissionSeeder first.');
            $this->command->info('Missing roles: ' . implode(', ', array_diff($requiredRoles, $existingRoles)));
            return;
        }
        
        $this->command->info('✅ All required roles exist');
        
        // Assign roles to existing users for testing
        $this->assignTestRoles();
    }

    private function assignTestRoles(): void
    {
        // Find test users
        $users = User::with('employeeProfile', 'roles')->get();

        if ($users->isEmpty()) {
            $this->command->warn('⚠️  No users found. Please seed users first.');
            return;
        }

        foreach ($users as $user) {
            if (!$user->employeeProfile) {
                $this->command->warn("⚠️  User {$user->name} has no employee profile. Skipping...");
                continue;
            }

            // Skip if user already has roles
            if ($user->roles->isNotEmpty()) {
                $this->command->info("ℹ️  User {$user->name} already has roles: " . $user->roles->pluck('display_name')->implode(', '));
                continue;
            }

            // Assign roles based on user ID or other criteria
            $this->assignRoleToUser($user);
        }
    }

    private function assignRoleToUser(User $user): void
    {
        // Assign roles based on user ID for testing
        // Customize this logic based on your test data
        
        $roleToAssign = null;
        
        // First user gets HR Manager role
        if ($user->id === 1) {
            $roleToAssign = Role::where('name', 'hr_manager')->first();
        }
        // Second user gets Branch Manager role
        elseif ($user->id === 2) {
            $roleToAssign = Role::where('name', 'branch_manager')->first();
        }
        // Third user gets Department Head role
        elseif ($user->id === 3) {
            $roleToAssign = Role::where('name', 'department_head')->first();
        }
        // Everyone else gets Employee role
        else {
            $roleToAssign = Role::where('name', 'employee')->first();
        }

        if ($roleToAssign) {
            $user->assignRole($roleToAssign);
            $this->command->info("✅ Assigned {$roleToAssign->display_name} role to {$user->name}");
        }
    }
}
