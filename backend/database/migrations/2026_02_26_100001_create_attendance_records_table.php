<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->date('work_date');
            $table->timestamp('clock_in_at')->nullable();
            $table->timestamp('clock_out_at')->nullable();
            $table->integer('minutes_worked')->default(0);
            $table->integer('late_minutes')->default(0);
            $table->integer('overtime_minutes')->default(0);
            $table->enum('source_in', ['app', 'device', 'import'])->nullable();
            $table->enum('source_out', ['app', 'device', 'import'])->nullable();
            $table->enum('geofence_status_in', ['pass', 'fail', 'bypass', 'na'])->default('na');
            $table->enum('geofence_status_out', ['pass', 'fail', 'bypass', 'na'])->default('na');
            $table->foreignId('geofence_zone_in_id')->nullable()->constrained('geofence_zones')->nullOnDelete();
            $table->foreignId('geofence_zone_out_id')->nullable()->constrained('geofence_zones')->nullOnDelete();
            $table->enum('status', ['present', 'absent', 'partial', 'leave', 'holiday'])->default('absent');
            $table->foreignId('shift_id')->nullable()->constrained('work_schedules')->nullOnDelete();
            $table->boolean('has_missing_punch')->default(false);
            $table->boolean('is_edited')->default(false);
            $table->boolean('has_duplicate')->default(false);
            $table->timestamps();

            // Indexes for performance
            $table->index(['work_date', 'employee_id']);
            $table->index(['employee_id', 'work_date']);
            $table->index('status');
            $table->index('work_date');
            $table->unique(['employee_id', 'work_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_records');
    }
};
