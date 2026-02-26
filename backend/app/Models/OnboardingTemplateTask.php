<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OnboardingTemplateTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'template_id',
        'title',
        'description',
        'default_owner_role',
        'offset_days',
        'required',
        'sort_order',
    ];

    protected $casts = [
        'required' => 'boolean',
        'offset_days' => 'integer',
        'sort_order' => 'integer',
    ];

    public function template()
    {
        return $this->belongsTo(OnboardingTemplate::class, 'template_id');
    }
}
