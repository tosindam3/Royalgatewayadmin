<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Branch;
use Carbon\Carbon;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        $branches = [
            [
                'name' => 'Global HQ',
                'code' => 'HQ-SFO',
                'type' => 'HQ',
                'is_hq' => true,
                'address' => '101 Market St',
                'city' => 'San Francisco',
                'country' => 'USA',
                'location' => 'San Francisco, CA',
                'timezone' => 'America/Los_Angeles',
                'status' => 'active',
                'employee_count' => 0,
                'device_count' => 4,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Tech North',
                'code' => 'REG-SEA',
                'type' => 'Regional',
                'is_hq' => false,
                'address' => '5th Ave & Pine',
                'city' => 'Seattle',
                'country' => 'USA',
                'location' => 'Seattle, WA',
                'timezone' => 'America/Los_Angeles',
                'status' => 'active',
                'employee_count' => 0,
                'device_count' => 2,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Lagos Branch',
                'code' => 'SAT-LAG',
                'type' => 'Satellite',
                'is_hq' => false,
                'address' => 'Victoria Island',
                'city' => 'Lagos',
                'country' => 'Nigeria',
                'location' => 'Lagos, Nigeria',
                'timezone' => 'Africa/Lagos',
                'status' => 'active',
                'employee_count' => 0,
                'device_count' => 3,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'London Office',
                'code' => 'SAT-LON',
                'type' => 'Regional',
                'is_hq' => false,
                'address' => 'The Shard',
                'city' => 'London',
                'country' => 'UK',
                'location' => 'London, UK',
                'timezone' => 'Europe/London',
                'status' => 'inactive',
                'employee_count' => 0,
                'device_count' => 0,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
        ];

        foreach ($branches as $branchData) {
            Branch::updateOrCreate(
                ['code' => $branchData['code']],
                $branchData
            );
        }
    }
}
