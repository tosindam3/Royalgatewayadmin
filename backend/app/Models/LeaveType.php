<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeaveType extends Model
{
    protected $fillable = [
        'name',
        'code',
        'description',
        'default_days_per_year',
        'accrual_method',
        'accrual_rate',
        'is_carry_forward',
        'max_carry_forward_days',
        'requires_approval',
        'requires_document',
        'min_notice_days',
        'max_consecutive_days',
        'is_paid',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'default_days_per_year' => 'integer',
        'accrual_rate' => 'decimal:2',
        'is_carry_forward' => 'boolean',
        'max_carry_forward_days' => 'integer',
        'requires_approval' => 'boolean',
        'requires_document' => 'boolean',
        'min_notice_days' => 'integer',
        'max_consecutive_days' => 'integer',
        'is_paid' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function leaveBalances(): HasMany
    {
        return $this->hasMany(LeaveBalance::class);
    }

    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true)->orderBy('sort_order');
    }
}
