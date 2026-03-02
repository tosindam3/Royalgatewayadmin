<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveBalance extends Model
{
    protected $fillable = [
        'employee_id',
        'leave_type_id',
        'year',
        'total_allocated',
        'used',
        'pending',
        'available',
        'carried_forward',
        'expiry_date',
    ];

    protected $casts = [
        'year' => 'integer',
        'total_allocated' => 'decimal:2',
        'used' => 'decimal:2',
        'pending' => 'decimal:2',
        'available' => 'decimal:2',
        'carried_forward' => 'decimal:2',
        'expiry_date' => 'date',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }

    /**
     * Recalculate available balance
     */
    public function recalculate(): void
    {
        $this->available = $this->total_allocated - $this->used - $this->pending;
        $this->save();
    }

    /**
     * Check if sufficient balance exists
     */
    public function hasSufficientBalance(float $days): bool
    {
        return $this->available >= $days;
    }
}
