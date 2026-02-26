<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalStep extends Model
{
    protected $fillable = [
        'workflow_id',
        'step_order',
        'name',
        'approver_type',
        'approver_role_id',
        'approver_user_id',
        'scope_level',
        'is_required',
        'allow_parallel',
        'timeout_hours',
        'conditions',
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'allow_parallel' => 'boolean',
        'conditions' => 'array',
    ];

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(ApprovalWorkflow::class, 'workflow_id');
    }

    public function approverRole(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'approver_role_id');
    }

    public function approverUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_user_id');
    }

    /**
     * Get the approver(s) for this step based on the requester
     */
    public function getApprovers(User $requester): array
    {
        switch ($this->approver_type) {
            case 'user':
                return $this->approver_user_id ? [User::find($this->approver_user_id)] : [];
                
            case 'role':
                return User::whereHas('roles', function ($query) {
                    $query->where('roles.id', $this->approver_role_id);
                })->get()->toArray();
                
            case 'manager':
                return $requester->manager ? [$requester->manager] : [];
                
            case 'department_head':
                // Find users with department head role in same department
                return User::where('department_id', $requester->department_id)
                    ->whereHas('roles', function ($query) {
                        $query->where('name', 'department_head');
                    })->get()->toArray();
                    
            case 'branch_head':
                // Find users with branch head role in same branch
                return User::where('branch_id', $requester->branch_id)
                    ->whereHas('roles', function ($query) {
                        $query->where('name', 'branch_head');
                    })->get()->toArray();
                    
            default:
                return [];
        }
    }
}
