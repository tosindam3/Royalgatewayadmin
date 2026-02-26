<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('biometric_devices', function (Blueprint $table) {
            $table->id();
            $table->string('device_name', 100);
            $table->string('device_serial', 50)->unique();
            $table->string('ip_address', 45);
            $table->integer('port')->default(4370);
            $table->string('location')->nullable();
            $table->foreignId('workplace_id')->nullable()->constrained('workplaces')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_sync')->nullable();
            $table->timestamps();

            $table->index(['is_active', 'last_sync']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('biometric_devices');
    }
};
