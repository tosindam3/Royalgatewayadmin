<?php

namespace Database\Seeders;

use App\Models\OrganizationSetting;
use Illuminate\Database\Seeder;

class BrandSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            [
                'key' => 'brand.company_name',
                'value' => 'HR360',
                'type' => 'string',
            ],
            [
                'key' => 'brand.logo_url',
                'value' => '',
                'type' => 'string',
            ],
            [
                'key' => 'brand.primary_color',
                'value' => '#8252e9',
                'type' => 'string',
            ],
        ];

        foreach ($settings as $setting) {
            OrganizationSetting::updateOrCreate(
                ['key' => $setting['key']],
                [
                    'value' => $setting['value'],
                    'type' => $setting['type'],
                ]
            );
        }

        $this->command->info('Brand settings seeded successfully!');
    }
}
