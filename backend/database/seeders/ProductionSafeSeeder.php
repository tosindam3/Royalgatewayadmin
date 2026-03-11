<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductionSafeSeeder extends Seeder
{
    public function run()
    {
        DB::table('roles')->updateOrInsert(
            ['name' => 'Admin'],
            ['created_at' => now(), 'updated_at' => now()]
        );

        DB::table('roles')->updateOrInsert(
            ['name' => 'Manager'],
            ['created_at' => now(), 'updated_at' => now()]
        );

        DB::table('roles')->updateOrInsert(
            ['name' => 'Employee'],
            ['created_at' => now(), 'updated_at' => now()]
        );

        DB::table('settings')->updateOrInsert(
            ['key' => 'app_name'],
            ['value' => 'HR360', 'updated_at' => now()]
        );
    }
}
