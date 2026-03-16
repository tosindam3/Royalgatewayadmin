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
        $isManagement = $user->hasPermission('dashboard.management') ||
            $user->hasAnyRole(['branch_manager', 'department_head']);

        \Log::info('Dashboard Manifest Access', [
            'user_id' => $user->id,
            'email' => $user->email,
            'is_management' => $isManagement,
            'roles' => $user->all_roles?->pluck('name')->toArray(),
            'permissions_sample' => [
                'dashboard.view' => $user->hasPermission('dashboard.view'),
                'dashboard.management' => $user->hasPermission('dashboard.management')
            ]
        ]);

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
                'user_role' => $user->all_roles?->first()?->name ?? 'employee',
                'is_management' => $isManagement,
                'last_updated' => now()->toIso8601String()
            ]
        ];

        return $this->success($manifest);
    }

    public function employeeSummary(Request $request)
    {
        $employee = $request->user()->employee;
        if (!$employee) {
            return $this->error('Employee profile not found', 404);
        }

        $service = new \App\Services\DashboardService();
        $period = $request->query('period');
        return $this->success($service->getEmployeeSummary($employee->id, $period));
    }
}
