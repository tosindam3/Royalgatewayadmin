<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     * BLOCKED in production — dev/staging only.
     */
    public function run(): void
    {
        if (app()->environment('production')) {
            $this->command->error('DatabaseSeeder is blocked in production. Use ProductionSafeSeeder for production-safe data only.');
            return;
        }

        $this->call([
            UserSeeder::class,
            EmployeeSeeder::class,
            PerformanceConfigSeeder::class,
        ]);
    }
}
