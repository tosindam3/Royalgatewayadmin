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

        // Resolve effective role with multiple fallback layers:
        // 1. primaryRole relationship (eager loaded)
        // 2. roles pivot (eager loaded)
        // 3. role convenience column
        // 4. Direct DB query on user_roles pivot (bypasses broken FK / stale cache)
        // 5. Default to 'employee'
        $effectiveRole = ($user->primaryRole?->name ?: null)
            ?: ($user->roles->first()?->name ?: null)
            ?: ($user->role ?: null)
            ?: (\DB::table('user_roles')
                ->join('roles', 'user_roles.role_id', '=', 'roles.id')
                ->where('user_roles.user_id', $user->id)
                ->whereNotNull('roles.name')
                ->where('roles.name', '!=', '')
                ->orderByRaw("FIELD(roles.name, 'super_admin', 'admin', 'ceo', 'hr_manager', 'branch_manager', 'department_head', 'employee')")
                ->value('roles.name'))
            ?: 'employee';

        $managementRoles = ['super_admin', 'admin', 'ceo', 'hr_manager', 'branch_manager', 'department_head'];
        $isManagement = in_array($effectiveRole, $managementRoles);

        \Log::info('Dashboard Manifest Access', [
            'user_id' => $user->id,
            'email' => $user->email,
            'effective_role' => $effectiveRole,
            'is_management' => $isManagement,
            'primary_role_name' => $user->primaryRole?->name,
            'role_column' => $user->role,
            'pivot_roles' => $user->roles->pluck('name')->toArray(),
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
                'user_role' => $effectiveRole,
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
