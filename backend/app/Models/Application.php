<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Application extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'candidate_id',
        'job_opening_id',
        'stage',
        'status',
        'applied_date',
        'cover_letter',
        'referrer_employee_id',
    ];

    protected $casts = [
        'applied_date' => 'datetime',
    ];

    // Relationships
    public function candidate()
    {
        return $this->belongsTo(Candidate::class);
    }

    public function jobOpening()
    {
        return $this->belongsTo(JobOpening::class);
    }

    public function referrer()
    {
        return $this->belongsTo(Employee::class, 'referrer_employee_id');
    }

    public function interviews()
    {
        return $this->hasMany(Interview::class);
    }

    public function notes()
    {
        return $this->hasMany(CandidateNote::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByStage($query, $stage)
    {
        return $query->where('stage', $stage);
    }
}
