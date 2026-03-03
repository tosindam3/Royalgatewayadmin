<?php

namespace Database\Seeders;

use App\Models\EvaluationTemplate;
use App\Models\ReviewCycle;
use App\Models\Employee;
use App\Models\User;
use App\Models\CycleParticipant;
use App\Models\EvaluationResponse;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PerformanceSystemSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::first();
        if (!$admin) {
            $this->command->error('No users found.');
            return;
        }

        $this->command->info('Seeding Performance Templates...');

        // 1. Create a Standard Evaluation Template
        $standardTemplate = EvaluationTemplate::create([
            'title' => 'Standard Annual Performance Review',
            'description' => 'A comprehensive annual review covering core competencies and goals.',
            'sessions' => [
                [
                    'id' => 'sec_1',
                    'title' => 'Core Competencies',
                    'description' => 'Behavioral and professional skills.',
                    'fields' => [
                        ['id' => 'q1', 'type' => 'RATING', 'label' => 'Technical Proficiency', 'required' => true, 'weight' => 20],
                        ['id' => 'q2', 'type' => 'RATING', 'label' => 'Communication Skills', 'required' => true, 'weight' => 20],
                        ['id' => 'q3', 'type' => 'RATING', 'label' => 'Team Collaboration', 'required' => true, 'weight' => 20],
                    ]
                ],
                [
                    'id' => 'sec_2',
                    'title' => 'KPIs & Goals',
                    'description' => 'Review of objective targets.',
                    'fields' => [
                        ['id' => 'q4', 'type' => 'KPI', 'label' => 'Goal Achievement Rate', 'required' => true, 'weight' => 40],
                        ['id' => 'q5', 'type' => 'PARAGRAPH', 'label' => 'Key Accomplishments', 'required' => false, 'weight' => 0],
                    ]
                ]
            ],
            'created_by' => $admin->id,
            'status' => 'published',
            'published_at' => now(),
            'version' => 1,
        ]);

        $this->command->info('Seeding Review Cycles...');

        // 2. Create Active Review Cycle
        $activeCycle = ReviewCycle::create([
            'name' => 'Q1 2026 Performance Review',
            'description' => 'First quarter review for all staff.',
            'start_date' => now()->startOfQuarter(),
            'end_date' => now()->endOfQuarter(),
            'status' => 'active',
            'template_id' => $standardTemplate->id,
        ]);

        // 3. Create Draft Review Cycle
        ReviewCycle::create([
            'name' => 'Mid-Year 2026 Strategy Review',
            'description' => 'Planning and check-in for H2.',
            'start_date' => now()->addMonths(3)->startOfMonth(),
            'end_date' => now()->addMonths(4)->endOfMonth(),
            'status' => 'draft',
            'template_id' => $standardTemplate->id,
        ]);

        $employees = Employee::with('user')->where('status', 'active')->limit(10)->get();
        
        $this->command->info('Seeding Participants and Responses for ' . $employees->count() . ' employees...');

        foreach ($employees as $employee) {
            $evaluator = $employee->user?->manager_id ?? $admin->id;

            // Create Participant
            $participant = CycleParticipant::create([
                'cycle_id' => $activeCycle->id,
                'employee_id' => $employee->id,
                'evaluator_id' => $evaluator,
                'status' => $employee->id % 3 === 0 ? 'completed' : ($employee->id % 2 === 0 ? 'in_progress' : 'pending'),
                'completed_at' => $employee->id % 3 === 0 ? now() : null,
            ]);

            // If completed, create a response
            if ($participant->status === 'completed') {
                EvaluationResponse::create([
                    'template_id' => $standardTemplate->id,
                    'employee_id' => $employee->id,
                    'evaluator_id' => $evaluator,
                    'cycle_id' => $activeCycle->id,
                    'answers' => [
                        'q1' => rand(3, 5),
                        'q2' => rand(3, 5),
                        'q3' => rand(4, 5),
                        'q4' => rand(70, 100),
                        'q5' => 'Demonstrated excellent growth in lead development.',
                    ],
                    'status' => 'approved',
                    'submitted_at' => now()->subDays(5),
                    'approved_at' => now()->subDays(2),
                    'approved_by' => $admin->id,
                ]);
            }
        }

        $this->command->info('Performance system seeding completed.');
    }
}
