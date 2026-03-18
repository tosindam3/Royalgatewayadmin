<?php

namespace Database\Seeders;

use App\Models\PerformanceConfig;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * EmployeeEvaluationSeeder
 *
 * Seeds the global employee evaluation template used by the performance module.
 * Safe to run in production — idempotent (skips if already present).
 *
 * Scope: global (fallback for all employees without a department-specific config)
 * Status: published (immediately visible to staff)
 */
class EmployeeEvaluationSeeder extends Seeder
{
    public function run(): void
    {
        // Idempotency guard — do not duplicate
        if (PerformanceConfig::where('scope', 'global')->where('status', 'published')->exists()) {
            $this->command->info('Employee evaluation config already exists. Skipping.');
            return;
        }

        $admin = User::whereHas('roles', fn($q) => $q->where('name', 'super_admin'))->first()
            ?? User::whereHas('primaryRole', fn($q) => $q->where('name', 'admin'))->first()
            ?? User::first();

        if (!$admin) {
            $this->command->error('No admin user found. Cannot seed employee evaluation config.');
            return;
        }

        PerformanceConfig::create([
            'name'           => 'General Employee Evaluation',
            'description'    => 'Standard evaluation template applied to all employees. Used as the global fallback when no department-specific config is assigned.',
            'scope'          => 'global',
            'status'         => 'published',
            'is_active'      => true,
            'published_at'   => now(),
            'created_by'     => $admin->id,
            'sections'       => [
                [
                    'id'          => 'work_quality',
                    'title'       => 'Work Quality',
                    'description' => 'Accuracy, consistency, and timeliness of output.',
                    'weight'      => 30,
                    'required'    => true,
                    'fields'      => [
                        ['id' => 'accuracy',     'label' => 'Accuracy & Attention to Detail', 'type' => 'rating', 'max' => 10, 'required' => true,  'scoreable' => true, 'weight' => 34],
                        ['id' => 'consistency',  'label' => 'Consistency of Output',          'type' => 'rating', 'max' => 10, 'required' => true,  'scoreable' => true, 'weight' => 33],
                        ['id' => 'deadlines',    'label' => 'Meeting Deadlines',              'type' => 'rating', 'max' => 10, 'required' => true,  'scoreable' => true, 'weight' => 33],
                    ],
                ],
                [
                    'id'          => 'teamwork',
                    'title'       => 'Teamwork & Communication',
                    'description' => 'Collaboration, communication, and conflict resolution.',
                    'weight'      => 25,
                    'required'    => true,
                    'fields'      => [
                        ['id' => 'collaboration',       'label' => 'Collaboration',        'type' => 'rating', 'max' => 10, 'required' => true,  'scoreable' => true, 'weight' => 40],
                        ['id' => 'communication',       'label' => 'Communication Skills', 'type' => 'rating', 'max' => 10, 'required' => true,  'scoreable' => true, 'weight' => 40],
                        ['id' => 'conflict_resolution', 'label' => 'Conflict Resolution',  'type' => 'rating', 'max' => 5,  'required' => false, 'scoreable' => true, 'weight' => 20],
                    ],
                ],
                [
                    'id'          => 'initiative',
                    'title'       => 'Initiative & Growth',
                    'description' => 'Proactiveness, learning, and problem-solving ability.',
                    'weight'      => 25,
                    'required'    => true,
                    'fields'      => [
                        ['id' => 'proactiveness',  'label' => 'Proactiveness',          'type' => 'rating', 'max' => 10, 'required' => true,  'scoreable' => true, 'weight' => 40],
                        ['id' => 'learning',       'label' => 'Learning & Development', 'type' => 'rating', 'max' => 10, 'required' => true,  'scoreable' => true, 'weight' => 40],
                        ['id' => 'problem_solving','label' => 'Problem Solving',        'type' => 'rating', 'max' => 5,  'required' => false, 'scoreable' => true, 'weight' => 20],
                    ],
                ],
                [
                    'id'          => 'attendance',
                    'title'       => 'Attendance & Punctuality',
                    'description' => 'On-time attendance and overall reliability.',
                    'weight'      => 20,
                    'required'    => true,
                    'fields'      => [
                        ['id' => 'on_time',    'label' => 'On-time Attendance', 'type' => 'rating', 'max' => 10, 'required' => true, 'scoreable' => true, 'weight' => 50],
                        ['id' => 'reliability','label' => 'Reliability',        'type' => 'rating', 'max' => 10, 'required' => true, 'scoreable' => true, 'weight' => 50],
                    ],
                ],
                [
                    'id'       => 'comments',
                    'title'    => 'Additional Comments',
                    'weight'   => 0,
                    'required' => false,
                    'fields'   => [
                        ['id' => 'strengths',    'label' => 'Key Strengths',           'type' => 'textarea', 'required' => false, 'scoreable' => false, 'placeholder' => 'Describe key strengths...', 'rows' => 3],
                        ['id' => 'improvements', 'label' => 'Areas for Improvement',   'type' => 'textarea', 'required' => false, 'scoreable' => false, 'placeholder' => 'Describe areas to improve...', 'rows' => 3],
                    ],
                ],
            ],
            'scoring_config' => [
                'method'     => 'weighted',
                'max_score'  => 100,
                'pass_score' => 60,
                'ratingThresholds' => [
                    ['min' => 90, 'max' => 100, 'label' => 'Exceptional',       'color' => 'text-green-700',  'bgColor' => 'bg-green-50',  'borderColor' => 'border-green-400'],
                    ['min' => 75, 'max' => 89,  'label' => 'Excellent',         'color' => 'text-blue-600',   'bgColor' => 'bg-blue-50',   'borderColor' => 'border-blue-300'],
                    ['min' => 60, 'max' => 74,  'label' => 'Satisfactory',      'color' => 'text-yellow-600', 'bgColor' => 'bg-yellow-50', 'borderColor' => 'border-yellow-300'],
                    ['min' => 0,  'max' => 59,  'label' => 'Needs Improvement', 'color' => 'text-red-600',    'bgColor' => 'bg-red-50',    'borderColor' => 'border-red-300'],
                ],
            ],
        ]);

        $this->command->info('✓ Employee evaluation config seeded (global, published).');
    }
}
