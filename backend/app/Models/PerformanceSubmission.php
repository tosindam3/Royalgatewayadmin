<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PerformanceSubmission extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'employee_id',
        'department_id',
        'branch_id',
        'period',
        'form_data',
        'score',
        'rating',
        'breakdown',
        'status',
        'submitted_at',
        'reviewed_at',
        'reviewed_by',
        'reviewer_comments',
    ];

    protected $casts = [
        'form_data' => 'array',
        'rating' => 'array',
        'breakdown' => 'array',
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
        'score' => 'decimal:2',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
