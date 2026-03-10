<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('performance_submissions', function (Blueprint $table) {
            // submitted_at is already indexed in the create migration.
            // status is indexed in compounds, but a single index might help for general 'submitted' queries.
            if (!DB::getSchemaBuilder()->hasIndex('performance_submissions', 'performance_submissions_status_index')) {
                $table->index('status');
            }
            if (!DB::getSchemaBuilder()->hasIndex('performance_submissions', 'performance_submissions_score_index')) {
                $table->index('score');
            }
            // Compound index for analytics (status + score + submitted_at)
            $table->index(['status', 'score', 'submitted_at'], 'perf_submissions_analytics_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('performance_submissions', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['score']);
            $table->dropIndex(['submitted_at']);
            $table->dropIndex(['status', 'score', 'submitted_at']);
        });
    }
};
