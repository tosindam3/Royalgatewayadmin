<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permission extends Model
{
    protected $fillable = [
        'name',
        'display_name',
        'module',
        'action',
        'description',
        'available_scopes',
        'is_system',
    ];

    protected $casts = [
        'available_scopes' => 'array',
        'is_system' => 'boolean',
    ];

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_permissions')
            ->withPivot('scope_level')
            ->withTimestamps();
    }

    /**
     * Check if scope is available for this permission
     */
    public function hasScopeAvailable(string $scope): bool
    {
        return in_array($scope, $this->available_scopes ?? []);
    }

    /**
     * Get permissions grouped by module
     */
    public static function groupedByModule(): array
    {
        return static::orderBy('module')->orderBy('action')
            ->get()
            ->groupBy('module')
            ->toArray();
    }
}
