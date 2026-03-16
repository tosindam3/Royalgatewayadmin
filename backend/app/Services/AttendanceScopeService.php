<?php

namespace App\Services;

use App\Models\User;
use App\Models\Employee;
use Illuminate\Database\Eloquent\Builder;

class AttendanceScopeService
{
    protected $scopeEngine;

    public function __construct(ScopeEngine $scopeEngine)
    {
        $this->scopeEngine = $scopeEngine;
    }

    /**
     * Determine what attendance data a user can access
     */
    public function getAccessScope(User $user): array
    {
        $viewScope = $this->scopeEngine->getUserScope($user, 'attendance.view');
        
        if ($viewScope === 'none') {
            return [
                'scope' => 'none',
                'employee_ids' => [],
                'department_ids' => [],
                'branch_ids' => [],
                'can_view_all' => false,
                'can_manage_settings' => false,
                'can_approve_corrections' => false,
                'can_export' => false,
            ];
        }

        // Get employee IDs based on scope
        $query = Employee::where('status', 'active');
        $query = $this->scopeEngine->applyScopeLevel($query, $user, $viewScope);
        $employeeIds = $query->pluck('id')->toArray();

        return [
            'scope' => $viewScope,
            'employee_ids' => $employeeIds,
            'department_ids' => $viewScope === 'department' ? [$user->employeeProfile?->department_id] : [],
            'branch_ids' => $viewScope === 'branch' ? [$user->employeeProfile?->branch_id] : [],
            'can_view_all' => $viewScope === 'all',
            'can_manage_settings' => $this->scopeEngine->hasPermission($user, 'attendance.settings'),
            'can_approve_corrections' => $this->scopeEngine->hasPermission($user, 'attendance.approve-correction'),
            'can_export' => $this->scopeEngine->hasPermission($user, 'attendance.export'),
        ];
    }

    /**
     * Apply scope to attendance records query
     */
    public function applyScopeToQuery(Builder $query, User $user): Builder
    {
        $viewScope = $this->scopeEngine->getUserScope($user, 'attendance.view');
        
        if ($viewScope === 'all') {
            return $query;
        }
        
        if ($viewScope === 'none') {
            return $query->whereRaw('1 = 0');
        }

        // Filter by employees accessible within the scope
        $accessibleEmployeeIds = $this->getAccessScope($user)['employee_ids'];
        return $query->whereIn('employee_id', $accessibleEmployeeIds);
    }

    /**
     * Check if user can view specific employee's attendance
     */
    public function canViewEmployee(User $user, int $employeeId): bool
    {
        $scope = $this->getAccessScope($user);
        return in_array($employeeId, $scope['employee_ids']);
    }

    /**
     * Check if user can manage attendance settings
     */
    public function canManageSettings(User $user): bool
    {
        return $this->scopeEngine->hasPermission($user, 'attendance.settings');
    }

    /**
     * Check if user can approve corrections
     */
    public function canApproveCorrections(User $user): bool
    {
        return $this->scopeEngine->hasPermission($user, 'attendance.approve-correction');
    }

    /**
     * Check if user can export reports
     */
    public function canExport(User $user): bool
    {
        return $this->scopeEngine->hasPermission($user, 'attendance.export');
    }

    /**
     * Get filtered employee list based on scope
     */
    public function getAccessibleEmployees(User $user): \Illuminate\Database\Eloquent\Collection
    {
        $viewScope = $this->scopeEngine->getUserScope($user, 'attendance.view');
        $query = Employee::where('status', 'active')->with(['user', 'department', 'branch']);
        
        return $this->scopeEngine->applyScopeLevel($query, $user, $viewScope)->get();
    }
}
