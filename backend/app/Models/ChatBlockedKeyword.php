<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatBlockedKeyword extends Model
{
    protected $fillable = [
        'keyword',
        'action',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeBlocking($query)
    {
        return $query->where('action', 'block');
    }

    public function scopeFlagging($query)
    {
        return $query->where('action', 'flag');
    }
}
