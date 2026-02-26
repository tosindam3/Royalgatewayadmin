<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ApprovalWorkflow extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'module',
        'trigger_event',
        'description',
        'conditions',
        'is_active',
        'is_system',
        'priority',
    ];

    protected $casts = [
        'conditions' => 'array',
        'is_active' => 'boolean',
        'is_system' => 'boolean',
    ];

    public function steps(): HasMany
    {
        return $this->hasMany(ApprovalStep::class, 'workflow_id')->orderBy('step_order');
    }

    public function requests(): HasMany
    {
        return $this->hasMany(ApprovalRequest::class, 'workflow_id');
    }

    /**
     * Check if workflow conditions are met
     */
    public function conditionsMet($entity): bool
    {
        if (empty($this->conditions)) {
            return true;
        }

        // Evaluate conditions (can be extended with more complex logic)
        foreach ($this->conditions as $field => $condition) {
            $value = data_get($entity, $field);
            
            if (isset($condition['min']) && $value < $condition['min']) {
                return false;
            }
            
            if (isset($condition['max']) && $value > $condition['max']) {
                return false;
            }
            
            if (isset($condition['equals']) && $value != $condition['equals']) {
                return false;
            }
        }

        return true;
    }
}
