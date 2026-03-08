<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add lifecycle fields to performance_configs
        Schema::table('performance_configs', function (Blueprint $table) {
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft')->after('is_active');
            $table->enum('scope', ['department', 'branch', 'global'])->default('department')->after('status');
            $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null')->after('department_id');
            $table->unsignedBigInteger('cloned_from')->nullable()->after('branch_id');
            $table->timestamp('published_at')->nullable()->after('cloned_from');

            // Make department_id nullable (it won't be needed for branch/global scope)
            $table->foreignId('department_id')->nullable()->change();

            $table->index(['status', 'scope']);
            $table->index(['branch_id', 'status']);
        });

        // Add branch_id to submissions for analytics joins
        Schema::table('performance_submissions', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null')->after('department_id');
            $table->index(['branch_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('performance_configs', function (Blueprint $table) {
            $table->dropIndex(['status', 'scope']);
            $table->dropIndex(['branch_id', 'status']);
            $table->dropColumn(['status', 'scope', 'branch_id', 'cloned_from', 'published_at']);
            $table->foreignId('department_id')->nullable(false)->change();
        });

        Schema::table('performance_submissions', function (Blueprint $table) {
            $table->dropIndex(['branch_id', 'status']);
            $table->dropColumn('branch_id');
        });
    }
};
