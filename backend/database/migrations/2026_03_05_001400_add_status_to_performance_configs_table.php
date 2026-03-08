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
        Schema::table('performance_configs', function (Blueprint $table) {
            if (!Schema::hasColumn('performance_configs', 'status')) {
                $table->string('status')->default('draft')->after('is_active');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('performance_configs', function (Blueprint $table) {
            if (Schema::hasColumn('performance_configs', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};
