<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GeofenceZone extends Model
{
    protected $fillable = [
        'name',
        'branch_id',
        'geometry_type',
        'geometry',
        'latitude',
        'longitude',
        'radius',
        'is_active',
        'is_strict',
        'allow_web',
        'allow_app',
        'description',
    ];

    protected $casts = [
        'geometry' => 'array',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'radius' => 'integer',
        'is_active' => 'boolean',
        'is_strict' => 'boolean',
        'allow_web' => 'boolean',
        'allow_app' => 'boolean',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Check if a point is within this geofence zone
     */
    public function contains(float $lat, float $lng): bool
    {
        if ($this->geometry_type === 'circle') {
            return $this->isWithinCircle($lat, $lng);
        }

        if ($this->geometry_type === 'polygon' && $this->geometry) {
            return $this->isWithinPolygon($lat, $lng);
        }

        return false;
    }

    private function isWithinCircle(float $lat, float $lng): bool
    {
        $earthRadius = 6371000; // meters
        $dLat = deg2rad($lat - $this->latitude);
        $dLng = deg2rad($lng - $this->longitude);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($this->latitude)) * cos(deg2rad($lat)) *
            sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        $distance = $earthRadius * $c;

        return $distance <= $this->radius;
    }

    private function isWithinPolygon(float $lat, float $lng): bool
    {
        $vertices = $this->geometry;
        if (!$vertices || count($vertices) < 3) {
            return false;
        }

        $intersections = 0;
        $vertexCount = count($vertices);

        for ($i = 0; $i < $vertexCount; $i++) {
            $vertex1 = $vertices[$i];
            $vertex2 = $vertices[($i + 1) % $vertexCount];

            if ($vertex1['lng'] == $vertex2['lng']) {
                continue;
            }

            if ($lng < min($vertex1['lng'], $vertex2['lng']) || $lng >= max($vertex1['lng'], $vertex2['lng'])) {
                continue;
            }

            $xIntersection = ($lng - $vertex1['lng']) * ($vertex2['lat'] - $vertex1['lat']) / 
                            ($vertex2['lng'] - $vertex1['lng']) + $vertex1['lat'];

            if ($lat < $xIntersection) {
                $intersections++;
            }
        }

        return ($intersections % 2) !== 0;
    }
}
