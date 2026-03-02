<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KeyResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'goal_id',
        'description',
        'target_value',
        'current_value',
        'unit',
        'weight',
    ];

    protected $casts = [
        'target_value' => 'decimal:2',
        'current_value' => 'decimal:2',
        'weight' => 'integer',
    ];

    /**
     * Relationships
     */
    public function goal()
    {
        return $this->belongsTo(Goal::class, 'goal_id');
    }

    public function updates()
    {
        return $this->hasMany(GoalUpdate::class, 'key_result_id');
    }

    /**
     * Helpers
     */
    public function getProgressPercentageAttribute()
    {
        if ($this->target_value == 0) {
            return 0;
        }

        return min(100, round(($this->current_value / $this->target_value) * 100, 2));
    }

    public function updateValue(float $newValue, ?string $notes = null, ?int $userId = null)
    {
        $previousValue = $this->current_value;
        $this->current_value = $newValue;
        $this->save();

        // Log the update
        GoalUpdate::create([
            'goal_id' => $this->goal_id,
            'key_result_id' => $this->id,
            'updated_by' => $userId ?? auth()->id(),
            'previous_value' => $previousValue,
            'new_value' => $newValue,
            'notes' => $notes,
        ]);

        // Update parent goal progress
        $this->goal->updateProgress();
    }
}
