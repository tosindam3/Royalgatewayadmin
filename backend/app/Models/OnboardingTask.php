<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OnboardingTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'case_id',
        'title',
        'description',
        'owner_user_id',
        'owner_role',
        'due_date',
        'status',
        'priority',
        'required',
    ];

    protected $casts = [
        'due_date' => 'date',
        'required' => 'boolean',
    ];

    public function case()
    {
        return $this->belongsTo(OnboardingCase::class, 'case_id');
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function comments()
    {
        return $this->hasMany(OnboardingTaskComment::class, 'task_id');
    }

    public function attachments()
    {
        return $this->hasMany(OnboardingTaskAttachment::class, 'task_id');
    }
}
