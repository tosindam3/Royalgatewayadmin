<?php

namespace App\Http\Controllers\Api\V1\Dashboard;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use App\Services\DashboardCacheService;
use App\Services\ScopeEngine;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MetricController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected DashboardService $dashboardService,
        protected DashboardCacheService $cache,
        protected ScopeEngine $scopeEngine,
    ) {}

    /**
     * Resolve branch scope for the user.
     * - Privileged roles (super_admin, admin, ceo, hr_manager) → null (org-wide)
     * - branch_manager → their branch_id
     * - Others → null
     */
    private function resolveBranchId($user): ?int
    {
        $scopeLevel = $this->scopeEngine->getUserScope($user, 'dashboard.view');
        if ($scopeLevel === 'branch') {
            return $user->employeeProfile?->branch_id;
        }
        return null;
    }

    /**
     * Check if user can access management-level dashboard data.
     * Privileged roles bypass; branch_manager has dashboard.view (branch).
     * Employees with dashboard.view (self) are excluded — they use my-summary only.
     */
    private function canViewDashboard($user): bool
    {
        if ($this->scopeEngine->hasPermission($user, 'dashboard.management')) {
            return true;
        }
        // Allow branch-scoped access (branch_manager)
        $scope = $this->scopeEngine->getUserScope($user, 'dashboard.view');
        return in_array($scope, ['all', 'branch', 'department', 'team']);
    }

    public function quickStats(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$this->canViewDashboard($user)) {
            return $this->error('Unauthorized', 403);
        }

        $branchId = $this->resolveBranchId($user);
        $key  = $this->cache->key('quick_stats', $user->id, $branchId ?? 'all');
        $data = $this->cache->remember($key, DashboardCacheService::TTL_QUICK_STATS, fn() =>
            $this->dashboardService->getQuickStats($branchId)
        );

        return $this->success($data);
    }

    public function talentTrends(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$this->scopeEngine->hasPermission($user, 'dashboard.management')) {
            return $this->error('Unauthorized', 403);
        }

        $branchId = $this->resolveBranchId($user);
        $key  = $this->cache->key('talent_trends', $user->id, $branchId ?? 'all');
        $data = $this->cache->remember($key, DashboardCacheService::TTL_TALENT_TRENDS, fn() =>
            $this->dashboardService->getTalentTrends($branchId)
        );

        return $this->success($data);
    }

    public function attendancePulse(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$this->canViewDashboard($user)) {
            return $this->error('Unauthorized', 403);
        }

        $branchId = $this->resolveBranchId($user);
        $key  = $this->cache->key('attendance_pulse', $user->id, $branchId ?? 'all');
        $data = $this->cache->remember($key, DashboardCacheService::TTL_ATTENDANCE_PULSE, fn() =>
            $this->dashboardService->getAttendanceHealth($branchId)
        );

        return $this->success($data);
    }

    public function demographics(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$this->scopeEngine->hasPermission($user, 'dashboard.management')) {
            return $this->error('Unauthorized', 403);
        }

        $branchId = $this->resolveBranchId($user);
        $key  = $this->cache->key('demographics', $user->id, $branchId ?? 'all');
        $data = $this->cache->remember($key, DashboardCacheService::TTL_DEMOGRAPHICS, fn() =>
            $this->dashboardService->getDemographics($branchId)
        );

        return $this->success($data);
    }

    /**
     * GET /api/v1/dashboard/metrics/my-summary
     * Auth only — always scoped to the authenticated user's own employee record.
     */
    public function mySummary(Request $request): JsonResponse
    {
        $user       = $request->user();
        $employeeId = $user->employeeProfile?->id;

        if (!$employeeId) {
            return $this->success([
                'days_present'        => 0,
                'days_absent'         => 0,
                'late_days'           => 0,
                'leave_balance_total' => 0,
                'clock_status'        => 'not_started',
                'clock_in_time'       => null,
                'attendance_by_week'  => [],
            ]);
        }

        $key  = $this->cache->key('my_summary', $user->id);
        $data = $this->cache->remember($key, DashboardCacheService::TTL_MY_SUMMARY, fn() =>
            $this->dashboardService->getPersonalSummary($employeeId)
        );

        return $this->success($data);
    }
}
