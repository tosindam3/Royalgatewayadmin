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
            $table->date('attendance_date');
            $table->timestamp('check_in_time')->nullable();
            $table->timestamp('check_out_time')->nullable();
            $table->integer('work_minutes')->default(0);
            $table->integer('late_minutes')->default(0);
            $table->integer('overtime_minutes')->default(0);
            $table->integer('break_minutes')->default(0);
            $table->enum('status', ['present', 'absent', 'on_time', 'partial', 'leave', 'holiday'])->default('absent');
            $table->string('source')->default('app');
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->enum('approval_status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->boolean('payroll_locked')->default(false);
            
            // Geofence data
            $table->decimal('geo_lat', 10, 8)->nullable();
            $table->decimal('geo_long', 11, 8)->nullable();
            $table->float('geo_accuracy_m')->nullable();
            $table->decimal('geofence_expected_lat', 10, 8)->nullable();
            $table->decimal('geofence_expected_long', 11, 8)->nullable();
            $table->integer('geofence_radius_m')->nullable();
            $table->float('geofence_distance_m')->nullable();
            $table->string('geofence_status')->default('na');
            $table->text('geofence_violation_reason')->nullable();
            
            $table->timestamps();

            // Indexes for performance
            $table->index(['attendance_date', 'employee_id']);
            $table->index(['employee_id', 'attendance_date']);
            $table->index('status');
            $table->index('attendance_date');
            $table->unique(['employee_id', 'attendance_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_records');
    }
};
