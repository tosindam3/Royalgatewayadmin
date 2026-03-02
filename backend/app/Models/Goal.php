<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Goal extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'owner_id',
        'parent_goal_id',
        'type',
        'start_date',
        'end_date',
        'status',
        'progress',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'progress' => 'integer',
    ];

    /**
     * Relationships
     */
    public function owner()
    {
        return $this->belongsTo(Employee::class, 'owner_id');
    }

    public function parent()
    {
        return $this->belongsTo(Goal::class, 'parent_goal_id');
    }

    public function children()
    {
        return $this->hasMany(Goal::class, 'parent_goal_id');
    }

    public function keyResults()
    {
        return $this->hasMany(KeyResult::class, 'goal_id');
    }

    public function updates()
    {
        return $this->hasMany(GoalUpdate::class, 'goal_id');
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Helpers
     */
    public function calculateProgress()
    {
        $keyResults = $this->keyResults;
        if ($keyResults->isEmpty()) {
            return 0;
        }

        $totalWeight = $keyResults->sum('weight');
        if ($totalWeight === 0) {
            return 0;
        }

        $weightedProgress = 0;
        foreach ($keyResults as $kr) {
            $krProgress = $kr->target_value > 0 
                ? min(100, ($kr->current_value / $kr->target_value) * 100)
                : 0;
            $weightedProgress += $krProgress * $kr->weight;
        }

        return round($weightedProgress / $totalWeight, 2);
    }

    public function updateProgress()
    {
        $this->progress = $this->calculateProgress();
        $this->save();
    }
}
