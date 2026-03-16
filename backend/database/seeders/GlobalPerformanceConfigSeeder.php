<?php

namespace Database\Seeders;

use App\Models\PerformanceConfig;
use App\Models\User;
use Illuminate\Database\Seeder;

class GlobalPerformanceConfigSeeder extends Seeder
{
    public function run(): void
    {
        // Skip if a global published config already exists
        if (PerformanceConfig::where('scope', 'global')->where('status', 'published')->exists()) {
            $this->command->info('Global performance config already exists. Skipping.');
            return;
        }

        $admin = User::whereHas('roles', fn($q) => $q->where('name', 'super_admin'))->first()
            ?? User::whereHas('primaryRole', fn($q) => $q->where('name', 'admin'))->first()
            ?? User::first();

        PerformanceConfig::create([
            'name'        => 'General Employee Evaluation',
            'description' => 'Default evaluation template for all employees.',
            'scope'       => 'global',
            'status'      => 'published',
            'is_active'   => true,
            'published_at' => now(),
            'created_by'  => $admin?->id,
            'sections'    => [
                [
                    'title'   => 'Work Quality',
                    'weight'  => 30,
                    'metrics' => [
                        ['label' => 'Accuracy & Attention to Detail', 'max_score' => 10],
                        ['label' => 'Consistency of Output',          'max_score' => 10],
                        ['label' => 'Meeting Deadlines',              'max_score' => 10],
                    ],
                ],
                [
                    'title'   => 'Teamwork & Communication',
                    'weight'  => 25,
                    'metrics' => [
                        ['label' => 'Collaboration',        'max_score' => 10],
                        ['label' => 'Communication Skills', 'max_score' => 10],
                        ['label' => 'Conflict Resolution',  'max_score' => 5],
                    ],
                ],
                [
                    'title'   => 'Initiative & Growth',
                    'weight'  => 25,
                    'metrics' => [
                        ['label' => 'Proactiveness',          'max_score' => 10],
                        ['label' => 'Learning & Development', 'max_score' => 10],
                        ['label' => 'Problem Solving',        'max_score' => 5],
                    ],
                ],
                [
                    'title'   => 'Attendance & Punctuality',
                    'weight'  => 20,
                    'metrics' => [
                        ['label' => 'On-time Attendance', 'max_score' => 10],
                        ['label' => 'Reliability',        'max_score' => 10],
                    ],
                ],
            ],
            'scoring_config' => [
                'max_score'  => 100,
                'pass_score' => 60,
                'grades'     => [
                    ['label' => 'Excellent',    'min' => 90, 'max' => 100],
                    ['label' => 'Good',         'min' => 75, 'max' => 89],
                    ['label' => 'Satisfactory', 'min' => 60, 'max' => 74],
                    ['label' => 'Needs Improvement', 'min' => 0, 'max' => 59],
                ],
            ],
        ]);

        $this->command->info('✓ Global performance config seeded.');
    }
}
