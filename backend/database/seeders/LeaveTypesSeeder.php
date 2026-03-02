<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LeaveType;

class LeaveTypesSeeder extends Seeder
{
    public function run(): void
    {
        $leaveTypes = [
            [
                'name' => 'Annual Leave',
                'code' => 'ANNUAL',
                'description' => 'Yearly vacation leave for rest and recreation',
                'default_days_per_year' => 25,
                'accrual_method' => 'monthly',
                'accrual_rate' => 2.08, // 25/12
                'is_carry_forward' => true,
                'max_carry_forward_days' => 10,
                'requires_approval' => true,
                'requires_document' => false,
                'min_notice_days' => 7,
                'max_consecutive_days' => 15,
                'is_paid' => true,
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Sick Leave',
                'code' => 'SICK',
                'description' => 'Leave for medical reasons and health recovery',
                'default_days_per_year' => 12,
                'accrual_method' => 'upfront',
                'accrual_rate' => null,
                'is_carry_forward' => false,
                'max_carry_forward_days' => null,
                'requires_approval' => true,
                'requires_document' => true, // Medical certificate required
                'min_notice_days' => 0, // Can be taken immediately
                'max_consecutive_days' => null,
                'is_paid' => true,
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Casual Leave',
                'code' => 'CASUAL',
                'description' => 'Short-term leave for personal matters',
                'default_days_per_year' => 8,
                'accrual_method' => 'pro_rata',
                'accrual_rate' => null,
                'is_carry_forward' => false,
                'max_carry_forward_days' => null,
                'requires_approval' => true,
                'requires_document' => false,
                'min_notice_days' => 1,
                'max_consecutive_days' => 3,
                'is_paid' => true,
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'Maternity Leave',
                'code' => 'MATERNITY',
                'description' => 'Leave for childbirth and postnatal care',
                'default_days_per_year' => 90,
                'accrual_method' => 'per_incident',
                'accrual_rate' => null,
                'is_carry_forward' => false,
                'max_carry_forward_days' => null,
                'requires_approval' => true,
                'requires_document' => true,
                'min_notice_days' => 30,
                'max_consecutive_days' => null,
                'is_paid' => true,
                'is_active' => true,
                'sort_order' => 4,
            ],
            [
                'name' => 'Paternity Leave',
                'code' => 'PATERNITY',
                'description' => 'Leave for fathers following childbirth',
                'default_days_per_year' => 10,
                'accrual_method' => 'per_incident',
                'accrual_rate' => null,
                'is_carry_forward' => false,
                'max_carry_forward_days' => null,
                'requires_approval' => true,
                'requires_document' => true,
                'min_notice_days' => 14,
                'max_consecutive_days' => null,
                'is_paid' => true,
                'is_active' => true,
                'sort_order' => 5,
            ],
            [
                'name' => 'Study Leave',
                'code' => 'STUDY',
                'description' => 'Leave for educational and professional development',
                'default_days_per_year' => 5,
                'accrual_method' => 'per_incident',
                'accrual_rate' => null,
                'is_carry_forward' => false,
                'max_carry_forward_days' => null,
                'requires_approval' => true,
                'requires_document' => true,
                'min_notice_days' => 30,
                'max_consecutive_days' => null,
                'is_paid' => false,
                'is_active' => true,
                'sort_order' => 6,
            ],
            [
                'name' => 'Bereavement Leave',
                'code' => 'BEREAVEMENT',
                'description' => 'Leave for mourning the loss of a family member',
                'default_days_per_year' => 5,
                'accrual_method' => 'per_incident',
                'accrual_rate' => null,
                'is_carry_forward' => false,
                'max_carry_forward_days' => null,
                'requires_approval' => true,
                'requires_document' => true,
                'min_notice_days' => 0,
                'max_consecutive_days' => 5,
                'is_paid' => true,
                'is_active' => true,
                'sort_order' => 7,
            ],
        ];

        foreach ($leaveTypes as $leaveType) {
            LeaveType::updateOrCreate(
                ['code' => $leaveType['code']],
                $leaveType
            );
        }

        $this->command->info('Leave types seeded successfully.');
    }
}
