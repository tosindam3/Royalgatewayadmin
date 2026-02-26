<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Create test user - using only fields that exist in users table
        User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'email' => 'test@example.com',
                'password' => Hash::make('password'),
            ]
        );

        // Create admin user
        User::updateOrCreate(
            ['email' => 'admin@hr360.com'],
            [
                'name' => 'Admin User',
                'email' => 'admin@hr360.com',
                'password' => Hash::make('admin123'),
            ]
        );
    }
}
