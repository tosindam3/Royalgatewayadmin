<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\AttendanceRecord;
use App\Models\LeaveRequest;
use App\Models\LeaveBalance;
use App\Models\AttendanceLog;
use App\Models\OrganizationSetting;
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

        $gender = $q->select(DB::raw('LOWER(genotype) as type'), DB::raw('count(*) as value'))
            ->groupBy(DB::raw('LOWER(genotype)'))
            ->get()
            ->map(fn($r) => ['label' => strtoupper($r->type ?? 'Unknown'), 'value' => $r->value])
            ->values()
            ->toArray();

        $empType = $q->select(DB::raw('LOWER(employment_type) as type'), DB::raw('count(*) as value'))
            ->groupBy(DB::raw('LOWER(employment_type)'))
            ->get()
            ->map(fn($r) => ['label' => ucfirst($r->type ?? 'Unknown'), 'value' => $r->value])
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

        $totalDays = $records->count();
        $presentDays = $records->whereIn('status', ['present', 'partial'])->count();
        $absentDays = $records->where('status', 'absent')->count();
        $lateDays = $records->where('late_minutes', '>', 0)->count();
        $totalWorkedMinutes = $records->sum(function($r) { return abs($r->work_minutes); });
        $totalWorkedHours = round($totalWorkedMinutes / 60, 1);

        // Get organization settings
        $settings = OrganizationSetting::whereIn('key', [
            'attendance.work_hours_per_day',
            'attendance.working_days'
        ])->pluck('value', 'key');

        $requiredHoursPerDay = isset($settings['attendance.work_hours_per_day']) ? (int)$settings['attendance.work_hours_per_day'] : 8;
        $workingDays = isset($settings['attendance.working_days']) ? json_decode($settings['attendance.working_days'], true) : [1, 2, 3, 4, 5];
        
        // Calculate expected working days (based on settings)
        $expectedWorkingDays = 0;
        $current = $startOfMonth->copy();
        while ($current->lte($today)) {
            if (in_array($current->isoWeekday(), $workingDays)) {
                $expectedWorkingDays++;
            }
            $current->addDay();
        }

        // Calculate leave days that fall on working days (to subtract from absent count)
        $leaveDaysOnWorkDays = 0;
        $approvedLeaves = LeaveRequest::where('employee_id', $employeeId)
            ->where('status', 'approved')
            ->where(function($q) use ($startOfMonth, $today) {
                $q->whereBetween('start_date', [$startOfMonth, $today])
                  ->orWhereBetween('end_date', [$startOfMonth, $today])
                  ->orWhere(function($sub) use ($startOfMonth, $today) {
                      $sub->where('start_date', '<=', $startOfMonth)
                          ->where('end_date', '>=', $today);
                  });
            })
            ->get();

        foreach ($approvedLeaves as $leave) {
            $lStart = Carbon::parse($leave->start_date)->startOfDay();
            $lEnd = Carbon::parse($leave->end_date)->endOfDay();
            
            $checkStart = $lStart->gt($startOfMonth) ? $lStart : $startOfMonth;
            $checkEnd = $lEnd->lt($today) ? $lEnd : $today;
            
            $temp = $checkStart->copy();
            while ($temp->lte($checkEnd)) {
                if (in_array($temp->isoWeekday(), $workingDays)) {
                    $leaveDaysOnWorkDays++;
                }
                $temp->addDay();
            }
        }
        
        // Calculate absent days: Expected - (Present + Leave)
        // If they were present on a leave day (unlikely but possible), we don't double count
        $absentDays = max(0, $expectedWorkingDays - ($presentDays + $leaveDaysOnWorkDays));

        $expectedTotalHours = $expectedWorkingDays * $requiredHoursPerDay;
        $attendanceRate = $expectedWorkingDays > 0 
            ? round(($presentDays / $expectedWorkingDays) * 100, 1) 
            : 0;

        return [
            'total_days' => $totalDays,
            'present_days' => $presentDays,
            'absent_days' => $absentDays,
            'late_days' => $lateDays,
            'total_worked_hours' => $totalWorkedHours,
            'expected_working_days' => $expectedWorkingDays,
            'expected_total_hours' => $expectedTotalHours,
            'attendance_rate' => $attendanceRate,
        ];
    }

    /**
     * Get leave balance summary
     */
    public function getLeaveBalance(int $employeeId): array
    {
        $leaveBalance = LeaveBalance::where('employee_id', $employeeId)
            ->where('year', now()->year)
            ->sum('available');

        return [
            'leave_balance_total' => (int) $leaveBalance,
        ];
    }

    /**
     * Get complete employee summary for dashboard
     */
    public function getEmployeeSummary(int $employeeId, ?string $period = null): array
    {
        $personalSummary = $this->getPersonalSummary($employeeId);
        $leaveBalance = $this->getLeaveBalance($employeeId);
        
        // Get today's clock status
        $today = Carbon::today();
        $todayLog = AttendanceLog::where('employee_id', $employeeId)
            ->whereDate('timestamp', $today)
            ->orderBy('timestamp', 'desc')
            ->first();

        $clockStatus = 'not_started';
        $clockInTime = null;
        if ($todayLog) {
            $clockStatus = $todayLog->check_type === 'check_in' ? 'clocked_in' : 'clocked_out';
            if ($todayLog->check_type === 'check_in') {
                $clockInTime = $todayLog->timestamp->format('H:i:s');
            }
        }

        // Get weekly attendance breakdown (last 4 weeks)
        $weeks = [];
        for ($i = 3; $i >= 0; $i--) {
            $weekStart = Carbon::now()->subWeeks($i)->startOfWeek();
            $weekEnd   = Carbon::now()->subWeeks($i)->endOfWeek();
            $weekRecs  = AttendanceRecord::where('employee_id', $employeeId)
                ->whereBetween('attendance_date', [$weekStart, $weekEnd])
                ->get();
            $weeks[] = [
                'week'    => 'Week ' . (4 - $i),
                'present' => $weekRecs->whereIn('status', ['present', 'partial'])->count(),
                'late'    => $weekRecs->where('late_minutes', '>', 0)->count(),
                'absent'  => $weekRecs->where('status', 'absent')->count(),
            ];
        }

        return array_merge($personalSummary, $leaveBalance, [
            'clock_status' => $clockStatus,
            'clock_in_time' => $clockInTime,
            'attendance_by_week' => $weeks,
            'days_present' => $personalSummary['present_days'],
            'days_absent' => $personalSummary['absent_days'],
            'late_days' => $personalSummary['late_days'],
        ]);
    }

    /**
     * Get milestones (birthdays, anniversaries, etc.)
     */
    public function getMilestones(): array
    {
        $today = Carbon::today();
        $thisMonth = $today->month;
        
        // Birthdays this month
        $birthdays = Employee::where('status', 'active')
            ->whereMonth('date_of_birth', $thisMonth)
            ->with('user:id,name')
            ->get()
            ->map(function($emp) use ($today) {
                $birthday = Carbon::parse($emp->date_of_birth)->setYear($today->year);
                return [
                    'type' => 'birthday',
                    'employee_name' => $emp->full_name,
                    'date' => $birthday->format('M d'),
                    'is_today' => $birthday->isToday(),
                ];
            })
            ->sortBy('date')
            ->values()
            ->toArray();

        // Work anniversaries this month
        $anniversaries = Employee::where('status', 'active')
            ->whereMonth('hire_date', $thisMonth)
            ->with('user:id,name')
            ->get()
            ->map(function($emp) use ($today) {
                $hireDate = Carbon::parse($emp->hire_date);
                $anniversary = $hireDate->setYear($today->year);
                $years = $today->year - $hireDate->year;
                
                if ($years > 0) {
                    return [
                        'type' => 'anniversary',
                        'employee_name' => $emp->full_name,
                        'date' => $anniversary->format('M d'),
                        'years' => $years,
                        'is_today' => $anniversary->isToday(),
                    ];
                }
                return null;
            })
            ->filter()
            ->sortBy('date')
            ->values()
            ->toArray();

        return [
            'birthdays' => $birthdays,
            'anniversaries' => $anniversaries,
        ];
    }
}
