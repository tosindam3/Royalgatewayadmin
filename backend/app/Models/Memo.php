<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Memo extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'sender_id',
        'organization_id',
        'thread_id',
        'parent_memo_id',
        'subject',
        'body',
        'body_plain',
        'priority',
        'status',
        'type',
        'scheduled_at',
        'sent_at',
        'requires_read_receipt',
        'is_confidential',
        'metadata',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'sent_at' => 'datetime',
        'requires_read_receipt' => 'boolean',
        'is_confidential' => 'boolean',
        'metadata' => 'array',
    ];

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function thread(): BelongsTo
    {
        return $this->belongsTo(MemoThread::class, 'thread_id');
    }

    public function parentMemo(): BelongsTo
    {
        return $this->belongsTo(Memo::class, 'parent_memo_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(Memo::class, 'parent_memo_id');
    }

    public function recipients(): HasMany
    {
        return $this->hasMany(MemoRecipient::class);
    }

    public function toRecipients(): HasMany
    {
        return $this->recipients()->where('recipient_type', 'to');
    }

    public function ccRecipients(): HasMany
    {
        return $this->recipients()->where('recipient_type', 'cc');
    }

    public function bccRecipients(): HasMany
    {
        return $this->recipients()->where('recipient_type', 'bcc');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(MemoAttachment::class);
    }

    public function labels(): BelongsToMany
    {
        return $this->belongsToMany(MemoLabel::class, 'memo_label_pivot', 'memo_id', 'label_id')
            ->withPivot('user_id')
            ->withTimestamps();
    }

    public function scopeDrafts($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeSent($query)
    {
        return $query->where('status', 'sent');
    }

    public function scopeScheduled($query)
    {
        return $query->where('status', 'scheduled');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where(function ($q) use ($userId) {
            $q->where('sender_id', $userId)
              ->orWhereHas('recipients', function ($q) use ($userId) {
                  $q->where('recipient_id', $userId);
              });
        });
    }

    public function scopeSearch($query, $searchTerm)
    {
        return $query->where(function ($q) use ($searchTerm) {
            $q->where('subject', 'like', "%{$searchTerm}%")
              ->orWhere('body_plain', 'like', "%{$searchTerm}%");
        });
    }

    public function markAsSent(): void
    {
        $this->update([
            'status' => 'sent',
            'sent_at' => now(),
        ]);
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isSent(): bool
    {
        return $this->status === 'sent';
    }

    public function isScheduled(): bool
    {
        return $this->status === 'scheduled';
    }
}
