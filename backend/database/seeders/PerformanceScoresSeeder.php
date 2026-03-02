<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\PayrollPeriod;
use App\Models\PerformanceMonthlyScore;
use Illuminate\Database\Seeder;

class PerformanceScoresSeeder extends Seeder
{
    public function run(): void
    {
        $periods = PayrollPeriod::all();
        $employees = Employee::where('status', 'active')->get();
        
        if ($periods->isEmpty()) {
            $this->command->warn('No payroll periods found. Please seed periods first.');
            return;
        }
        
        if ($employees->isEmpty()) {
            $this->command->warn('No active employees found. Please seed employees first.');
            return;
        }
        
        $scores = [];
        $count = 0;
        
        foreach ($periods as $period) {
            foreach ($employees as $employee) {
                // Generate realistic performance scores
                // 70% get good scores (70-100)
                // 20% get average scores (60-70)
                // 10% get poor scores (40-60)
                $rand = rand(1, 100);
                
                if ($rand <= 70) {
                    $score = rand(70, 100);
                } elseif ($rand <= 90) {
                    $score = rand(60, 70);
                } else {
                    $score = rand(40, 60);
                }
                
                $scores[] = [
                    'period_id' => $period->id,
                    'employee_id' => $employee->id,
                    'score' => $score,
                    'notes' => $this->getScoreNote($score),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                
                $count++;
                
                // Insert in batches of 500
                if (count($scores) >= 500) {
                    PerformanceMonthlyScore::insert($scores);
                    $scores = [];
                }
            }
        }
        
        // Insert remaining scores
        if (!empty($scores)) {
            PerformanceMonthlyScore::insert($scores);
        }
        
        $this->command->info("Created {$count} performance scores");
    }
    
    private function getScoreNote(int $score): string
    {
        if ($score >= 90) {
            return 'Exceptional performance';
        } elseif ($score >= 80) {
            return 'Excellent performance';
        } elseif ($score >= 70) {
            return 'Good performance';
        } elseif ($score >= 60) {
            return 'Satisfactory performance';
        } else {
            return 'Needs improvement';
        }
    }
}
