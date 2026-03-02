<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollPeriod extends Model
{
    use HasFactory;

    protected $fillable = [
        'year',
        'month',
        'start_date',
        'end_date',
        'working_days',
        'status',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'working_days' => 'integer',
    ];

    protected $appends = ['name'];

    /**
     * Get formatted period name (e.g., "January 2024")
     */
    public function getNameAttribute(): string
    {
        return date('F Y', mktime(0, 0, 0, $this->month, 1, $this->year));
    }

    /**
     * Relationships
     */
    public function payrollRuns()
    {
        return $this->hasMany(PayrollRun::class, 'period_id');
    }

    public function performanceScores()
    {
        return $this->hasMany(PerformanceMonthlyScore::class, 'period_id');
    }

    /**
     * Scopes
     */
    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    public function scopeClosed($query)
    {
        return $query->where('status', 'closed');
    }

    public function scopeForYearMonth($query, int $year, int $month)
    {
        return $query->where('year', $year)->where('month', $month);
    }
}
