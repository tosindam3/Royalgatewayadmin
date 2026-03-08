<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PerformanceConfig extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_id',
        'branch_id',
        'name',
        'description',
        'sections',
        'scoring_config',
        'scope',
        'status',
        'is_active',
        'cloned_from',
        'published_at',
        'created_by',
    ];

    protected $casts = [
        'sections'      => 'array',
        'scoring_config' => 'array',
        'is_active'     => 'boolean',
        'published_at'  => 'datetime',
    ];

    // ─── Relationships ───────────────────────────────────────────────────────

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

    public function clonedFrom()
    {
        return $this->belongsTo(PerformanceConfig::class, 'cloned_from');
    }

    // ─── Query Scopes ────────────────────────────────────────────────────────

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    /**
     * Resolve the best-matching published template for an employee.
     * Priority: department > branch > global
     */
    public static function resolveForEmployee(Employee $employee): ?self
    {
        // 1) Department-level (highest priority)
        if ($employee->department_id) {
            $config = self::published()
                ->where('scope', 'department')
                ->where('department_id', $employee->department_id)
                ->latest('published_at')
                ->first();
            if ($config) return $config;
        }

        // 2) Branch-level
        if ($employee->branch_id) {
            $config = self::published()
                ->where('scope', 'branch')
                ->where('branch_id', $employee->branch_id)
                ->latest('published_at')
                ->first();
            if ($config) return $config;
        }

        // 3) Global fallback
        return self::published()
            ->where('scope', 'global')
            ->latest('published_at')
            ->first();
    }
}
