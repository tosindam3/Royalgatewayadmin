<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class MemoLabel extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'color',
        'sort_order',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function memos(): BelongsToMany
    {
        return $this->belongsToMany(Memo::class, 'memo_label_pivot', 'label_id', 'memo_id')
            ->withPivot('user_id')
            ->withTimestamps();
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }

    public function getMemoCount(): int
    {
        return $this->memos()->count();
    }
}
