<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KeyResultUpdate extends Model
{
    use HasFactory;

    public $timestamps = false;
    
    protected $fillable = [
        'key_result_id',
        'value',
        'note',
        'updated_by',
        'created_at',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'created_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            $model->created_at = $model->created_at ?? now();
        });
    }

    // Relationships
    public function keyResult()
    {
        return $this->belongsTo(KeyResult::class, 'key_result_id');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
