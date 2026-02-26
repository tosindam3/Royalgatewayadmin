<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\OrganizationSetting;

class AttendanceSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // Working Hours
            [
                'key' => 'attendance.work_start_time',
                'value' => json_encode('09:00'),
                'type' => 'time',
            ],
            [
                'key' => 'attendance.work_end_time',
                'value' => json_encode('17:00'),
                'type' => 'time',
            ],
            [
                'key' => 'attendance.work_hours_per_day',
                'value' => json_encode(8),
                'type' => 'integer',
            ],
            
            // Grace Period
            [
                'key' => 'attendance.grace_period_minutes',
                'value' => json_encode(15),
                'type' => 'integer',
            ],
            
            // Working Days (1 = Monday, 7 = Sunday)
            [
                'key' => 'attendance.working_days',
                'value' => json_encode([1, 2, 3, 4, 5]), // Monday to Friday
                'type' => 'array',
            ],
            
            // Break Time
            [
                'key' => 'attendance.break_duration_minutes',
                'value' => json_encode(60),
                'type' => 'integer',
            ],
            
            // Overtime
            [
                'key' => 'attendance.overtime_enabled',
                'value' => json_encode(true),
                'type' => 'boolean',
            ],
            [
                'key' => 'attendance.overtime_threshold_minutes',
                'value' => json_encode(480), // After 8 hours
                'type' => 'integer',
            ],
            
            // Late Policy
            [
                'key' => 'attendance.late_marking_enabled',
                'value' => json_encode(true),
                'type' => 'boolean',
            ],
            [
                'key' => 'attendance.late_after_grace_period',
                'value' => json_encode(true),
                'type' => 'boolean',
            ],
            
            // Early Departure
            [
                'key' => 'attendance.early_departure_threshold_minutes',
                'value' => json_encode(30),
                'type' => 'integer',
            ],
            
            // Geofence
            [
                'key' => 'attendance.geofence_required',
                'value' => json_encode(false),
                'type' => 'boolean',
            ],
            
            // Auto Clock-out
            [
                'key' => 'attendance.auto_clock_out_enabled',
                'value' => json_encode(false),
                'type' => 'boolean',
            ],
            [
                'key' => 'attendance.auto_clock_out_time',
                'value' => json_encode('18:00'),
                'type' => 'time',
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

        $this->command->info('✅ Attendance settings seeded successfully');
    }
}
