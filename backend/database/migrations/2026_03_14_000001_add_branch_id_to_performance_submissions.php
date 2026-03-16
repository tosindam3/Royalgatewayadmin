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
            if (!Schema::hasColumn('performance_submissions', 'branch_id')) {
                $table->foreignId('branch_id')->nullable()->after('department_id')->constrained('branches')->onDelete('cascade');
                $table->index(['branch_id', 'status']);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('performance_submissions', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropColumn('branch_id');
        });
    }
};
