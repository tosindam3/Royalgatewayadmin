<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Holiday;
use App\Models\Branch;

class HolidaysSeeder extends Seeder
{
    public function run(): void
    {
        $currentYear = now()->year;
        
        // Global holidays
        $globalHolidays = [
            ['name' => 'New Year\'s Day', 'date' => "{$currentYear}-01-01", 'description' => 'Mandatory non-working day across all branches'],
            ['name' => 'Good Friday', 'date' => "{$currentYear}-03-29", 'description' => 'Christian holiday observed globally'],
            ['name' => 'Easter Monday', 'date' => "{$currentYear}-04-01", 'description' => 'Day after Easter Sunday'],
            ['name' => 'Labor Day', 'date' => "{$currentYear}-05-01", 'description' => 'International Workers\' Day'],
            ['name' => 'Christmas Day', 'date' => "{$currentYear}-12-25", 'description' => 'Year-end holiday closure'],
            ['name' => 'Boxing Day', 'date' => "{$currentYear}-12-26", 'description' => 'Day after Christmas'],
        ];
        
        foreach ($globalHolidays as $holiday) {
            Holiday::updateOrCreate(
                [
                    'date' => $holiday['date'],
                    'type' => 'global',
                ],
                [
                    'name' => $holiday['name'],
                    'year' => $currentYear,
                    'description' => $holiday['description'],
                    'is_mandatory' => true,
                    'is_recurring' => true,
                ]
            );
        }
        
        // US-specific holidays
        $usBranches = Branch::where('location', 'like', '%USA%')
            ->orWhere('location', 'like', '%United States%')
            ->orWhere('location', 'like', '%CA%')
            ->orWhere('location', 'like', '%WA%')
            ->get();
        
        $usHolidays = [
            ['name' => 'Independence Day', 'date' => "{$currentYear}-07-04", 'description' => 'US Independence Day'],
            ['name' => 'Thanksgiving', 'date' => "{$currentYear}-11-28", 'description' => 'US Thanksgiving Day'],
        ];
        
        foreach ($usBranches as $branch) {
            foreach ($usHolidays as $holiday) {
                Holiday::updateOrCreate(
                    [
                        'date' => $holiday['date'],
                        'type' => 'branch_specific',
                        'branch_id' => $branch->id,
                    ],
                    [
                        'name' => $holiday['name'],
                        'year' => $currentYear,
                        'description' => $holiday['description'],
                        'is_mandatory' => true,
                        'is_recurring' => true,
                    ]
                );
            }
        }
        
        // Nigeria-specific holidays
        $nigeriaBranches = Branch::where('location', 'like', '%Nigeria%')
            ->orWhere('location', 'like', '%Lagos%')
            ->get();
        
        $nigeriaHolidays = [
            ['name' => 'Independence Day', 'date' => "{$currentYear}-10-01", 'description' => 'Nigeria Independence Day'],
            ['name' => 'Democracy Day', 'date' => "{$currentYear}-06-12", 'description' => 'Nigeria Democracy Day'],
        ];
        
        foreach ($nigeriaBranches as $branch) {
            foreach ($nigeriaHolidays as $holiday) {
                Holiday::updateOrCreate(
                    [
                        'date' => $holiday['date'],
                        'type' => 'branch_specific',
                        'branch_id' => $branch->id,
                    ],
                    [
                        'name' => $holiday['name'],
                        'year' => $currentYear,
                        'description' => $holiday['description'],
                        'is_mandatory' => true,
                        'is_recurring' => true,
                    ]
                );
            }
        }
        
        $this->command->info('Holidays seeded successfully.');
    }
}
