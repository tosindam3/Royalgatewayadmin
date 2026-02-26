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
        $scopes = [];
        
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

        return $query->where('branch_id', $user->employee->branch_id);
    }

    /**
     * Apply department-level scope
     */
    protected function applyDepartmentScope(Builder $query, User $user): Builder
    {
        if (!$user->employee || !$user->employee->department_id) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where('department_id', $user->employee->department_id);
    }

    /**
     * Apply team-level scope (direct reports)
     */
    protected function applyTeamScope(Builder $query, User $user): Builder
    {
        if (!$user->employee) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where('manager_id', $user->employee->id);
    }

    /**
     * Apply self-level scope
     */
    protected function applySelfScope(Builder $query, User $user): Builder
    {
        if (!$user->employee) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where('id', $user->employee->id);
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
    protected function isScopeSufficient(string $userScope, string $requiredScope): bool
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
