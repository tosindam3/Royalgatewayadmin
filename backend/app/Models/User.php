<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'status',
        'department',
        'position',
        'primary_role_id',
        'branch_id',
        'department_id',
        'manager_id',
    ];

    protected $with = ['roles.permissions', 'employeeProfile'];
    protected $appends = ['employee_id', 'display_name'];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Roles relationship
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles')
            ->withPivot('assigned_by', 'assigned_at', 'expires_at')
            ->withTimestamps();
    }

    /**
     * Primary role relationship
     */
    public function primaryRole(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'primary_role_id');
    }

    /**
     * Manager relationship
     */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    /**
     * Employee profile relationship
     */
    public function employeeProfile()
    {
        return $this->hasOne(\App\Models\Employee::class, 'user_id');
    }

    /**
     * Alias for employeeProfile
     */
    public function employee()
    {
        return $this->employeeProfile();
    }

    /**
     * Accessor for employee_id
     */
    public function getEmployeeIdAttribute()
    {
        return $this->employeeProfile->id ?? null;
    }

    /**
     * Accessor for display_name
     */
    public function getDisplayNameAttribute()
    {
        return $this->employeeProfile?->full_name ?? $this->name;
    }

    /**
     * Attendance logs relationship
     */
    public function attendanceLogs()
    {
        return $this->hasMany(\App\Models\AttendanceLog::class, 'employee_id');
    }

    /**
     * Check if user has a specific role
     */
    public function hasRole(string $roleName): bool
    {
        // Internal consistency: roles are saved as slugs now
        return $this->roles->contains('name', $roleName);
    }

    /**
     * Check if user has any of the given roles
     */
    public function hasAnyRole(array $roleNames): bool
    {
        return $this->roles->whereIn('name', $roleNames)->isNotEmpty();
    }

    /**
     * Check if user has a specific permission
     */
    public function hasPermission(string $permission, string $scope = null): bool
    {
        // 1. Super Admin & CEO Bypass
        if ($this->hasAnyRole(['super_admin', 'ceo'])) {
            return true;
        }

        // 2. Check explicitly assigned roles
        foreach ($this->roles as $role) {
            if ($role->hasPermission($permission, $scope)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Assign a role to user
     */
    public function assignRole(Role $role, ?User $assignedBy = null): void
    {
        $this->roles()->syncWithoutDetaching([
            $role->id => [
                'assigned_by' => $assignedBy?->id,
                'assigned_at' => now(),
            ]
        ]);
    }

    /**
     * Remove a role from user
     */
    public function removeRole(Role $role): void
    {
        $this->roles()->detach($role->id);
    }

    /**
     * Sync user roles
     */
    public function syncRoles(array $roleIds, ?User $assignedBy = null): void
    {
        $syncData = [];
        foreach ($roleIds as $roleId) {
            $syncData[$roleId] = [
                'assigned_by' => $assignedBy?->id,
                'assigned_at' => now(),
            ];
        }
        $this->roles()->sync($syncData);
    }
    /**
     * Get permission scope for a specific permission
     * Returns the most permissive scope from all user roles
     */
    public function getPermissionScope(string $permission): ?string
    {
        // Super Admin & CEO Bypass
        if ($this->hasAnyRole(['super_admin', 'ceo'])) {
            return 'all';
        }

        $scopes = [];

        foreach ($this->roles as $role) {
            $scope = $role->getPermissionScope($permission);
            if ($scope) {
                $scopes[] = $scope;
            }
        }

        if (empty($scopes)) {
            return null;
        }

        // Return most permissive scope
        // Order: all > branch > department > team > self
        $scopeHierarchy = ['all', 'branch', 'department', 'team', 'self'];

        foreach ($scopeHierarchy as $hierarchyScope) {
            if (in_array($hierarchyScope, $scopes)) {
                return $hierarchyScope;
            }
        }

        return $scopes[0];
    }

}
