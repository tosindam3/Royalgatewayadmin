<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GoalUpdate extends Model
{
    use HasFactory;

    protected $fillable = [
        'goal_id',
        'key_result_id',
        'updated_by',
        'previous_value',
        'new_value',
        'notes',
    ];

    protected $casts = [
        'previous_value' => 'decimal:2',
        'new_value' => 'decimal:2',
    ];

    /**
     * Relationships
     */
    public function goal()
    {
        return $this->belongsTo(Goal::class, 'goal_id');
    }

    public function keyResult()
    {
        return $this->belongsTo(KeyResult::class, 'key_result_id');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
