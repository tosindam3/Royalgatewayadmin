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
        Schema::table('attendance_logs', function (Blueprint $table) {
            $table->enum('status', ['on_time', 'late', 'early_exit', 'overtime'])->nullable()->after('timestamp');
            $table->foreignId('geofence_zone_id')->nullable()->after('status')->constrained('geofence_zones')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance_logs', function (Blueprint $table) {
            $table->dropForeign(['geofence_zone_id']);
            $table->dropColumn(['status', 'geofence_zone_id']);
        });
    }
};
