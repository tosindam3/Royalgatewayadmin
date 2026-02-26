<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Workplace extends Model
{
    protected $fillable = [
        'name',
        'latitude',
        'longitude',
        'radius_meters',
        'is_active',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'radius_meters' => 'integer',
        'is_active' => 'boolean',
    ];

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    public function biometricDevices(): HasMany
    {
        return $this->hasMany(BiometricDevice::class);
    }
}
