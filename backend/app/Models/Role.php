<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'display_name',
        'description',
        'default_scope',
        'is_system',
        'is_active',
    ];

    protected $casts = [
        'is_system' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_permissions')
            ->withPivot('scope_level')
            ->withTimestamps();
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_roles')
            ->withPivot('assigned_by', 'assigned_at', 'expires_at')
            ->withTimestamps();
    }

    public function approvalSteps(): HasMany
    {
        return $this->hasMany(ApprovalStep::class, 'approver_role_id');
    }

    /**
     * Check if role has a specific permission with scope
     */
    public function hasPermission(string $permission, string $scope = null): bool
    {
        $query = $this->permissions()->where('permissions.name', $permission);
        
        if ($scope) {
            $query->wherePivot('scope_level', $scope);
        }
        
        return $query->exists();
    }

    /**
     * Get permission scope for a specific permission
     */
    public function getPermissionScope(string $permission): ?string
    {
        $rolePermission = $this->permissions()
            ->where('permissions.name', $permission)
            ->first();
            
        return $rolePermission?->pivot->scope_level;
    }

    /**
     * Sync permissions with scopes
     */
    public function syncPermissionsWithScopes(array $permissions): void
    {
        $syncData = [];
        
        foreach ($permissions as $permissionId => $scope) {
            $syncData[$permissionId] = ['scope_level' => $scope];
        }
        
        $this->permissions()->sync($syncData);
    }
}
