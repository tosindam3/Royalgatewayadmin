<?php

namespace App\Services;

class GeofenceService
{
    /**
     * Find the first matching geofence zone for a given coordinate
     */
    public function findMatchingZone(float $lat, float $lng, ?int $branchId = null): ?\App\Models\GeofenceZone
    {
        $query = \App\Models\GeofenceZone::where('is_active', true);

        if ($branchId) {
            $query->where(function ($q) use ($branchId) {
                $q->where('branch_id', $branchId)->orWhereNull('branch_id');
            });
        }

        $zones = $query->get();

        foreach ($zones as $zone) {
            if ($zone->contains($lat, $lng)) {
                return $zone;
            }
        }

        return null;
    }

    /**
     * Check if a point is within a radius of another point using Haversine formula
     */
    public function within(float $lat1, float $lng1, float $lat2, float $lng2, float $radiusMeters): bool
    {
        $distance = $this->distance($lat1, $lng1, $lat2, $lng2);
        return $distance <= $radiusMeters;
    }

    /**
     * Calculate distance between two points in meters
     */
    public function distance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
