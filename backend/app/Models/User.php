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
        return $this->roles()->where('name', $roleName)->exists();
    }

    /**
     * Check if user has any of the given roles
     */
    public function hasAnyRole(array $roleNames): bool
    {
        return $this->roles()->whereIn('name', $roleNames)->exists();
    }

    /**
     * Check if user has a specific permission
     */
    public function hasPermission(string $permission, string $scope = null): bool
    {
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
}
