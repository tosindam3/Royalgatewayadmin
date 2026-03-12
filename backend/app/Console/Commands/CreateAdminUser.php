<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Role;
use App\Models\EmployeeProfile;
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
        if (User::where('email', $email)->exists()) {
            $this->info('Admin user already exists!');
            return;
        }

        // Create the user
        $user = User::create([
            'name' => 'Admin User',
            'email' => $email,
            'password' => Hash::make($password),
            'status' => 'active',
        ]);

        // Find or create admin role
        $adminRole = Role::where('name', 'admin')->first();
        if (!$adminRole) {
            $adminRole = Role::where('name', 'super-admin')->first();
        }
        
        if ($adminRole) {
            $user->roles()->attach($adminRole->id);
            $this->info("Admin user created successfully!");
            $this->info("Email: {$email}");
            $this->info("Password: {$password}");
        } else {
            $this->error("No admin role found in the system!");
        }
    }
}
