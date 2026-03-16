<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Role;
use App\Models\Employee;
use Illuminate\Support\Facades\Hash;

class CreateAdminUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'create:admin-user';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create admin user for local development';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = 'admin@hr360.com';
        $password = 'admin123';
        
        // Check if user already exists
        $user = User::where('email', $email)->first();
        if (!$user) {
            // Create the user
            $user = User::create([
                'name' => 'Admin User',
                'email' => $email,
                'password' => Hash::make($password),
                'status' => 'active',
            ]);
            $this->info("Admin user created successfully!");
        } else {
            $this->info('Admin user already exists!');
        }

        // Find super_admin role (created by RolePermissionSeeder)
        $adminRole = Role::whereIn('name', ['super_admin', 'admin', 'super-admin'])->first();

        if (!$adminRole) {
            $this->warn("No admin role found. Creating super_admin role...");
            $adminRole = Role::create([
                'name' => 'super_admin',
                'display_name' => 'Super Administrator',
                'description' => 'Full system access with all permissions',
                'default_scope' => 'all',
                'is_system' => true,
                'is_active' => true,
            ]);
        }

        if ($adminRole) {
            // Set as primary role
            $user->primary_role_id = $adminRole->id;
            $user->save();

            // Also attach to roles pivot if not already there
            if (!$user->roles()->where('roles.id', $adminRole->id)->exists()) {
                $user->roles()->attach($adminRole->id, [
                    'assigned_by' => $user->id,
                    'assigned_at' => now(),
                ]);
            }
            $this->info("Super admin role assigned and set as primary role!");
        }

        // Create employee profile if it doesn't exist
        if (!$user->employeeProfile) {
            Employee::create([
                'user_id' => $user->id,
                'employee_code' => 'ADMIN-001',
                'first_name' => 'Admin',
                'last_name' => 'User',
                'email' => $email,
                'phone' => '+1-555-0000',
                'branch_id' => 1, // First branch
                'department_id' => 1, // First department
                'designation_id' => 1, // First designation
                'employment_type' => 'full-time',
                'work_mode' => 'onsite',
                'status' => 'active',
                'hire_date' => now(),
                'dob' => now()->subYears(30),
                'allow_mobile_checkin' => true,
                'password_change_required' => false,
            ]);
            $this->info("Employee profile created!");
        } else {
            $this->info("Employee profile already exists!");
        }

        $this->info("Email: {$email}");
        $this->info("Password: {$password}");
    }
}
