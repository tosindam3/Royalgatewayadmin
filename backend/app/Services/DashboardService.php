<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\AttendanceLog;
use App\Models\Department;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class DashboardService
{
    /**
     * Get basic statistics for the dashboard.
     */
    public function getQuickStats(?int $branchId = null, ?int $deptId = null): array
    {
        $query = Employee::operational();
        if ($branchId) $query->where('branch_id', $branchId);
        if ($deptId) $query->where('department_id', $deptId);
        
        $total = $query->count();
        $active = (clone $query)->where('status', 'active')->count();
        
        // In a real application, these deltas would be calculated based on historical data
        return [
            ['label' => 'Headcount', 'val' => (string)$total, 'delta' => '+2%', 'color' => 'text-slate-900 dark:text-white'],
            ['label' => 'Retention', 'val' => '94.2%', 'delta' => '+1.5%', 'color' => 'text-emerald-500'],
            ['label' => 'Burnout Index', 'val' => '2.1', 'delta' => 'Low', 'color' => 'text-blue-500'],
            ['label' => 'Open Req', 'val' => '12', 'delta' => '-1', 'color' => 'text-amber-500'],
        ];
    }

    /**
     * Get talent trends over the last 5 months.
     */
    public function getTalentTrends(?int $branchId = null): array
    {
        return collect(range(4, 0))->map(function ($i) use ($branchId) {
            $date = Carbon::now()->subMonths($i);
            $count = Employee::where('hire_date', '<=', $date->endOfMonth())
                ->where(function($q) use ($date) {
                    $q->whereNull('deleted_at')->orWhere('deleted_at', '>', $date);
                });
            
            if ($branchId) $count->where('branch_id', $branchId);
            
            return [
                'name' => $date->format('M'),
                'val' => $count->count()
            ];
        })->toArray();
    }

    /**
     * Get attendance health metrics for today.
     */
    public function getAttendanceHealth(?int $branchId = null): array
    {
        $today = Carbon::today()->toDateString();
        $query = Employee::operational();
        if ($branchId) $query->where('branch_id', $branchId);
        $totalStaff = $query->count();

        $presentQuery = AttendanceLog::whereDate('timestamp', $today)
            ->where('check_type', 'check_in')
            ->distinct('employee_id');

        if ($branchId) {
            $presentQuery->whereHas('employee', fn($q) => $q->where('branch_id', $branchId));
        }
        
        $present = $presentQuery->count();

        $lateQuery = AttendanceLog::whereDate('timestamp', $today)
            ->where('check_type', 'check_in')
            ->where('status', 'late')
            ->distinct('employee_id');

        if ($branchId) {
            $lateQuery->whereHas('employee', fn($q) => $q->where('branch_id', $branchId));
        }

        $late = $lateQuery->count();

        $onLeave = 0; // Integrate with actual leave records if available

        return [
            ['name' => 'Present', 'value' => $present, 'color' => '#8252e9'],
            ['name' => 'Late', 'value' => $late, 'color' => '#f59e0b'],
            ['name' => 'Absent', 'value' => max(0, $totalStaff - $present - $onLeave), 'color' => '#ef4444'],
            ['name' => 'On Leave', 'value' => $onLeave, 'color' => '#64748b'],
        ];
    }

    /**
     * Get demographics breakdown.
     */
    public function getDemographics(?int $branchId = null): array
    {
        $query = Employee::operational();
        if ($branchId) $query->where('branch_id', $branchId);
        
        $total = (clone $query)->count();
        if ($total === 0) {
            return [
                'gender' => [['name' => 'Male', 'value' => 0, 'pct' => '0%'], ['name' => 'Female', 'value' => 0, 'pct' => '0%']],
                'age_groups' => [['name' => '20-30', 'value' => 0], ['name' => '31-45', 'value' => 0], ['name' => '46+', 'value' => 0]]
            ];
        }

        // Mocking demographics since gender/age might not be in the current schema
        // In production, these should be real column lookups
        return [
            'gender' => [
                ['name' => 'Male', 'value' => (int)($total * 0.52), 'pct' => '52%'],
                ['name' => 'Female', 'value' => (int)($total * 0.48), 'pct' => '48%'],
            ],
            'age_groups' => [
                ['name' => '20-30', 'value' => 35],
                ['name' => '31-45', 'value' => 45],
                ['name' => '46+', 'value' => 20],
            ]
        ];
    }

    /**
     * Get upcoming milestones.
     */
    public function getMilestones(): array
    {
        return [
            ['t' => 'Q2 Performance Cycle', 'd' => 'Starts in 4 days', 'i' => '🎯', 'c' => 'border-blue-500'],
            ['t' => 'Compliance Audit', 'd' => 'May 14, 2024', 'i' => '⚖️', 'c' => 'border-amber-500'],
            ['t' => 'Annual Townhall', 'd' => 'June 01, 2024', 'i' => '🎙️', 'c' => 'border-purple-500'],
        ];
    }

    /**
     * Get turnover data for management.
     */
    public function getTurnoverData(?int $branchId = null): array
    {
        return [
            ['name' => 'Promoted', 'val' => 45, 'color' => '#4c49d8'],
            ['name' => 'Resigned', 'val' => 12, 'color' => '#f59e0b'],
            ['name' => 'New Hires', 'val' => 28, 'color' => '#10b981'],
            ['name' => 'Terminated', 'val' => 5, 'color' => '#ef4444'],
        ];
    }

    /**
     * Get summary metrics for a specific employee.
     */
    public function getEmployeeSummary(int $employeeId, ?string $period = null): array
    {
        $employee = Employee::find($employeeId);
        if (!$employee) return [];

        $targetDate = $period ? Carbon::parse($period . '-01') : Carbon::now();
        $startOfMonth = (clone $targetDate)->startOfMonth();
        $endOfMonth = (clone $targetDate)->endOfMonth();
        $isCurrentMonth = $startOfMonth->isCurrentMonth();
        
        // 1. Performance Score - Find latest within or before the period
        $latestScore = \App\Models\PerformanceSubmission::where('employee_id', $employeeId)
            ->whereIn('status', ['published', 'reviewed', 'submitted'])
            ->where('score', '>', 0)
            ->where('created_at', '<=', $endOfMonth)
            ->latest()
            ->first();
        
        // 2. Attendance Summary
        $daysPresent = AttendanceLog::where('employee_id', $employeeId)
            ->whereBetween('timestamp', [$startOfMonth, $endOfMonth])
            ->where('check_type', 'check_in')
            ->distinct(DB::raw('DATE(timestamp)'))
            ->count();
        
        $calculationEnd = $isCurrentMonth ? Carbon::now() : $endOfMonth;
        $totalWorkDays = $startOfMonth->diffInDaysFiltered(function(Carbon $date) {
             return !$date->isWeekend();
        }, $calculationEnd);

        // 3. Pending Tasks
        $taskCount = 0;
        try {
            $taskCount = \App\Models\OnboardingTask::where('owner_user_id', $employee->user_id)
                ->whereIn('status', ['pending', 'in_progress'])
                ->count();
        } catch (\Exception $e) {
            // onboarding_tasks table may not exist in all environments
        }

        // 4. AI Advisory
        $advisory = "Keep up the consistent clock-in times. Improving your communication score by 5% could put you in the top tier for the next promotion cycle.";
        if ($latestScore && $latestScore->score < 70) {
            $advisory = "Focus on technical proficiency training modules this month to boost your performance score.";
        }

        $nextDue = null;
        try {
            $nextDue = \App\Models\OnboardingTask::where('owner_user_id', $employee->user_id)
                ->whereIn('status', ['pending', 'in_progress'])
                ->orderBy('due_date', 'asc')
                ->first()?->due_date?->format('Y-m-d');
        } catch (\Exception $e) {
            // onboarding_tasks table may not exist in all environments
        }

        return [
            'period' => $startOfMonth->format('F Y'),
            'performance' => [
                'latest_score' => $latestScore ? (float)$latestScore->score : 0,
                'target' => 90,
                'status' => $latestScore ? ($latestScore->score >= 80 ? 'Excellent' : ($latestScore->score >= 60 ? 'Good' : 'Needs Improvement')) : 'No Data'
            ],
            'attendance' => [
                'days_present' => $daysPresent,
                'total_days' => $totalWorkDays,
                'percentage' => $totalWorkDays > 0 ? round(($daysPresent / $totalWorkDays) * 100, 1) : 0
            ],
            'tasks' => [
                'pending_count' => $taskCount,
                'next_due' => $nextDue,
            ],
            'ai_advisory' => [
                'message' => $advisory,
                'sentiment' => 'positive',
                'recommendation_link' => '/talent/training'
            ]
        ];
    }
}
