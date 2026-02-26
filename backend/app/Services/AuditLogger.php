<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

class AuditLogger
{
    /**
     * Log a significant system action
     */
    public static function log(string $action, $entity = null, ...$args): void
    {
        $entityType = null;
        $entityId = null;
        $oldValues = null;
        $newValues = null;

        if (is_object($entity)) {
            $entityType = get_class($entity);
            $entityId = $entity->id ?? null;
            $oldValues = $args[0] ?? null;
            $newValues = $args[1] ?? null;
        } else {
            $entityType = is_string($entity) ? $entity : null;
            $entityId = $args[0] ?? null;
            $oldValues = $args[1] ?? null;
            $newValues = $args[2] ?? null;
        }

        AuditLog::create([
            'user_id' => Auth::id(),
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()->ip(),
        ]);
    }
}
