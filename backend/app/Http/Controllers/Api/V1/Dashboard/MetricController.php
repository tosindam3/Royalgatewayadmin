<?php

namespace App\Http\Controllers\Api\V1\Dashboard;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use App\Services\ScopeEngine;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class MetricController extends Controller
{
    use ApiResponse;

    protected $dashboardService;
    protected $scopeEngine;

    public function __construct(DashboardService $dashboardService, ScopeEngine $scopeEngine)
    {
        $this->dashboardService = $dashboardService;
        $this->scopeEngine = $scopeEngine;
    }

    /**
     * Get quick top-level stats.
     */
    public function quickStats(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$this->scopeEngine->hasPermission($user, 'dashboard.management')) {
            return $this->error('Unauthorized', 403);
        }

        $branchId = $this->scopeEngine->getUserScope($user, 'dashboard.view') === 'branch' 
            ? $user->employeeProfile?->branch_id 
            : null;
            
        $cacheKey = "dash_quick_stats_{$user->id}";
        $data = Cache::remember($cacheKey, 300, function() use ($branchId) {
            return $this->dashboardService->getQuickStats($branchId);
        });

        return $this->success($data);
    }

    /**
     * Get talent trends.
     */
    public function talentTrends(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$this->scopeEngine->hasPermission($user, 'dashboard.management')) {
            return $this->error('Unauthorized', 403);
        }

        $branchId = $this->scopeEngine->getUserScope($user, 'dashboard.view') === 'branch' 
            ? $user->employeeProfile?->branch_id 
            : null;
            
        $cacheKey = "dash_talent_trends_{$user->id}";
        $data = Cache::remember($cacheKey, 600, function() use ($branchId) {
            return $this->dashboardService->getTalentTrends($branchId);
        });

        return $this->success($data);
    }

    /**
     * Get attendance health data.
     */
    public function attendancePulse(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$this->scopeEngine->hasPermission($user, 'dashboard.management')) {
            return $this->error('Unauthorized', 403);
        }

        $branchId = $this->scopeEngine->getUserScope($user, 'attendance.view') === 'branch' 
            ? $user->employeeProfile?->branch_id 
            : null;
            
        $cacheKey = "dash_attendance_pulse_{$user->id}";
        $data = Cache::remember($cacheKey, 120, function() use ($branchId) {
            return $this->dashboardService->getAttendanceHealth($branchId);
        });

        return $this->success($data);
    }

    /**
     * Get demographics (Management only).
     */
    public function demographics(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$this->scopeEngine->hasPermission($user, 'dashboard.management')) {
            return $this->error('Unauthorized', 403);
        }

        $branchId = $user->employeeProfile?->branch_id;
        $cacheKey = "dash_demographics_{$user->id}";
        $data = Cache::remember($cacheKey, 3600, function() use ($branchId) {
            return $this->dashboardService->getDemographics($branchId);
        });

        return $this->success($data);
    }
}
