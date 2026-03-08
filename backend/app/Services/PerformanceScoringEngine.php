<?php

namespace App\Services;

class PerformanceScoringEngine
{
    public function calculateScore(array $formData, array $scoringConfig): array
    {
        if (!isset($scoringConfig['method'])) {
            return $this->getDefaultResult();
        }

        $method = $scoringConfig['method'];
        $scoreableFields = $this->getScoreableFields($scoringConfig);
        
        if (empty($scoreableFields)) {
            return $this->getDefaultResult();
        }

        $breakdown = [];
        $totalScore = 0;

        foreach ($scoreableFields as $field) {
            $fieldId = $field['id'];
            $actual = $formData[$fieldId] ?? 0;
            $target = $field['target'] ?? 100;
            $weight = $field['weight'] ?? 0;

            $fieldScore = $this->calculateFieldScore($actual, $target, $field);
            $weightedScore = ($fieldScore * $weight) / 100;

            $totalScore += $weightedScore;

            $breakdown[] = [
                'field_id' => $fieldId,
                'field_label' => $field['label'],
                'actual' => $actual,
                'target' => $target,
                'score' => round($fieldScore, 2),
                'weight' => $weight,
                'weighted_score' => round($weightedScore, 2),
            ];
        }

        // Convert to percentage for points-based scoring
        if ($method === 'points' && isset($scoringConfig['maxPoints'])) {
            $finalScore = ($totalScore / $scoringConfig['maxPoints']) * 100;
        } else {
            $finalScore = $totalScore;
        }

        $finalScore = round(min(100, max(0, $finalScore)), 2);
        $rating = $this->getRating($finalScore, $scoringConfig['ratingThresholds'] ?? []);

        return [
            'score' => $finalScore,
            'rating' => $rating,
            'breakdown' => $breakdown,
        ];
    }

    protected function calculateFieldScore($actual, $target, array $field): float
    {
        $type = $field['type'] ?? 'number';

        // Handle rating fields (1-5 scale)
        if ($type === 'rating') {
            if ($actual <= 0) return 0;
            if ($actual > 5) return 100;
            return ($actual / 5) * 100;
        }

        // Handle inverse scoring (lower is better)
        if (isset($field['inverse']) && $field['inverse']) {
            if ($actual == 0) return 100;
            return max(0, 100 - ($actual * 20));
        }

        // Standard numeric scoring
        if ($target == 0) {
            return $actual > 0 ? 100 : 0;
        }

        $score = ($actual / $target) * 100;
        return min(100, max(0, $score));
    }

    protected function getScoreableFields(array $scoringConfig): array
    {
        $fields = [];
        
        if (!isset($scoringConfig['sections'])) {
            return $fields;
        }

        foreach ($scoringConfig['sections'] as $section) {
            if (!isset($section['fields'])) continue;
            
            foreach ($section['fields'] as $field) {
                if (isset($field['scoreable']) && $field['scoreable']) {
                    $fields[] = $field;
                }
            }
        }

        return $fields;
    }

    protected function getRating(float $score, array $thresholds): array
    {
        foreach ($thresholds as $threshold) {
            if ($score >= $threshold['min'] && $score <= $threshold['max']) {
                return [
                    'label' => $threshold['label'],
                    'color' => $threshold['color'],
                    'bgColor' => $threshold['bgColor'],
                    'borderColor' => $threshold['borderColor'],
                ];
            }
        }

        return $this->getDefaultRating();
    }

    protected function getDefaultRating(): array
    {
        return [
            'label' => 'Not Rated',
            'color' => 'text-slate-600',
            'bgColor' => 'bg-slate-100',
            'borderColor' => 'border-slate-300',
        ];
    }

    protected function getDefaultResult(): array
    {
        return [
            'score' => 0,
            'rating' => $this->getDefaultRating(),
            'breakdown' => [],
        ];
    }
}
