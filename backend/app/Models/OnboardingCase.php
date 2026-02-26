<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OnboardingCase extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'template_id',
        'start_date',
        'status',
        'completion_percent',
        'created_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'completion_percent' => 'integer',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function template()
    {
        return $this->belongsTo(OnboardingTemplate::class, 'template_id');
    }

    public function tasks()
    {
        return $this->hasMany(OnboardingTask::class, 'case_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeOngoing($query)
    {
        return $query->where('status', 'ongoing');
    }

    public function updateCompletionPercent()
    {
        $totalTasks = $this->tasks()->count();
        if ($totalTasks === 0) {
            $this->completion_percent = 0;
        } else {
            $completedTasks = $this->tasks()->where('status', 'done')->count();
            $this->completion_percent = round(($completedTasks / $totalTasks) * 100);
        }
        $this->save();
    }
}
