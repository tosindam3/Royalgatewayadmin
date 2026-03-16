<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;

class FixAdminRole extends Command
{
    protected $signature = 'fix:admin-role {--email= : Email of the user to fix (defaults to all admins)}';
    protected $description = 'Fix admin user role assignment so management dashboard shows correctly';

    public function handle()
    {
        // Ensure super_admin role exists with all permissions
        $superAdminRole = Role::updateOrCreate(
            ['name' => 'super_admin'],
            [
                'display_name' => 'Super Administrator',
                'description' => 'Full system access with all permissions',
                'default_scope' => 'all',
                'is_system' => true,
                'is_active' => true,
            ]
        );

        // Assign all permissions to super_admin role
        $allPermissions = Permission::all();
        $syncData = [];
        foreach ($allPermissions as $permission) {
            $syncData[$permission->id] = ['scope_level' => 'all'];
        }
        $superAdminRole->permissions()->sync($syncData);
        $this->info("✅ super_admin role has " . count($syncData) . " permissions.");

        $email = $this->option('email');

        // Build the user list to fix
        if ($email) {
            $users = User::with(['roles', 'primaryRole'])->where('email', $email)->get();
            if ($users->isEmpty()) {
                $this->error("User not found: {$email}");
                return 1;
            }
        } else {
            // Catch ALL cases:
            // 1. No primary_role_id set
            // 2. primary_role_id points to a non-existent role (orphaned FK)
            // 3. Has a privileged role column value but no pivot entry
            $users = User::with(['roles', 'primaryRole'])
                ->where(function ($q) {
                    $q->whereNull('primary_role_id')
                      ->orWhereDoesntHave('primaryRole')
                      ->orWhereNull('role')
                      ->orWhere('role', '')
                      ->orWhereHas('primaryRole', function ($r) {
                          $r->whereNotIn('name', [
                              'super_admin', 'admin', 'ceo', 'hr_manager',
                              'branch_manager', 'department_head', 'employee'
                          ]);
                      });
                })
                ->get();

            // Also always include known admin emails regardless of above conditions
            $adminEmails = ['admin@hr360.com', 'superadmin@hr360.com'];
            $adminUsers = User::with(['roles', 'primaryRole'])
                ->whereIn('email', $adminEmails)
                ->get();

            $users = $users->merge($adminUsers)->unique('id');
        }

        if ($users->isEmpty()) {
            $this->warn("No users found needing role fix.");
            return 0;
        }

        foreach ($users as $user) {
            $this->line("Processing: {$user->email}");

            // Determine the right role:
            // 1. Check existing pivot roles
            // 2. Fall back to role column
            // 3. Default to super_admin for admin emails, employee otherwise
            $targetRole = null;

            $existingPivotRole = $user->roles->first();
            if ($existingPivotRole && in_array($existingPivotRole->name, ['super_admin', 'admin', 'ceo', 'hr_manager', 'branch_manager', 'department_head'])) {
                $targetRole = $existingPivotRole;
            } elseif ($user->role) {
                $targetRole = Role::where('name', $user->role)->first();
            }

            // Final fallback
            if (!$targetRole) {
                $adminEmails = ['admin@hr360.com', 'superadmin@hr360.com'];
                $targetRole = in_array($user->email, $adminEmails)
                    ? $superAdminRole
                    : Role::where('name', 'employee')->first() ?? $superAdminRole;
            }

            // Set primary_role_id and role column
            $user->primary_role_id = $targetRole->id;
            $user->role = $targetRole->name;
            $user->save();

            // Ensure pivot entry exists
            if (!$user->roles()->where('roles.id', $targetRole->id)->exists()) {
                $user->roles()->attach($targetRole->id, [
                    'assigned_by' => $user->id,
                    'assigned_at' => now(),
                ]);
            }

            $this->info("  ✅ {$user->email} → role: '{$targetRole->name}' (primary_role_id: {$targetRole->id})");
        }

        $this->info("\nDone.");
        return 0;
    }

}
