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

        // Find or create admin role
        $adminRole = Role::where('name', 'admin')->first();
        if (!$adminRole) {
            $adminRole = Role::where('name', 'super-admin')->first();
        }
        
        if ($adminRole && !$user->roles()->where('role_id', $adminRole->id)->exists()) {
            $user->roles()->attach($adminRole->id);
            $this->info("Admin role assigned!");
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
