<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class OnboardingTaskAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_id',
        'file_path',
        'original_name',
        'mime_type',
        'size',
        'uploaded_by',
    ];

    public function task()
    {
        return $this->belongsTo(OnboardingTask::class, 'task_id');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getSignedUrlAttribute()
    {
        return Storage::temporaryUrl($this->file_path, now()->addMinutes(30));
    }
}
