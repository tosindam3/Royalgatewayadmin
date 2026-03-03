<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemoThread extends Model
{
    protected $fillable = [
        'organization_id',
        'first_memo_id',
        'subject',
        'memo_count',
        'last_activity_at',
    ];

    protected $casts = [
        'last_activity_at' => 'datetime',
    ];

    public function memos(): HasMany
    {
        return $this->hasMany(Memo::class, 'thread_id');
    }

    public function firstMemo(): BelongsTo
    {
        return $this->belongsTo(Memo::class, 'first_memo_id');
    }

    public function incrementMemoCount(): void
    {
        $this->increment('memo_count');
        $this->update(['last_activity_at' => now()]);
    }
}
