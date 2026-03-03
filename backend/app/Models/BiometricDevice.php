<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BiometricDevice extends Model
{
    protected $fillable = [
        'device_name',
        'device_serial',
        'ip_address',
        'port',
        'location',
        'branch_id',
        'workplace_id',
        'is_active',
        'last_sync',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_sync' => 'datetime',
        'port' => 'integer',
    ];

    public function workplace(): BelongsTo
    {
        return $this->belongsTo(Workplace::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
