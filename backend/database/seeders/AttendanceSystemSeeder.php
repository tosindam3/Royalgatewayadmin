<?php

namespace Database\Seeders;

use App\Models\Workplace;
use App\Models\WorkSchedule;
use App\Models\BiometricDevice;
use Illuminate\Database\Seeder;

class AttendanceSystemSeeder extends Seeder
{
    public function run(): void
    {
        // Create work schedules
        $schedule = WorkSchedule::create([
            'name' => 'Standard 9-5',
            'check_in_time' => '09:00:00',
            'check_out_time' => '17:00:00',
            'grace_period_minutes' => 15,
            'working_days' => [1, 2, 3, 4, 5], // Monday to Friday
            'is_active' => true,
        ]);

        WorkSchedule::create([
            'name' => 'Shift 8-4',
            'check_in_time' => '08:00:00',
            'check_out_time' => '16:00:00',
            'grace_period_minutes' => 10,
            'working_days' => [1, 2, 3, 4, 5],
            'is_active' => true,
        ]);

        // Create workplaces
        $hqWorkplace = Workplace::create([
            'name' => 'Headquarters',
            'latitude' => 6.5244,
            'longitude' => 3.3792,
            'radius_meters' => 100,
            'is_active' => true,
        ]);

        $branchWorkplace = Workplace::create([
            'name' => 'Victoria Island Branch',
            'latitude' => 6.4281,
            'longitude' => 3.4219,
            'radius_meters' => 150,
            'is_active' => true,
        ]);

        // Create biometric devices
        BiometricDevice::create([
            'device_name' => 'HQ Main Entrance',
            'device_serial' => 'ZK001',
            'ip_address' => '192.168.1.100',
            'port' => 4370,
            'location' => 'Main Building Entrance',
            'workplace_id' => $hqWorkplace->id,
            'is_active' => true,
        ]);

        BiometricDevice::create([
            'device_name' => 'VI Branch Entrance',
            'device_serial' => 'ZK002',
            'ip_address' => '192.168.1.101',
            'port' => 4370,
            'location' => 'Branch Office Entrance',
            'workplace_id' => $branchWorkplace->id,
            'is_active' => true,
        ]);

        $this->command->info('✓ Attendance system seeded successfully');
    }
}
