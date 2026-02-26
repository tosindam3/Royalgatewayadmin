<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceLog extends Model
{
    protected $fillable = [
        'employee_id',
        'check_type',
        'timestamp',
        'source',
        'device_id',
        'location_lat',
        'location_lng',
        'photo_url',
        'verified',
        'sync_status',
        'status',
        'geofence_zone_id',
    ];

    protected $casts = [
        'timestamp' => 'datetime',
        'verified' => 'boolean',
        'location_lat' => 'decimal:8',
        'location_lng' => 'decimal:8',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function geofenceZone(): BelongsTo
    {
        return $this->belongsTo(GeofenceZone::class, 'geofence_zone_id');
    }

    public function scopeToday($query)
    {
        return $query->whereDate('timestamp', today());
    }

    public function scopeByEmployee($query, int $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }

    public function scopeCheckIns($query)
    {
        return $query->where('check_type', 'check_in');
    }

    public function scopeCheckOuts($query)
    {
        return $query->where('check_type', 'check_out');
    }
}
