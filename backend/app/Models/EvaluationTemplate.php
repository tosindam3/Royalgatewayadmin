<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EvaluationTemplate extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'sessions',
        'metadata',
        'created_by',
        'cloned_from',
        'status',
        'is_global',
        'published_at',
        'version',
    ];

    protected $casts = [
        'sessions' => 'array',
        'metadata' => 'array',
        'is_global' => 'boolean',
        'published_at' => 'datetime',
        'version' => 'integer',
    ];

    /**
     * Relationships
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function clonedFrom()
    {
        return $this->belongsTo(EvaluationTemplate::class, 'cloned_from');
    }

    public function clones()
    {
        return $this->hasMany(EvaluationTemplate::class, 'cloned_from');
    }

    public function cycles()
    {
        return $this->hasMany(ReviewCycle::class, 'template_id');
    }

    public function responses()
    {
        return $this->hasMany(EvaluationResponse::class, 'template_id');
    }

    /**
     * Scopes
     */
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeGlobal($query)
    {
        return $query->where('is_global', true)->where('status', 'published');
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeArchived($query)
    {
        return $query->where('status', 'archived');
    }

    /**
     * Helpers
     */
    public function publish()
    {
        $this->update([
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    public function archive()
    {
        $this->update(['status' => 'archived']);
    }

    public function createClone(int $userId, string $title = null): self
    {
        $clone = self::create([
            'title' => $title ?? $this->title . ' (Copy)',
            'description' => $this->description,
            'sessions' => $this->sessions,
            'metadata' => array_merge($this->metadata ?? [], [
                'cloned_at' => now()->toISOString(),
                'original_version' => $this->version,
            ]),
            'created_by' => $userId,
            'cloned_from' => $this->id,
            'status' => 'draft',
            'version' => 1,
        ]);

        return $clone;
    }

    public function getTotalQuestionsAttribute()
    {
        $total = 0;
        foreach ($this->sessions ?? [] as $session) {
            $total += count($session['fields'] ?? []);
        }
        return $total;
    }

    public function getIsEditableAttribute()
    {
        return $this->status === 'draft';
    }

    public function getCanBeClonedAttribute()
    {
        return in_array($this->status, ['published', 'archived']);
    }
}
