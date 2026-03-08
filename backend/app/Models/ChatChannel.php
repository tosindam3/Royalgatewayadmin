<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class ChatChannel extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'type',
        'created_by',
        'organization_id',
        'is_archived',
        'metadata',
    ];

    protected $casts = [
        'is_archived' => 'boolean',
        'metadata' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($channel) {
            if (empty($channel->slug)) {
                $channel->slug = Str::slug($channel->name) . '-' . Str::random(6);
            }
        });
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'organization_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class, 'channel_id');
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'chat_channel_members', 'channel_id', 'user_id')
            ->withPivot(['role', 'is_pinned', 'is_muted', 'last_read_at'])
            ->withTimestamps();
    }

    public function typingIndicators(): HasMany
    {
        return $this->hasMany(ChatTypingIndicator::class, 'channel_id');
    }

    public function scopePublic($query)
    {
        return $query->where('type', 'public');
    }

    public function scopePrivate($query)
    {
        return $query->where('type', 'private');
    }

    public function scopeDirect($query)
    {
        return $query->where('type', 'direct');
    }

    public function scopeActive($query)
    {
        return $query->where('is_archived', false);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->whereHas('members', function ($q) use ($userId) {
            $q->where('user_id', $userId);
        });
    }

    public function getUnreadCountForUser($userId): int
    {
        $member = $this->members()->where('user_id', $userId)->first();
        
        if (!$member) {
            return 0;
        }

        $lastReadAt = $member->pivot->last_read_at ?? $member->pivot->created_at;

        return $this->messages()
            ->where('user_id', '!=', $userId)
            ->where('created_at', '>', $lastReadAt)
            ->count();
    }

    public function markAsReadForUser($userId): void
    {
        $this->members()->updateExistingPivot($userId, [
            'last_read_at' => now(),
        ]);
    }

    public function isPublic(): bool
    {
        return $this->type === 'public';
    }

    public function isPrivate(): bool
    {
        return $this->type === 'private';
    }

    public function isDirect(): bool
    {
        return $this->type === 'direct';
    }

    public function hasMember($userId): bool
    {
        return $this->members()->where('user_id', $userId)->exists();
    }
}
