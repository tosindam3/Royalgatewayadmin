<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Holiday extends Model
{
    protected $fillable = [
        'name',
        'date',
        'year',
        'type',
        'branch_id',
        'description',
        'is_mandatory',
        'is_recurring',
    ];

    protected $casts = [
        'date' => 'date',
        'year' => 'integer',
        'is_mandatory' => 'boolean',
        'is_recurring' => 'boolean',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function scopeForYear($query, int $year)
    {
        return $query->where('year', $year);
    }

    public function scopeGlobal($query)
    {
        return $query->where('type', 'global');
    }

    public function scopeForBranch($query, int $branchId)
    {
        return $query->where(function ($q) use ($branchId) {
            $q->where('type', 'global')
              ->orWhere(function ($q2) use ($branchId) {
                  $q2->where('type', 'branch_specific')
                     ->where('branch_id', $branchId);
              });
        });
    }

    public function scopeUpcoming($query)
    {
        return $query->where('date', '>', now())->orderBy('date');
    }
}
