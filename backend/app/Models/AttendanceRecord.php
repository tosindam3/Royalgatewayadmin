<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AttendanceRecord extends Model
{
    protected $fillable = [
        'employee_id',
        'attendance_date',
        'check_in_time',
        'check_out_time',
        'work_minutes',
        'late_minutes',
        'overtime_minutes',
        'break_minutes',
        'status',
        'source',
        'branch_id',
        'department_id',
        'approval_status',
        'payroll_locked',
        'geo_lat',
        'geo_long',
        'geo_accuracy_m',
        'geofence_expected_lat',
        'geofence_expected_long',
        'geofence_radius_m',
        'geofence_distance_m',
        'geofence_status',
        'geofence_violation_reason',
    ];

    protected $casts = [
        'attendance_date' => 'date',
        'check_in_time' => 'datetime',
        'check_out_time' => 'datetime',
        'work_minutes' => 'integer',
        'late_minutes' => 'integer',
        'overtime_minutes' => 'integer',
        'break_minutes' => 'integer',
        'payroll_locked' => 'boolean',
        'geo_lat' => 'decimal:8',
        'geo_long' => 'decimal:8',
        'geo_accuracy_m' => 'float',
        'geofence_expected_lat' => 'decimal:8',
        'geofence_expected_long' => 'decimal:8',
        'geofence_radius_m' => 'integer',
        'geofence_distance_m' => 'float',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Branch::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Department::class);
    }

    public function corrections(): HasMany
    {
        return $this->hasMany(AttendanceCorrection::class);
    }

    // Scopes
    public function scopeForMonth($query, string $month)
    {
        return $query->whereYear('attendance_date', substr($month, 0, 4))
                     ->whereMonth('attendance_date', substr($month, 5, 2));
    }

    public function scopeForEmployee($query, int $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }

    public function scopePresent($query)
    {
        return $query->whereIn('status', ['present', 'on_time']);
    }

    public function scopeAbsent($query)
    {
        return $query->where('status', 'absent');
    }

    public function scopeLate($query)
    {
        return $query->where('late_minutes', '>', 0);
    }
    
    // Accessors for compatibility
    public function getWorkDateAttribute()
    {
        return $this->attendance_date;
    }
    
    public function getClockInAtAttribute()
    {
        return $this->check_in_time;
    }
    
    public function getClockOutAtAttribute()
    {
        return $this->check_out_time;
    }
    
    public function getMinutesWorkedAttribute()
    {
        return abs($this->work_minutes); // Use abs since some values are negative
    }
    
    public function getHasMissingPunchAttribute()
    {
        return $this->check_in_time && !$this->check_out_time;
    }
    
    public function getIsEditedAttribute()
    {
        return false; // Not tracked in current schema
    }
    
    public function getHasDuplicateAttribute()
    {
        return false; // Not tracked in current schema
    }
    
    public function getSourceInAttribute()
    {
        return $this->mapSource($this->source);
    }
    
    public function getSourceOutAttribute()
    {
        return $this->mapSource($this->source);
    }
    
    public function getGeofenceStatusInAttribute()
    {
        return $this->mapGeofenceStatus($this->geofence_status);
    }
    
    public function getGeofenceStatusOutAttribute()
    {
        return $this->mapGeofenceStatus($this->geofence_status);
    }
    
    private function mapSource($source)
    {
        return match($source) {
            'mobile', 'mobile_app' => 'app',
            'biometric', 'device' => 'device',
            'import', 'usb' => 'import',
            default => 'app',
        };
    }
    
    private function mapGeofenceStatus($status)
    {
        return match($status) {
            'within', 'pass' => 'pass',
            'outside', 'fail' => 'fail',
            'bypass' => 'bypass',
            default => 'na',
        };
    }
}
