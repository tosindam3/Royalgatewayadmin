<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\EvaluationResponse;
use App\Models\Goal;
use App\Models\ReviewCycle;
use App\Models\PerformanceMonthlyScore;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Jobs\LaunchReviewCycleJob;

class PerformanceService
{
    /**
     * Get dashboard KPIs
     */
    public function getDashboardKpis(): array
    {
        return Cache::remember('performance_dashboard_kpis', 60, function () {
            $totalEmployees = Employee::where('status', 'active')->count();

            // Get active cycle completion rate
            $activeCycle = ReviewCycle::active()->first();
            $completionRate = $activeCycle ? $activeCycle->completion_rate : 0;

            // Calculate org health score from recent performance scores
            $avgScore = PerformanceMonthlyScore::whereHas('period', function ($q) {
                $q->where('status', 'closed')
                    ->orderBy('end_date', 'desc')
                    ->limit(1);
            })->avg('score') ?? 0;

            // Top performers (score >= 90)
            $topPerformers = PerformanceMonthlyScore::whereHas('period', function ($q) {
                $q->where('status', 'closed')
                    ->orderBy('end_date', 'desc')
                    ->limit(1);
            })->where('score', '>=', 90)->count();

            // Turnover risk (employees with low scores)
            $lowPerformers = PerformanceMonthlyScore::whereHas('period', function ($q) {
                $q->where('status', 'closed')
                    ->orderBy('end_date', 'desc')
                    ->limit(1);
            })->where('score', '<', 60)->count();

            $turnoverRisk = $totalEmployees > 0
                ? ($lowPerformers / $totalEmployees) * 100
                : 0;

            return [
                'org_health_score' => round($avgScore, 1),
                'completion_rate' => round($completionRate, 0),
                'top_performers' => $topPerformers,
                'top_performers_percentage' => $totalEmployees > 0
                    ? round(($topPerformers / $totalEmployees) * 100, 1)
                    : 0,
                'turnover_risk' => $turnoverRisk < 10 ? 'LOW' : ($turnoverRisk < 20 ? 'MEDIUM' : 'HIGH'),
            ];
        });
    }

    /**
     * Get team performance data for charts
     */
    public function getTeamPerformance(): array
    {
        return Cache::remember('performance_team_data', 60, function () {
            $departments = Employee::select('department_id')
                ->where('status', 'active')
                ->groupBy('department_id')
                ->with('department')
                ->get();

            $data = [];

            foreach ($departments as $emp) {
                if (!$emp->department) continue;

                $deptEmployees = Employee::where('department_id', $emp->department_id)
                    ->where('status', 'active')
                    ->pluck('id');

                // Get average scores
                $scores = PerformanceMonthlyScore::whereIn('employee_id', $deptEmployees)
                    ->whereHas('period', function ($q) {
                        $q->where('status', 'closed')
                            ->orderBy('end_date', 'desc')
                            ->limit(1);
                    })
                    ->get();

                $avgScore = $scores->avg('score') ?? 0;

                // Get attendance average (from attendance_records)
                $attendanceAvg = DB::table('attendance_records')
                    ->whereIn('employee_id', $deptEmployees)
                    ->whereNotNull('check_in_time')
                    ->whereNotNull('check_out_time')
                    ->count();

                $totalDays = DB::table('attendance_records')
                    ->whereIn('employee_id', $deptEmployees)
                    ->count();

                $attendanceRate = $totalDays > 0
                    ? ($attendanceAvg / $totalDays) * 100
                    : 0;

                $data[] = [
                    'name' => substr($emp->department->name, 0, 10),
                    'kpi' => round($avgScore, 0),
                    'behavioral' => round($avgScore * 1.05, 0), // Simulated
                    'attendance' => round($attendanceRate, 0),
                    'avg' => round(($avgScore + $attendanceRate) / 2, 0),
                ];
            }

            return $data;
        });
    }

    /**
     * Get pending evaluations for current user
     */
    public function getPendingEvaluations(int $userId): array
    {
        $user = \App\Models\User::find($userId);
        if (!$user || !$user->employee_id) {
            return [];
        }

        // Get evaluations where user is the evaluator
        $participants = DB::table('cycle_participants')
            ->join('employees', 'cycle_participants.employee_id', '=', 'employees.id')
            ->join('review_cycles', 'cycle_participants.cycle_id', '=', 'review_cycles.id')
            ->leftJoin('departments', 'employees.department_id', '=', 'departments.id')
            ->where('cycle_participants.evaluator_id', $userId)
            ->where('cycle_participants.status', '!=', 'completed')
            ->where('review_cycles.status', 'active')
            ->select(
                'cycle_participants.*',
                'employees.first_name',
                'employees.last_name',
                'employees.employee_code',
                'departments.name as department_name'
            )
            ->get();

        return $participants->map(function ($p) {
            return [
                'id' => $p->id,
                'employee_id' => $p->employee_id,
                'employee_name' => $p->first_name . ' ' . $p->last_name,
                'employee_code' => $p->employee_code,
                'department' => $p->department_name ?? 'N/A',
                'status' => $p->status,
                'cycle_id' => $p->cycle_id,
            ];
        })->toArray();
    }

    /**
     * Submit evaluation response
     */
    public function submitEvaluation(array $data): EvaluationResponse
    {
        DB::beginTransaction();
        try {
            $response = EvaluationResponse::create([
                'template_id' => $data['template_id'],
                'employee_id' => $data['employee_id'],
                'evaluator_id' => $data['evaluator_id'],
                'cycle_id' => $data['cycle_id'] ?? null,
                'answers' => $data['answers'],
                'status' => 'submitted',
                'submitted_at' => now(),
            ]);

            // Update cycle participant status
            if (isset($data['cycle_id'])) {
                DB::table('cycle_participants')
                    ->where('cycle_id', $data['cycle_id'])
                    ->where('employee_id', $data['employee_id'])
                    ->where('evaluator_id', $data['evaluator_id'])
                    ->update([
                        'status' => 'completed',
                        'completed_at' => now(),
                    ]);
            }

            // Clear caches
            Cache::forget('performance_dashboard_kpis');
            Cache::forget('performance_team_data');

            DB::commit();
            return $response;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Launch a review cycle
     */
    public function launchCycle(int $cycleId, array $employeeIds): void
    {
        $cycle = ReviewCycle::findOrFail($cycleId);

        if ($cycle->status !== 'draft') {
            throw new \Exception('Only draft cycles can be launched.');
        }

        // Set status to active immediately or using a 'processing' state
        // For simplicity, we dispatch the job which will handle the rest.
        LaunchReviewCycleJob::dispatch($cycle, $employeeIds);
    }

    /**
     * Calculate goal progress
     */
    public function calculateGoalProgress(int $goalId): float
    {
        $goal = Goal::with('keyResults')->findOrFail($goalId);
        $progress = $goal->calculateProgress();
        
        // Clear caches as goal progress affects dashboard/team stats
        Cache::forget('performance_dashboard_kpis');
        Cache::forget('performance_team_data');
        
        return $progress;
    }
}
