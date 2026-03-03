<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'employee_code',
        'user_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'branch_id',
        'department_id',
        'designation_id',
        'manager_id',
        'employment_type',
        'work_mode',
        'status',
        'hire_date',
        'dob',
        'avatar',
        'blood_group',
        'genotype',
        'academics',
        'password_change_required',
        'biometric_id',
        'workplace_id',
        'work_schedule_id',
        'allow_mobile_checkin',
    ];

    protected $casts = [
        'hire_date' => 'date',
        'dob' => 'date',
        'password_change_required' => 'boolean',
        'allow_mobile_checkin' => 'boolean',
    ];

    protected $appends = ['full_name', 'staff_id', 'name'];

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function getNameAttribute(): string
    {
        return $this->full_name;
    }

    /**
     * Accessor for staff_id (returns employee_code)
     * This provides compatibility with frontend expecting staff_id
     */
    public function getStaffIdAttribute(): string
    {
        return $this->employee_code ?? '';
    }

    /**
     * Note: Employee code generation is handled by EmployeeService
     * to avoid transaction conflicts with lockForUpdate
     */

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function designation()
    {
        return $this->belongsTo(Designation::class);
    }

    public function manager()
    {
        return $this->belongsTo(Employee::class, 'manager_id');
    }

    public function subordinates()
    {
        return $this->hasMany(Employee::class, 'manager_id');
    }

    public function attendanceLogs()
    {
        return $this->hasMany(AttendanceLog::class);
    }

    public function workplace()
    {
        return $this->belongsTo(Workplace::class);
    }

    public function workSchedule()
    {
        return $this->belongsTo(WorkSchedule::class);
    }

    public function onboardingCases()
    {
        return $this->hasMany(OnboardingCase::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function leaveBalances()
    {
        return $this->hasMany(LeaveBalance::class);
    }

    public function leaveRequests()
    {
        return $this->hasMany(LeaveRequest::class);
    }

    /**
     * Scope for employees who should be visible in operations
     * (e.g. Attendance, Payroll)
     */
    public function scopeOperational($query)
    {
        return $query->whereIn('status', ['active', 'probation']);
    }
}
