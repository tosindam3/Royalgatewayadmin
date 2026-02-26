<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OnboardingTaskComment extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_id',
        'user_id',
        'body',
    ];

    public function task()
    {
        return $this->belongsTo(OnboardingTask::class, 'task_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
