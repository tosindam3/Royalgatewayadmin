<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ReviewCycle extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'start_date',
        'end_date',
        'status',
        'template_id',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    /**
     * Relationships
     */
    public function template()
    {
        return $this->belongsTo(EvaluationTemplate::class, 'template_id');
    }

    public function participants()
    {
        return $this->hasMany(CycleParticipant::class, 'cycle_id');
    }

    public function responses()
    {
        return $this->hasMany(EvaluationResponse::class, 'cycle_id');
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    /**
     * Helpers
     */
    public function getCompletionRateAttribute()
    {
        $total = $this->participants()->count();
        if ($total === 0) return 0;
        
        $completed = $this->participants()->where('status', 'completed')->count();
        return round(($completed / $total) * 100, 2);
    }
}
