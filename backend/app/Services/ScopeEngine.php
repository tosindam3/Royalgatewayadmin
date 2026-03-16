<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class ScopeEngine
{
    /**
     * Apply scope to query based on user permissions
     */
    public function applyScope(Builder $query, User $user, string $permission): Builder
    {
        $scope = $this->getUserScope($user, $permission);
        
        return $this->applyScopeLevel($query, $user, $scope);
    }

    /**
     * Get the highest scope level a user has for a permission
     */
    public function getUserScope(User $user, string $permission): string
    {
        $privilegedRoles = ['super_admin', 'admin', 'ceo', 'hr_manager'];
        $legacyRole = $user->attributes['role'] ?? null;
        if (($legacyRole && in_array($legacyRole, $privilegedRoles)) || $user->hasAnyRole($privilegedRoles)) {
            return 'all';
        }

        $scopes = [];

        // Check primary role
        if ($user->primaryRole) {
            $rolePermission = $user->primaryRole->permissions()
                ->where('permissions.name', $permission)
                ->first();
                
            if ($rolePermission) {
                $scopes[] = $rolePermission->pivot->scope_level;
            }
        }
        
        // Check extra roles
        foreach ($user->roles as $role) {
            $rolePermission = $role->permissions()
                ->where('permissions.name', $permission)
                ->first();
                
            if ($rolePermission) {
                $scopes[] = $rolePermission->pivot->scope_level;
            }
        }
        
        if (empty($scopes)) {
            return 'none';
        }
        
        // Return highest scope (all > branch > department > team > self)
        $scopeHierarchy = ['all', 'branch', 'department', 'team', 'self'];
        
        foreach ($scopeHierarchy as $level) {
            if (in_array($level, $scopes)) {
                return $level;
            }
        }
        
        return 'self';
    }

    /**
     * Apply scope level to query
     */
    public function applyScopeLevel(Builder $query, User $user, string $scope): Builder
    {
        switch ($scope) {
            case 'all':
                // No restrictions
                return $query;
                
            case 'branch':
                return $this->applyBranchScope($query, $user);
                
            case 'department':
                return $this->applyDepartmentScope($query, $user);
                
            case 'team':
                return $this->applyTeamScope($query, $user);
                
            case 'self':
                return $this->applySelfScope($query, $user);
                    
            case 'none':
            default:
                // No access - return empty result
                return $query->whereRaw('1 = 0');
        }
    }

    /**
     * Apply branch-level scope
     */
    protected function applyBranchScope(Builder $query, User $user): Builder
    {
        if (!$user->employee || !$user->employee->branch_id) {
            return $query->whereRaw('1 = 0');
        }

        $column = $this->getColumnForModel($query->getModel(), 'branch_id');
        return $query->where($column, $user->employee->branch_id);
    }

    /**
     * Apply department-level scope
     */
    protected function applyDepartmentScope(Builder $query, User $user): Builder
    {
        if (!$user->employee || !$user->employee->department_id) {
            return $query->whereRaw('1 = 0');
        }

        $column = $this->getColumnForModel($query->getModel(), 'department_id');
        return $query->where($column, $user->employee->department_id);
    }

    /**
     * Apply team-level scope (direct reports)
     */
    protected function applyTeamScope(Builder $query, User $user): Builder
    {
        if (!$user->employee) {
            return $query->whereRaw('1 = 0');
        }

        $column = $this->getColumnForModel($query->getModel(), 'manager_id');
        return $query->where($column, $user->employee->id);
    }

    /**
     * Apply self-level scope
     */
    protected function applySelfScope(Builder $query, User $user): Builder
    {
        if (!$user->employee) {
            return $query->whereRaw('1 = 0');
        }

        $column = $this->getColumnForModel($query->getModel(), 'employee_id');
        return $query->where($column, $user->employee->id);
    }

    /**
     * Get column name for a model based on generic scope requirements
     */
    protected function getColumnForModel($model, string $genericField): string
    {
        $class = get_class($model);
        
        $mappings = [
            \App\Models\PerformanceSubmission::class => [
                'employee_id' => 'employee_id',
                'branch_id' => 'branch_id',
                'department_id' => 'department_id',
            ],
            \App\Models\Employee::class => [
                'employee_id' => 'id',
                'branch_id' => 'branch_id',
                'department_id' => 'department_id',
            ]
        ];

        return $mappings[$class][$genericField] ?? $genericField;
    }

    /**
     * Get accessible branch IDs for user
     */
    public function getAccessibleBranchIds(User $user, string $permission): array
    {
        $scope = $this->getUserScope($user, $permission);

        switch ($scope) {
            case 'all':
                return \App\Models\Branch::pluck('id')->toArray();
                
            case 'branch':
                return $user->employee && $user->employee->branch_id 
                    ? [$user->employee->branch_id] 
                    : [];
                
            default:
                return [];
        }
    }

    /**
     * Check if user can access specific branch
     */
    public function canAccessBranch(User $user, int $branchId, string $permission): bool
    {
        $scope = $this->getUserScope($user, $permission);

        if ($scope === 'all') {
            return true;
        }

        if ($scope === 'branch') {
            return $user->employee && $user->employee->branch_id === $branchId;
        }

        return false;
    }

    /**
     * Check if user has permission with required scope
     */
    public function hasPermission(User $user, string $permission, string $requiredScope = 'self'): bool
    {
        $userScope = $this->getUserScope($user, $permission);
        
        if ($userScope === 'none') {
            return false;
        }
        
        return $this->isScopeSufficient($userScope, $requiredScope);
    }

    /**
     * Check if user's scope is sufficient for required scope
     */
    public function isScopeSufficient(string $userScope, string $requiredScope): bool
    {
        $scopeHierarchy = [
            'all' => 5,
            'branch' => 4,
            'department' => 3,
            'team' => 2,
            'self' => 1,
            'none' => 0,
        ];
        
        return ($scopeHierarchy[$userScope] ?? 0) >= ($scopeHierarchy[$requiredScope] ?? 0);
    }

    /**
     * Get all permissions for a user with their scopes
     */
    public function getUserPermissions(User $user): array
    {
        $permissions = [];

        // Process primary role
        if ($user->primaryRole) {
            foreach ($user->primaryRole->permissions as $permission) {
                $scope = $permission->pivot->scope_level;
                $permissionName = $permission->name;
                
                if (!isset($permissions[$permissionName]) || 
                    $this->isScopeSufficient($scope, $permissions[$permissionName])) {
                    $permissions[$permissionName] = $scope;
                }
            }
        }
        
        // Process extra roles
        foreach ($user->roles as $role) {
            foreach ($role->permissions as $permission) {
                $scope = $permission->pivot->scope_level;
                $permissionName = $permission->name;
                
                // Keep highest scope if permission already exists
                if (!isset($permissions[$permissionName]) || 
                    $this->isScopeSufficient($scope, $permissions[$permissionName])) {
                    $permissions[$permissionName] = $scope;
                }
            }
        }
        
        return $permissions;
    }
}
