<?php

namespace App\Services;

use App\Models\User;
use App\Models\Employee;
use Illuminate\Database\Eloquent\Builder;

class AttendanceScopeService
{
    /**
     * Determine what attendance data a user can access
     */
    public function getAccessScope(User $user): array
    {
        // Check roles first - using standardized slugs
        $roles = $user->roles->pluck('name')->toArray();
        
        // Super Admin / CEO / HR Manager - Full access
        // We check this BEFORE the employee profile check because admins may not have an employee record
        if (in_array('super_admin', $roles) || in_array('admin', $roles) || in_array('ceo', $roles) || in_array('hr_manager', $roles)) {
            return [
                'scope' => 'all',
                'employee_ids' => Employee::where('status', 'active')->pluck('id')->toArray(),
                'department_ids' => [],
                'branch_ids' => [],
                'can_view_all' => true,
                'can_manage_settings' => true,
                'can_approve_corrections' => true,
                'can_export' => true,
            ];
        }

        $employee = $user->employeeProfile;
        
        if (!$employee) {
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
        
        // Branch Manager - Branch access
        if (in_array('branch_manager', $roles)) {
            $branchEmployees = Employee::where('status', 'active')
                ->where('branch_id', $employee->branch_id)
                ->pluck('id')
                ->toArray();
            
            return [
                'scope' => 'branch',
                'employee_ids' => $branchEmployees,
                'department_ids' => [],
                'branch_ids' => [$employee->branch_id],
                'can_view_all' => false,
                'can_manage_settings' => false,
                'can_approve_corrections' => true,
                'can_export' => true,
            ];
        }
        
        // Department Head - Department access
        if (in_array('department_head', $roles)) {
            $departmentEmployees = Employee::where('status', 'active')
                ->where('department_id', $employee->department_id)
                ->pluck('id')
                ->toArray();
            
            return [
                'scope' => 'department',
                'employee_ids' => $departmentEmployees,
                'department_ids' => [$employee->department_id],
                'branch_ids' => [],
                'can_view_all' => false,
                'can_manage_settings' => false,
                'can_approve_corrections' => true,
                'can_export' => true,
            ];
        }
        
        // Team Lead - Team access (direct reports)
        if (in_array('team_lead', $roles)) {
            $teamEmployees = Employee::where('status', 'active')
                ->where('manager_id', $employee->id)
                ->pluck('id')
                ->toArray();
            
            // Include self
            $teamEmployees[] = $employee->id;
            
            return [
                'scope' => 'team',
                'employee_ids' => $teamEmployees,
                'department_ids' => [],
                'branch_ids' => [],
                'can_view_all' => false,
                'can_manage_settings' => false,
                'can_approve_corrections' => true,
                'can_export' => false,
            ];
        }
        
        // Regular Employee - Self only
        return [
            'scope' => 'self',
            'employee_ids' => [$employee->id],
            'department_ids' => [],
            'branch_ids' => [],
            'can_view_all' => false,
            'can_manage_settings' => false,
            'can_approve_corrections' => false,
            'can_export' => false,
        ];
    }

    /**
     * Apply scope to attendance records query
     */
    public function applyScopeToQuery(Builder $query, User $user): Builder
    {
        $scope = $this->getAccessScope($user);
        
        if ($scope['scope'] === 'all') {
            return $query; // No restrictions
        }
        
        if ($scope['scope'] === 'none') {
            return $query->whereRaw('1 = 0'); // Return nothing
        }
        
        // Apply employee ID restrictions
        return $query->whereIn('employee_id', $scope['employee_ids']);
    }

    /**
     * Check if user can view specific employee's attendance
     */
    public function canViewEmployee(User $user, int $employeeId): bool
    {
        $scope = $this->getAccessScope($user);
        
        if ($scope['can_view_all']) {
            return true;
        }
        
        return in_array($employeeId, $scope['employee_ids']);
    }

    /**
     * Check if user can manage attendance settings
     */
    public function canManageSettings(User $user): bool
    {
        $scope = $this->getAccessScope($user);
        return $scope['can_manage_settings'];
    }

    /**
     * Check if user can approve corrections
     */
    public function canApproveCorrections(User $user): bool
    {
        $scope = $this->getAccessScope($user);
        return $scope['can_approve_corrections'];
    }

    /**
     * Check if user can export reports
     */
    public function canExport(User $user): bool
    {
        $scope = $this->getAccessScope($user);
        return $scope['can_export'] ?? false;
    }

    /**
     * Get filtered employee list based on scope
     */
    public function getAccessibleEmployees(User $user): \Illuminate\Database\Eloquent\Collection
    {
        $scope = $this->getAccessScope($user);
        
        if ($scope['scope'] === 'all') {
            return Employee::where('status', 'active')
                ->with(['user', 'department', 'branch'])
                ->get();
        }
        
        return Employee::whereIn('id', $scope['employee_ids'])
            ->where('status', 'active')
            ->with(['user', 'department', 'branch'])
            ->get();
    }
}
