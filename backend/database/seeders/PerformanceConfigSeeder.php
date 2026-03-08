<?php

namespace Database\Seeders;

use App\Models\PerformanceConfig;
use App\Models\Department;
use App\Models\User;
use Illuminate\Database\Seeder;

class PerformanceConfigSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::whereHas('roles', function ($q) {
            $q->where('name', 'super_admin');
        })->first();

        if (!$admin) {
            $this->command->warn('No super admin found. Skipping performance config seeding.');
            return;
        }

        // Get existing departments
        $departments = [
            'Engineering' => Department::where('code', 'DEPT-ENG')->first(),
            'Marketing' => Department::where('code', 'DEPT-MKT')->first(),
            'Human Resources' => Department::where('code', 'DEPT-HR')->first(),
            'Sales' => Department::where('code', 'DEPT-SAL')->first(),
            'Product' => Department::where('code', 'DEPT-PRD')->first(),
            'IT' => Department::where('code', 'DEPT-IT')->first(),
            'Operations' => Department::where('code', 'DEPT-OPS')->first(),
        ];

        // Sales Department Config
        if ($departments['Sales']) {
            PerformanceConfig::create([
                'department_id' => $departments['Sales']->id,
                'name' => 'Sales Weekly Performance',
                'description' => 'Weekly performance tracking for sales team',
                'sections' => [
                    [
                        'id' => 'sales_metrics',
                        'title' => 'Sales Metrics',
                        'description' => 'Track your sales performance',
                        'required' => true,
                        'fields' => [
                            [
                                'id' => 'revenue',
                                'label' => 'Revenue Generated',
                                'type' => 'currency',
                                'required' => true,
                                'scoreable' => true,
                                'target' => 500000,
                                'weight' => 40,
                                'placeholder' => 'Enter revenue amount',
                            ],
                            [
                                'id' => 'new_clients',
                                'label' => 'New Clients Acquired',
                                'type' => 'number',
                                'required' => true,
                                'scoreable' => true,
                                'target' => 5,
                                'weight' => 30,
                                'min' => 0,
                            ],
                            [
                                'id' => 'meetings',
                                'label' => 'Client Meetings',
                                'type' => 'number',
                                'required' => true,
                                'scoreable' => true,
                                'target' => 10,
                                'weight' => 20,
                                'min' => 0,
                            ],
                        ],
                    ],
                    [
                        'id' => 'quality_metrics',
                        'title' => 'Quality & Satisfaction',
                        'required' => false,
                        'fields' => [
                            [
                                'id' => 'client_satisfaction',
                                'label' => 'Client Satisfaction Rating',
                                'type' => 'rating',
                                'required' => true,
                                'scoreable' => true,
                                'weight' => 10,
                                'max' => 5,
                            ],
                        ],
                    ],
                    [
                        'id' => 'notes',
                        'title' => 'Additional Notes',
                        'required' => false,
                        'fields' => [
                            [
                                'id' => 'achievements',
                                'label' => 'Key Achievements',
                                'type' => 'textarea',
                                'required' => false,
                                'placeholder' => 'Describe your key achievements this week...',
                                'rows' => 4,
                            ],
                            [
                                'id' => 'challenges',
                                'label' => 'Challenges Faced',
                                'type' => 'textarea',
                                'required' => false,
                                'placeholder' => 'Describe any challenges you faced...',
                                'rows' => 4,
                            ],
                        ],
                    ],
                ],
                'scoring_config' => [
                    'method' => 'weighted',
                    'ratingThresholds' => [
                        ['min' => 90, 'max' => 100, 'label' => 'Exceptional', 'color' => 'text-green-600', 'bgColor' => 'bg-green-50', 'borderColor' => 'border-green-300'],
                        ['min' => 80, 'max' => 89, 'label' => 'Excellent', 'color' => 'text-blue-600', 'bgColor' => 'bg-blue-50', 'borderColor' => 'border-blue-300'],
                        ['min' => 70, 'max' => 79, 'label' => 'Very Good', 'color' => 'text-cyan-600', 'bgColor' => 'bg-cyan-50', 'borderColor' => 'border-cyan-300'],
                        ['min' => 60, 'max' => 69, 'label' => 'Good', 'color' => 'text-yellow-600', 'bgColor' => 'bg-yellow-50', 'borderColor' => 'border-yellow-300'],
                        ['min' => 50, 'max' => 59, 'label' => 'Fair', 'color' => 'text-orange-600', 'bgColor' => 'bg-orange-50', 'borderColor' => 'border-orange-300'],
                        ['min' => 0, 'max' => 49, 'label' => 'Needs Improvement', 'color' => 'text-red-600', 'bgColor' => 'bg-red-50', 'borderColor' => 'border-red-300'],
                    ],
                ],
                'is_active' => true,
                'created_by' => $admin->id,
            ]);
            $this->command->info('✓ Created Sales performance config');
        }

        // Marketing Department Config
        if ($departments['Marketing']) {
            PerformanceConfig::create([
                'department_id' => $departments['Marketing']->id,
                'name' => 'Marketing Weekly Performance',
                'description' => 'Weekly performance tracking for marketing team',
                'sections' => [
                    [
                        'id' => 'campaign_metrics',
                        'title' => 'Campaign Metrics',
                        'required' => true,
                        'fields' => [
                            [
                                'id' => 'campaigns_launched',
                                'label' => 'Campaigns Launched',
                                'type' => 'number',
                                'required' => true,
                                'scoreable' => true,
                                'target' => 3,
                                'weight' => 30,
                                'min' => 0,
                            ],
                            [
                                'id' => 'leads_generated',
                                'label' => 'Leads Generated',
                                'type' => 'number',
                                'required' => true,
                                'scoreable' => true,
                                'target' => 50,
                                'weight' => 40,
                                'min' => 0,
                            ],
                            [
                                'id' => 'conversion_rate',
                                'label' => 'Conversion Rate',
                                'type' => 'percentage',
                                'required' => true,
                                'scoreable' => true,
                                'target' => 15,
                                'weight' => 30,
                                'min' => 0,
                                'max' => 100,
                            ],
                        ],
                    ],
                ],
                'scoring_config' => [
                    'method' => 'weighted',
                    'ratingThresholds' => [
                        ['min' => 90, 'max' => 100, 'label' => 'Exceptional', 'color' => 'text-green-600', 'bgColor' => 'bg-green-50', 'borderColor' => 'border-green-300'],
                        ['min' => 80, 'max' => 89, 'label' => 'Excellent', 'color' => 'text-blue-600', 'bgColor' => 'bg-blue-50', 'borderColor' => 'border-blue-300'],
                        ['min' => 70, 'max' => 79, 'label' => 'Very Good', 'color' => 'text-cyan-600', 'bgColor' => 'bg-cyan-50', 'borderColor' => 'border-cyan-300'],
                        ['min' => 60, 'max' => 69, 'label' => 'Good', 'color' => 'text-yellow-600', 'bgColor' => 'bg-yellow-50', 'borderColor' => 'border-yellow-300'],
                        ['min' => 50, 'max' => 59, 'label' => 'Fair', 'color' => 'text-orange-600', 'bgColor' => 'bg-orange-50', 'borderColor' => 'border-orange-300'],
                        ['min' => 0, 'max' => 49, 'label' => 'Needs Improvement', 'color' => 'text-red-600', 'bgColor' => 'bg-red-50', 'borderColor' => 'border-red-300'],
                    ],
                ],
                'is_active' => true,
                'created_by' => $admin->id,
            ]);
            $this->command->info('✓ Created Marketing performance config');
        }

        // Engineering Department Config
        if ($departments['Engineering']) {
            PerformanceConfig::create([
                'department_id' => $departments['Engineering']->id,
                'name' => 'Engineering Weekly Performance',
                'description' => 'Weekly performance tracking for engineering team',
                'sections' => [
                    [
                        'id' => 'development_metrics',
                        'title' => 'Development Metrics',
                        'required' => true,
                        'fields' => [
                            [
                                'id' => 'tasks_completed',
                                'label' => 'Tasks Completed',
                                'type' => 'number',
                                'required' => true,
                                'scoreable' => true,
                                'target' => 10,
                                'weight' => 40,
                                'min' => 0,
                            ],
                            [
                                'id' => 'code_quality',
                                'label' => 'Code Quality Rating',
                                'type' => 'rating',
                                'required' => true,
                                'scoreable' => true,
                                'weight' => 30,
                                'max' => 5,
                            ],
                            [
                                'id' => 'bugs_fixed',
                                'label' => 'Bugs Fixed',
                                'type' => 'number',
                                'required' => true,
                                'scoreable' => true,
                                'target' => 5,
                                'weight' => 30,
                                'min' => 0,
                            ],
                        ],
                    ],
                ],
                'scoring_config' => [
                    'method' => 'weighted',
                    'ratingThresholds' => [
                        ['min' => 90, 'max' => 100, 'label' => 'Exceptional', 'color' => 'text-green-600', 'bgColor' => 'bg-green-50', 'borderColor' => 'border-green-300'],
                        ['min' => 80, 'max' => 89, 'label' => 'Excellent', 'color' => 'text-blue-600', 'bgColor' => 'bg-blue-50', 'borderColor' => 'border-blue-300'],
                        ['min' => 70, 'max' => 79, 'label' => 'Very Good', 'color' => 'text-cyan-600', 'bgColor' => 'bg-cyan-50', 'borderColor' => 'border-cyan-300'],
                        ['min' => 60, 'max' => 69, 'label' => 'Good', 'color' => 'text-yellow-600', 'bgColor' => 'bg-yellow-50', 'borderColor' => 'border-yellow-300'],
                        ['min' => 50, 'max' => 59, 'label' => 'Fair', 'color' => 'text-orange-600', 'bgColor' => 'bg-orange-50', 'borderColor' => 'border-orange-300'],
                        ['min' => 0, 'max' => 49, 'label' => 'Needs Improvement', 'color' => 'text-red-600', 'bgColor' => 'bg-red-50', 'borderColor' => 'border-red-300'],
                    ],
                ],
                'is_active' => true,
                'created_by' => $admin->id,
            ]);
            $this->command->info('✓ Created Engineering performance config');
        }

        // HR Department Config
        if ($departments['Human Resources']) {
            PerformanceConfig::create([
                'department_id' => $departments['Human Resources']->id,
                'name' => 'HR Weekly Performance',
                'description' => 'Weekly performance tracking for HR team',
                'sections' => [
                    [
                        'id' => 'recruitment',
                        'title' => 'Recruitment Metrics',
                        'required' => true,
                        'fields' => [
                            [
                                'id' => 'positions_filled',
                                'label' => 'Positions Filled',
                                'type' => 'number',
                                'required' => true,
                                'scoreable' => true,
                                'target' => 3,
                                'weight' => 40,
                                'min' => 0,
                            ],
                            [
                                'id' => 'interviews_conducted',
                                'label' => 'Interviews Conducted',
                                'type' => 'number',
                                'required' => true,
                                'scoreable' => true,
                                'target' => 10,
                                'weight' => 30,
                                'min' => 0,
                            ],
                            [
                                'id' => 'issues_resolved',
                                'label' => 'Employee Issues Resolved',
                                'type' => 'number',
                                'required' => true,
                                'scoreable' => true,
                                'target' => 5,
                                'weight' => 30,
                                'min' => 0,
                            ],
                        ],
                    ],
                ],
                'scoring_config' => [
                    'method' => 'weighted',
                    'ratingThresholds' => [
                        ['min' => 90, 'max' => 100, 'label' => 'Exceptional', 'color' => 'text-green-600', 'bgColor' => 'bg-green-50', 'borderColor' => 'border-green-300'],
                        ['min' => 80, 'max' => 89, 'label' => 'Excellent', 'color' => 'text-blue-600', 'bgColor' => 'bg-blue-50', 'borderColor' => 'border-blue-300'],
                        ['min' => 70, 'max' => 79, 'label' => 'Very Good', 'color' => 'text-cyan-600', 'bgColor' => 'bg-cyan-50', 'borderColor' => 'border-cyan-300'],
                        ['min' => 60, 'max' => 69, 'label' => 'Good', 'color' => 'text-yellow-600', 'bgColor' => 'bg-yellow-50', 'borderColor' => 'border-yellow-300'],
                        ['min' => 50, 'max' => 59, 'label' => 'Fair', 'color' => 'text-orange-600', 'bgColor' => 'bg-orange-50', 'borderColor' => 'border-orange-300'],
                        ['min' => 0, 'max' => 49, 'label' => 'Needs Improvement', 'color' => 'text-red-600', 'bgColor' => 'bg-red-50', 'borderColor' => 'border-red-300'],
                    ],
                ],
                'is_active' => true,
                'created_by' => $admin->id,
            ]);
            $this->command->info('✓ Created HR performance config');
        }

        $this->command->info('Performance configurations seeded successfully!');
    }
}
