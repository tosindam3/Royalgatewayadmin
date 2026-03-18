<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\AttendanceLog;
use App\Models\PayrollRun;
use App\Models\PerformanceSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use App\Traits\ApiResponse;

class DashboardController extends Controller
{
    use ApiResponse;

    /**
     * Get dashboard configuration and widget manifest.
     * Tells the frontend which widgets are authorized and where to fetch them.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $isManagement = $user->hasPermission('dashboard.management');
        
        // Determine effective role for frontend
        $effectiveRole = 'employee';
        if ($user->hasPermission('dashboard.management')) {
            $effectiveRole = 'management';
        }

        $manifest = [
            'layout' => 'standard',
            'widgets' => [
                [
                    'key' => 'quick-stats',
                    'endpoint' => '/dashboard/metrics/quick-stats',
                    'type' => 'metric_group',
                    'authorized' => $isManagement
                ],
                [
                    'key' => 'talent-trends',
                    'endpoint' => '/dashboard/metrics/talent-trends',
                    'type' => 'chart_area',
                    'authorized' => $isManagement
                ],
                [
                    'key' => 'attendance-pulse',
                    'endpoint' => '/dashboard/metrics/attendance-pulse',
                    'type' => 'chart_pie',
                    'authorized' => $isManagement
                ],
                [
                    'key' => 'demographics',
                    'endpoint' => '/dashboard/metrics/demographics',
                    'type' => 'demographics',
                    'authorized' => $isManagement
                ],
                [
                    'key' => 'milestones',
                    'endpoint' => null, // Static or embedded for speed
                    'type' => 'list_milestones',
                    'authorized' => true,
                    'data' => (new \App\Services\DashboardService())->getMilestones()
                ],
                [
                    'key' => 'employee-summary',
                    'endpoint' => '/dashboard/metrics/employee-summary',
                    'type' => 'employee_metrics',
                    'authorized' => !$isManagement
                ]
            ],
            'meta' => [
                'user_role' => $effectiveRole,
                'is_management' => $isManagement,
                'last_updated' => now()->toIso8601String()
            ]
        ];

        return $this->success($manifest);
    }

    public function employeeSummary(Request $request)
    {
        $employee = $request->user()->employeeProfile;
        if (!$employee) {
            return $this->error('Employee profile not found', 404);
        }

        $service = new \App\Services\DashboardService();
        $summary = $service->getPersonalSummary($employee->id);
        
        // Get leave balance
        $leaveBalance = $service->getLeaveBalance($employee->id);
        
        // Merge the data
        $data = array_merge($summary, $leaveBalance);
        
        // Add clock status from today's attendance
        $todayRecord = \App\Models\AttendanceRecord::where('employee_id', $employee->id)
            ->whereDate('attendance_date', now()->toDateString())
            ->first();
        
        $clockStatus = 'not_started';
        $clockInTime = null;
        
        if ($todayRecord && $todayRecord->check_in_time) {
            $clockStatus = $todayRecord->check_out_time ? 'clocked_out' : 'clocked_in';
            $clockInTime = $todayRecord->check_in_time->format('H:i:s');
        }
        
        $data['clock_status'] = $clockStatus;
        $data['clock_in_time'] = $clockInTime;
        
        // Add weekly attendance breakdown
        $weeks = [];
        for ($i = 3; $i >= 0; $i--) {
            $weekStart = \Carbon\Carbon::now()->subWeeks($i)->startOfWeek();
            $weekEnd   = \Carbon\Carbon::now()->subWeeks($i)->endOfWeek();
            $weekRecs  = \App\Models\AttendanceRecord::where('employee_id', $employee->id)
                ->whereBetween('attendance_date', [$weekStart, $weekEnd])
                ->get();
            $weeks[] = [
                'week'    => 'Week ' . (4 - $i),
                'present' => $weekRecs->whereIn('status', ['present', 'partial'])->count(),
                'late'    => $weekRecs->where('late_minutes', '>', 0)->count(),
                'absent'  => $weekRecs->where('status', 'absent')->count(),
            ];
        }
        
        $data['attendance_by_week'] = $weeks;
        
        // Rename keys to match frontend expectations
        $data['days_present'] = $data['present_days'];
        $data['days_absent'] = $data['absent_days'];
        
        return $this->success($data);
    }
}
