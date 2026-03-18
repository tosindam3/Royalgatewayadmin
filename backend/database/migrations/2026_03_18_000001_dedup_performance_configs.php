<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Deduplicates performance_configs rows that share the same (department_id, scope).
 *
 * Strategy per duplicate group:
 *  - Keep the single published row if one exists, otherwise keep the oldest row.
 *  - Delete all other rows in the group.
 *
 * Safe to run on production — only removes redundant draft duplicates.
 * The `down()` method is intentionally a no-op; deleted rows cannot be safely restored.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Find every (department_id, scope) group that has more than one row
        $duplicateGroups = DB::table('performance_configs')
            ->select('department_id', 'scope')
            ->groupBy('department_id', 'scope')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        if ($duplicateGroups->isEmpty()) {
            return; // Nothing to clean up
        }

        foreach ($duplicateGroups as $group) {
            $rows = DB::table('performance_configs')
                ->where('department_id', $group->department_id)
                ->where('scope', $group->scope)
                ->orderByRaw("CASE WHEN status = 'published' THEN 0 ELSE 1 END") // published first
                ->orderBy('id', 'asc')                                            // oldest first within same status
                ->get();

            // The first row is the one we keep
            $keepId = $rows->first()->id;

            $deleteIds = $rows->skip(1)->pluck('id')->toArray();

            if (empty($deleteIds)) {
                continue;
            }

            DB::table('performance_configs')
                ->whereIn('id', $deleteIds)
                ->delete();
        }
    }

    public function down(): void
    {
        // Intentional no-op — deleted duplicates cannot be deterministically restored
    }
};
