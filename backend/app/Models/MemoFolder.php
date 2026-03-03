<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MemoFolder extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'icon',
        'color',
        'sort_order',
        'is_system',
        'is_visible',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'is_system' => 'boolean',
        'is_visible' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function memoRecipients(): HasMany
    {
        return $this->hasMany(MemoRecipient::class, 'folder_id');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    public function scopeCustom($query)
    {
        return $query->where('is_system', false);
    }

    public function scopeVisible($query)
    {
        return $query->where('is_visible', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }

    public function getMemoCount(): int
    {
        return $this->memoRecipients()->count();
    }

    public function getUnreadCount(): int
    {
        return $this->memoRecipients()->unread()->count();
    }
}
