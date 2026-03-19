<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class JobOpening extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'requirements',
        'responsibilities',
        'department_id',
        'branch_id',
        'location',
        'employment_type',
        'experience_level',
        'openings',
        'status',
        'posted_date',
        'closing_date',
        'created_by',
    ];

    protected $casts = [
        'posted_date' => 'date',
        'closing_date' => 'date',
    ];

    protected $appends = ['applicants_count'];

    // Relationships
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function applications()
    {
        return $this->hasMany(Application::class);
    }

    // Accessors
    public function getApplicantsCountAttribute()
    {
        return $this->applications()->count();
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeOpen($query)
    {
        return $query->whereIn('status', ['active', 'draft']);
    }
}
