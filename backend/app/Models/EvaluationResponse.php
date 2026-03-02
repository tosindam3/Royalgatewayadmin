<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EvaluationResponse extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'template_id',
        'employee_id',
        'evaluator_id',
        'cycle_id',
        'answers',
        'status',
        'submitted_to',
        'submitted_at',
        'approved_at',
        'approved_by',
        'feedback',
        'approval_chain',
    ];

    protected $casts = [
        'answers' => 'array',
        'approval_chain' => 'array',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    /**
     * Relationships
     */
    public function template()
    {
        return $this->belongsTo(EvaluationTemplate::class, 'template_id');
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function evaluator()
    {
        return $this->belongsTo(User::class, 'evaluator_id');
    }

    public function submittedTo()
    {
        return $this->belongsTo(User::class, 'submitted_to');
    }

    public function cycle()
    {
        return $this->belongsTo(ReviewCycle::class, 'cycle_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Scopes
     */
    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeSubmitted($query)
    {
        return $query->whereIn('status', ['submitted_to_manager', 'submitted_to_admin']);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopePendingFor($query, int $userId)
    {
        return $query->where('submitted_to', $userId)
                    ->whereIn('status', ['submitted_to_manager', 'submitted_to_admin']);
    }

    /**
     * Helpers
     */
    public function calculateScore()
    {
        $template = $this->template;
        if (!$template || !isset($template->sessions)) {
            return null;
        }

        $totalWeight = 0;
        $weightedScore = 0;

        foreach ($template->sessions as $session) {
            foreach ($session['fields'] ?? [] as $field) {
                $weight = $field['weight'] ?? 0;
                $fieldId = $field['id'];

                if ($field['type'] === 'RATING' && isset($this->answers[$fieldId])) {
                    $rating = (int) $this->answers[$fieldId];
                    $totalWeight += $weight;
                    $weightedScore += ($rating / 5) * 100 * $weight;
                }
            }
        }

        return $totalWeight > 0 ? round($weightedScore / $totalWeight, 2) : null;
    }

    public function submitTo(int $userId, string $role = 'manager')
    {
        $status = $role === 'admin' ? 'submitted_to_admin' : 'submitted_to_manager';
        
        $this->update([
            'status' => $status,
            'submitted_to' => $userId,
            'submitted_at' => now(),
            'approval_chain' => array_merge($this->approval_chain ?? [], [
                [
                    'submitted_to' => $userId,
                    'submitted_at' => now()->toISOString(),
                    'status' => $status,
                ]
            ]),
        ]);
    }

    public function approve(int $approverId, string $feedback = null)
    {
        $this->update([
            'status' => 'approved',
            'approved_by' => $approverId,
            'approved_at' => now(),
            'feedback' => $feedback,
            'approval_chain' => array_merge($this->approval_chain ?? [], [
                [
                    'approved_by' => $approverId,
                    'approved_at' => now()->toISOString(),
                    'status' => 'approved',
                    'feedback' => $feedback,
                ]
            ]),
        ]);
    }

    public function reject(int $rejectorId, string $feedback)
    {
        $this->update([
            'status' => 'rejected',
            'feedback' => $feedback,
            'approval_chain' => array_merge($this->approval_chain ?? [], [
                [
                    'rejected_by' => $rejectorId,
                    'rejected_at' => now()->toISOString(),
                    'status' => 'rejected',
                    'feedback' => $feedback,
                ]
            ]),
        ]);
    }

    public function returnToEmployee(int $returnerId, string $feedback)
    {
        $this->update([
            'status' => 'returned',
            'feedback' => $feedback,
            'approval_chain' => array_merge($this->approval_chain ?? [], [
                [
                    'returned_by' => $returnerId,
                    'returned_at' => now()->toISOString(),
                    'status' => 'returned',
                    'feedback' => $feedback,
                ]
            ]),
        ]);
    }

    public function getStatusLabelAttribute()
    {
        return match($this->status) {
            'draft' => 'Draft',
            'submitted_to_manager' => 'Pending Manager Review',
            'submitted_to_admin' => 'Pending Admin Review',
            'approved' => 'Approved',
            'rejected' => 'Rejected',
            'returned' => 'Returned for Revision',
            default => 'Unknown'
        };
    }

    public function getCanEditAttribute()
    {
        return in_array($this->status, ['draft', 'returned']);
    }

    public function getCanSubmitAttribute()
    {
        return in_array($this->status, ['draft', 'returned']);
    }
}
