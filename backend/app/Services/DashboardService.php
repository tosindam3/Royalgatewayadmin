<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\AttendanceRecord;
use App\Models\LeaveRequest;
use App\Models\LeaveBalance;
use App\Models\AttendanceLog;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardService
{
    /**
     * Quick top-level stats for admin/executive panels.
     */
    public function getQuickStats(?int $branchId = null): array
    {
        $empQuery = Employee::query()->where('status', 'active');
        if ($branchId) $empQuery->where('branch_id', $branchId);

        $totalEmployees = $empQuery->count();

        $today = Carbon::today();
        $presentQuery = AttendanceRecord::whereDate('attendance_date', $today)
            ->whereIn('status', ['present', 'late']);
        if ($branchId) $presentQuery->whereHas('employee', fn($q) => $q->where('branch_id', $branchId));
        $presentToday = $presentQuery->count();

        $onLeaveQuery = LeaveRequest::where('status', 'approved')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today);
        if ($branchId) $onLeaveQuery->whereHas('employee', fn($q) => $q->where('branch_id', $branchId));
        $onLeave = $onLeaveQuery->count();

        $pendingApprovals = \App\Models\ApprovalRequest::where('status', 'pending')->count();

        // Turnover: terminated in last 12 months / avg headcount
        $terminatedQuery = Employee::where('status', 'terminated')
            ->where('updated_at', '>=', Carbon::now()->subYear());
        if ($branchId) $terminatedQuery->where('branch_id', $branchId);
        $terminated = $terminatedQuery->count();
        $turnoverRate = $totalEmployees > 0 ? round(($terminated / max($totalEmployees, 1)) * 100, 1) : 0;

        // Avg tenure
        $avgTenure = $empQuery->avg(DB::raw('DATEDIFF(NOW(), hire_date) / 365'));

        // Delta vs last month
        $lastMonth = Carbon::now()->subMonth();
        $prevEmpQuery = Employee::query()->where('status', 'active')
            ->where('created_at', '<=', $lastMonth->endOfMonth());
        if ($branchId) $prevEmpQuery->where('branch_id', $branchId);
        $prevTotal = $prevEmpQuery->count();

        return [
            'total_employees'   => $totalEmployees,
            'present_today'     => $presentToday,
            'on_leave'          => $onLeave,
            'pending_approvals' => $pendingApprovals,
            'turnover_rate'     => $turnoverRate,
            'avg_tenure_years'  => round((float)($avgTenure ?? 0), 1),
            'active_openings'   => 0,
            'delta' => [
                'employees' => $totalEmployees - $prevTotal,
                'present'   => 0,
                'turnover'  => 0,
            ],
        ];
    }

    /**
     * Talent trends: headcount over 6 months, turnover categories, hiring funnel.
     */
    public function getTalentTrends(?int $branchId = null): array
    {
        $headcount = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $q = Employee::where('status', 'active')
                ->where('created_at', '<=', $month->endOfMonth());
            if ($branchId) $q->where('branch_id', $branchId);
            $headcount[] = [
                'month' => $month->format('M'),
                'count' => $q->count(),
            ];
        }

        $turnover = Employee::where('status', 'terminated')
            ->where('updated_at', '>=', Carbon::now()->subYear())
            ->select('employment_type', DB::raw('count(*) as count'))
            ->groupBy('employment_type')
            ->get()
            ->map(fn($r) => ['category' => $r->employment_type ?? 'Other', 'count' => $r->count])
            ->values()
            ->toArray();

        return [
            'headcount'     => $headcount,
            'turnover'      => $turnover ?: [['category' => 'No Data', 'count' => 0]],
            'hiring_funnel' => [],
        ];
    }

    /**
     * Attendance health for today.
     */
    public function getAttendanceHealth(?int $branchId = null): array
    {
        $today = Carbon::today();

        $empQuery = Employee::query()->where('status', 'active');
        if ($branchId) $empQuery->where('branch_id', $branchId);
        $total = $empQuery->count();

        $base = AttendanceRecord::whereDate('attendance_date', $today);
        if ($branchId) $base->whereHas('employee', fn($q) => $q->where('branch_id', $branchId));

        $present  = (clone $base)->where('status', 'present')->count();
        $late     = (clone $base)->where('status', 'late')->count();
        $onLeave  = LeaveRequest::where('status', 'approved')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->when($branchId, fn($q) => $q->whereHas('employee', fn($eq) => $eq->where('branch_id', $branchId)))
            ->count();
        $absent   = max(0, $total - $present - $late - $onLeave);
        $pctPresent = $total > 0 ? round((($present + $late) / $total) * 100, 1) : 0;

        return [
            'present'            => $present,
            'absent'             => $absent,
            'late'               => $late,
            'on_leave'           => $onLeave,
            'total'              => $total,
            'percentage_present' => $pctPresent,
        ];
    }

    /**
     * Demographics breakdown.
     */
    public function getDemographics(?int $branchId = null): array
    {
        $q = Employee::query()->where('status', 'active');
        if ($branchId) $q->where('branch_id', $branchId);

        $gender = $q->select('genotype', DB::raw('count(*) as value'))
            ->groupBy('genotype')
            ->get()
            ->map(fn($r) => ['label' => $r->genotype ?? 'Unknown', 'value' => $r->value])
            ->values()
            ->toArray();

        $empType = $q->select('employment_type', DB::raw('count(*) as value'))
            ->groupBy('employment_type')
            ->get()
            ->map(fn($r) => ['label' => ucfirst($r->employment_type ?? 'Unknown'), 'value' => $r->value])
            ->values()
            ->toArray();

        return [
            'gender'             => $gender ?: [['label' => 'No Data', 'value' => 0]],
            'employment_type'    => $empType ?: [['label' => 'No Data', 'value' => 0]],
            'absenteeism_rate'   => 0,
            'avg_days_absent'    => 0,
            'absenteeism_trend'  => [],
        ];
    }

    /**
     * Personal attendance summary for the authenticated employee (current month).
     */
    public function getPersonalSummary(int $employeeId): array
    {
        $startOfMonth = Carbon::now()->startOfMonth();
        $today = Carbon::today();

        $records = AttendanceRecord::where('employee_id', $employeeId)
            ->whereBetween('attendance_date', [$startOfMonth, $today])
            ->get();

        $daysPresent = $records->whereIn('status', ['present', 'late'])->count();
        $daysAbsent  = $records->where('status', 'absent')->count();
        $lateDays    = $records->where('status', 'late')->count();

        // Leave balance total
        $leaveBalance = LeaveBalance::where('employee_id', $employeeId)
            ->where('year', now()->year)
            ->sum('available');

        // Clock status from today's log
        $todayLog = AttendanceLog::where('employee_id', $employeeId)
            ->whereDate('created_at', $today)
            ->orderBy('created_at', 'desc')
            ->first();

        $clockStatus = 'not_started';
        $clockInTime = null;
        if ($todayLog) {
            $clockStatus = $todayLog->type === 'check_in' ? 'clocked_in' : 'clocked_out';
            if ($todayLog->type === 'check_in') {
                $clockInTime = $todayLog->created_at->format('H:i:s');
            }
        }

        // Weekly breakdown (last 4 weeks)
        $weeks = [];
        for ($i = 3; $i >= 0; $i--) {
            $weekStart = Carbon::now()->subWeeks($i)->startOfWeek();
            $weekEnd   = Carbon::now()->subWeeks($i)->endOfWeek();
            $weekRecs  = AttendanceRecord::where('employee_id', $employeeId)
                ->whereBetween('attendance_date', [$weekStart, $weekEnd])
                ->get();
            $weeks[] = [
                'week'    => 'Week ' . (4 - $i),
                'present' => $weekRecs->where('status', 'present')->count(),
                'late'    => $weekRecs->where('status', 'late')->count(),
                'absent'  => $weekRecs->where('status', 'absent')->count(),
            ];
        }

        return [
            'days_present'        => $daysPresent,
            'days_absent'         => $daysAbsent,
            'late_days'           => $lateDays,
            'leave_balance_total' => (int) $leaveBalance,
            'clock_status'        => $clockStatus,
            'clock_in_time'       => $clockInTime,
            'attendance_by_week'  => $weeks,
        ];
    }
}
