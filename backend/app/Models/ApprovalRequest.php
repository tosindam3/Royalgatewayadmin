<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ApprovalRequest extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'request_number',
        'workflow_id',
        'requestable_type',
        'requestable_id',
        'requester_id',
        'status',
        'current_step',
        'current_approver_id',
        'requester_comment',
        'submitted_at',
        'completed_at',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'submitted_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(ApprovalWorkflow::class, 'workflow_id');
    }

    public function requestable(): MorphTo
    {
        return $this->morphTo();
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function currentApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'current_approver_id');
    }

    public function actions(): HasMany
    {
        return $this->hasMany(ApprovalAction::class, 'request_id')->orderBy('acted_at');
    }

    /**
     * Generate unique request number
     */
    public static function generateRequestNumber(): string
    {
        $year = date('Y');
        $lastRequest = static::where('request_number', 'like', "AR-{$year}-%")
            ->orderBy('id', 'desc')
            ->first();
            
        $nextNumber = $lastRequest 
            ? intval(substr($lastRequest->request_number, -5)) + 1 
            : 1;
            
        return sprintf('AR-%s-%05d', $year, $nextNumber);
    }

    /**
     * Check if user can approve this request
     */
    public function canBeApprovedBy(User $user): bool
    {
        return $this->status === 'pending' && $this->current_approver_id === $user->id;
    }

    /**
     * Get current step details
     */
    public function getCurrentStep(): ?ApprovalStep
    {
        return $this->workflow->steps()
            ->where('step_order', $this->current_step)
            ->first();
    }
}
