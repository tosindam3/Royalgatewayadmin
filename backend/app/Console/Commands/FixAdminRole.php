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

        // Find users to fix
        $email = $this->option('email');
        $query = User::with(['roles', 'primaryRole']);

        if ($email) {
            $query->where('email', $email);
        } else {
            // Fix users who have no primary role — including those relying on legacy 'role' column
            $query->where(function ($q) {
                $q->whereNull('primary_role_id')
                  ->orWhereHas('primaryRole', function ($r) {
                      $r->whereNotIn('name', ['super_admin', 'admin', 'ceo', 'hr_manager', 'branch_manager', 'department_head', 'employee']);
                  });
            });
        }

        $users = $query->get();

        if ($users->isEmpty()) {
            // If email specified, just fix that user directly
            if ($email) {
                $user = User::where('email', $email)->first();
                if (!$user) {
                    $this->error("User not found: {$email}");
                    return 1;
                }
                $users = collect([$user]);
            } else {
                $this->warn("No users found needing role fix.");
                return 0;
            }
        }

        foreach ($users as $user) {
            $this->line("Processing: {$user->email}");

            // Determine the right role — check pivot first, then legacy column
            $targetRole = $superAdminRole;

            $existingRole = $user->roles->first();
            if ($existingRole && in_array($existingRole->name, ['super_admin', 'admin', 'ceo', 'hr_manager'])) {
                $targetRole = $existingRole;
            } elseif ($user->role && in_array($user->role, ['super_admin', 'admin', 'ceo', 'hr_manager'])) {
                $legacyRole = Role::where('name', $user->role)->first();
                if ($legacyRole) $targetRole = $legacyRole;
            }

            // Set primary_role_id and legacy role column
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

            $this->info("  ✅ Set primary role to '{$targetRole->name}' for {$user->email}");
        }

        $this->info("\nDone. Run 'php artisan optimize:clear' to clear any cached user data.");
        return 0;
    }
}
