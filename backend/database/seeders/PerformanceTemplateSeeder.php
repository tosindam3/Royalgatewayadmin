<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PerformanceTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = \App\Models\User::whereHas('roles', function($q) {
            $q->where('name', 'super_admin');
        })->first() ?: \App\Models\User::first();

        if (!$admin) {
            return;
        }

        \App\Models\EvaluationTemplate::create([
            'title' => 'Enterprise Standard Performance Evaluation (Global)',
            'description' => 'A comprehensive multi-vector assessment node for evaluating strategic alignment, technical proficiency, and behavioral excellence.',
            'status' => 'published',
            'is_global' => true,
            'version' => 1,
            'created_by' => $admin->id,
            'published_at' => now(),
            'sessions' => [
                [
                    'id' => 's1',
                    'title' => 'Strategic KPI Alignment',
                    'description' => 'Quantitative assessment of key performance indicators and results.',
                    'order' => 1,
                    'fields' => [
                        [
                            'id' => 'f1',
                            'type' => 'KPI',
                            'label' => 'Revenue / Output Target Achievement',
                            'placeholder' => 'Enter percentage of target achieved',
                            'required' => true,
                            'weight' => 40,
                        ],
                        [
                            'id' => 'f2',
                            'type' => 'RATING',
                            'label' => 'Quality of Deliverables',
                            'required' => true,
                            'weight' => 20,
                        ]
                    ]
                ],
                [
                    'id' => 's2',
                    'title' => 'Behavioral Competencies',
                    'description' => 'Qualitative assessment of organizational values and cultural fit.',
                    'order' => 2,
                    'fields' => [
                        [
                            'id' => 'f3',
                            'type' => 'RATING',
                            'label' => 'Leadership & Initiative',
                            'required' => true,
                            'weight' => 20,
                        ],
                        [
                            'id' => 'f4',
                            'type' => 'RATING',
                            'label' => 'Collaboration & Teamwork',
                            'required' => true,
                            'weight' => 20,
                        ]
                    ]
                ],
                [
                    'id' => 's3',
                    'title' => 'Direct Feedback',
                    'description' => 'Open-ended feedback for professional growth.',
                    'order' => 3,
                    'fields' => [
                        [
                            'id' => 'f5',
                            'type' => 'PARAGRAPH',
                            'label' => 'Key Strengths & Achievements',
                            'required' => true,
                            'weight' => 0,
                        ],
                        [
                            'id' => 'f6',
                            'type' => 'PARAGRAPH',
                            'label' => 'Areas for Development',
                            'required' => true,
                            'weight' => 0,
                        ]
                    ]
                ]
            ],
            'metadata' => [
                'department_restricted' => false,
                'min_score_for_promotion' => 85,
            ]
        ]);
    }
}
