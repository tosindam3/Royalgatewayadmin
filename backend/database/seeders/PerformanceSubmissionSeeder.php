<?php

namespace Database\Seeders;

use App\Models\PerformanceSubmission;
use App\Models\PerformanceConfig;
use App\Models\Employee;
use App\Services\PerformanceScoringEngine;
use Illuminate\Database\Seeder;

class PerformanceSubmissionSeeder extends Seeder
{
    public function run(): void
    {
        $scoringEngine = new PerformanceScoringEngine();

        // Get all active configs
        $configs = PerformanceConfig::with('department')->where('is_active', true)->get();

        if ($configs->isEmpty()) {
            $this->command->warn('No active performance configs found. Run PerformanceConfigSeeder first.');
            return;
        }

        foreach ($configs as $config) {
            // Get employees from this department
            $employees = Employee::where('department_id', $config->department_id)
                ->limit(3)
                ->get();

            if ($employees->isEmpty()) {
                $this->command->warn("No employees found for department: {$config->department->name}");
                continue;
            }

            foreach ($employees as $employee) {
                // Generate data for multiple periods
                foreach ($this->getPeriods() as $period) {
                    // Generate sample data based on config
                    $formData = $this->generateSampleData($config);

                    // Calculate score
                    $scoreResult = $scoringEngine->calculateScore(
                        $formData,
                        array_merge($config->scoring_config, ['sections' => $config->sections])
                    );

                    // Create submission
                    PerformanceSubmission::updateOrCreate(
                        [
                            'employee_id' => $employee->id,
                            'department_id' => $config->department_id,
                            'period' => $period,
                        ],
                        [
                            'form_data' => $formData,
                            'score' => $scoreResult['score'],
                            'rating' => $scoreResult['rating'],
                            'breakdown' => $scoreResult['breakdown'],
                            'status' => 'submitted',
                            'submitted_at' => $this->getDateFromPeriod($period),
                        ]
                    );

                    $this->command->info("✓ Created submission for {$employee->first_name} {$employee->last_name} ({$period}) (Score: {$scoreResult['score']})");
                }
            }
        }

        $this->command->info('Performance submissions seeded successfully!');
    }

    private function generateSampleData($config): array
    {
        $data = [];

        foreach ($config->sections as $section) {
            foreach ($section['fields'] as $field) {
                $value = $this->generateFieldValue($field);
                if ($value !== null) {
                    $data[$field['id']] = $value;
                }
            }
        }

        return $data;
    }

    private function generateFieldValue($field)
    {
        switch ($field['type']) {
            case 'number':
                $target = $field['target'] ?? 10;
                // Generate value between 70% and 120% of target
                return rand((int)($target * 0.7), (int)($target * 1.2));

            case 'currency':
                $target = $field['target'] ?? 100000;
                return rand((int)($target * 0.7), (int)($target * 1.2));

            case 'percentage':
                $target = $field['target'] ?? 50;
                return rand(max(0, (int)($target * 0.7)), min(100, (int)($target * 1.2)));

            case 'rating':
                $max = $field['max'] ?? 5;
                return rand(3, $max); // Generate ratings between 3 and max

            case 'text':
            case 'textarea':
                return $field['required'] ? 'Sample text for ' . $field['label'] : null;

            case 'select':
                if (isset($field['options']) && !empty($field['options'])) {
                    return $field['options'][array_rand($field['options'])]['value'];
                }
                return null;

            case 'date':
                return now()->format('Y-m-d');

            default:
                return null;
        }
    }

    private function getPeriods(): array
    {
        $periods = [];
        $now = new \DateTime();
        
        // Add current week
        $periods[] = $now->format('Y') . '-W' . $now->format('W');
        
        // Add previous 3 weeks
        for ($i = 1; $i <= 3; $i++) {
            $past = clone $now;
            $past->modify("-{$i} week");
            $periods[] = $past->format('Y') . '-W' . $past->format('W');
        }

        // Add 6 months ago to ensure multi-month trajectory
        for ($i = 1; $i <= 5; $i++) {
            $past = clone $now;
            $past->modify("-{$i} month");
            $periods[] = $past->format('Y-m');
        }
        
        return $periods;
    }

    private function getDateFromPeriod(string $period): \DateTime
    {
        if (str_contains($period, '-W')) {
            $parts = explode('-W', $period);
            $date = new \DateTime();
            $date->setISODate((int)$parts[0], (int)$parts[1]);
            return $date;
        }

        if (strlen($period) === 7) { // YYYY-MM
            return \DateTime::createFromFormat('Y-m-d', $period . '-01');
        }

        return new \DateTime();
    }
}
