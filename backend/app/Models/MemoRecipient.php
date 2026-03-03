<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemoRecipient extends Model
{
    protected $fillable = [
        'memo_id',
        'recipient_id',
        'recipient_type',
        'status',
        'read_at',
        'archived_at',
        'deleted_at',
        'is_starred',
        'folder_id',
    ];

    protected $casts = [
        'read_at' => 'datetime',
        'archived_at' => 'datetime',
        'deleted_at' => 'datetime',
        'is_starred' => 'boolean',
    ];

    public function memo(): BelongsTo
    {
        return $this->belongsTo(Memo::class);
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(MemoFolder::class, 'folder_id');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('recipient_id', $userId);
    }

    public function scopeUnread($query)
    {
        return $query->where('status', 'pending')->orWhere('status', 'delivered');
    }

    public function scopeRead($query)
    {
        return $query->where('status', 'read');
    }

    public function scopeStarred($query)
    {
        return $query->where('is_starred', true);
    }

    public function scopeInFolder($query, $folderId)
    {
        return $query->where('folder_id', $folderId);
    }

    public function markAsRead(): void
    {
        $this->update([
            'status' => 'read',
            'read_at' => now(),
        ]);
    }

    public function toggleStar(): void
    {
        $this->update(['is_starred' => !$this->is_starred]);
    }

    public function archive(): void
    {
        $this->update([
            'status' => 'archived',
            'archived_at' => now(),
        ]);
    }

    public function moveToFolder($folderId): void
    {
        $this->update(['folder_id' => $folderId]);
    }

    public function isUnread(): bool
    {
        return in_array($this->status, ['pending', 'delivered']);
    }
}
