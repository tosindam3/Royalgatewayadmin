<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->enum('check_type', ['check_in', 'check_out']);
            $table->timestamp('timestamp');
            $table->enum('source', ['biometric', 'mobile_app', 'web_app', 'kiosk']);
            $table->string('device_id', 50)->nullable();
            $table->decimal('location_lat', 10, 8)->nullable();
            $table->decimal('location_lng', 11, 8)->nullable();
            $table->string('photo_url')->nullable();
            $table->boolean('verified')->default(true);
            $table->enum('sync_status', ['pending', 'synced', 'failed'])->default('synced');
            $table->timestamps();

            $table->index(['employee_id', 'timestamp']);
            $table->index(['source', 'timestamp']);
            $table->index('sync_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_logs');
    }
};
