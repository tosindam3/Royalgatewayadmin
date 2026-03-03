<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Branch extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'location',
        'address',
        'city',
        'country',
        'type',
        'is_hq',
        'manager_id',
        'timezone',
        'status',
        'employee_count',
        'device_count',
        'latitude',
        'longitude',
    ];

    protected $casts = [
        'is_hq' => 'boolean',
        'employee_count' => 'integer',
        'device_count' => 'integer',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
    ];

    protected $appends = [];

    public function getManagerNameAttribute()
    {
        return $this->manager ? $this->manager->full_name : null;
    }

    public function departments(): HasMany
    {
        return $this->hasMany(Department::class);
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'manager_id');
    }

    public function geofenceZones(): HasMany
    {
        return $this->hasMany(GeofenceZone::class);
    }

    public function biometricDevices(): HasMany
    {
        return $this->hasMany(BiometricDevice::class);
    }

    public function workSchedules(): HasMany
    {
        return $this->hasMany(WorkSchedule::class);
    }


    // Get today's attendance summary for this branch
    public function getAttendanceTodayAttribute()
    {
        // This will be implemented when attendance module is ready
        return [
            'present' => 0,
            'late' => 0,
            'absent' => 0,
        ];
    }
}
