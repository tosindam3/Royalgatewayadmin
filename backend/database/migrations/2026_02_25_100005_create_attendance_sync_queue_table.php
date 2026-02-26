<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_sync_queue', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained('biometric_devices')->cascadeOnDelete();
            $table->json('raw_data');
            $table->integer('attempts')->default(0);
            $table->timestamp('last_attempt')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['device_id', 'attempts']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_sync_queue');
    }
};
