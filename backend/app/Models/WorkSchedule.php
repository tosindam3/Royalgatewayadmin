<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkSchedule extends Model
{
    protected $fillable = [
        'name',
        'check_in_time',
        'check_out_time',
        'grace_period_minutes',
        'working_days',
        'is_active',
    ];

    protected $casts = [
        'working_days' => 'array',
        'grace_period_minutes' => 'integer',
        'is_active' => 'boolean',
    ];

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    public function isWorkingDay(int $dayOfWeek): bool
    {
        return in_array($dayOfWeek, $this->working_days ?? []);
    }
}
