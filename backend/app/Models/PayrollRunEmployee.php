<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollRunEmployee extends Model
{
    use HasFactory;

    protected $fillable = [
        'payroll_run_id',
        'employee_id',
        'base_salary_snapshot',
        'absent_days',
        'late_minutes',
        'overtime_hours',
        'performance_score',
        'earnings_json',
        'deductions_json',
        'gross_pay',
        'total_deductions',
        'net_pay',
        'calc_version',
    ];

    protected $casts = [
        'base_salary_snapshot' => 'decimal:2',
        'absent_days' => 'integer',
        'late_minutes' => 'integer',
        'overtime_hours' => 'decimal:2',
        'performance_score' => 'integer',
        'earnings_json' => 'array',
        'deductions_json' => 'array',
        'gross_pay' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'net_pay' => 'decimal:2',
        'calc_version' => 'integer',
    ];

    /**
     * Relationships
     */
    public function payrollRun()
    {
        return $this->belongsTo(PayrollRun::class, 'payroll_run_id');
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    /**
     * Scopes
     */
    public function scopeForRun($query, int $runId)
    {
        return $query->where('payroll_run_id', $runId);
    }

    public function scopeForEmployee($query, int $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }
}
