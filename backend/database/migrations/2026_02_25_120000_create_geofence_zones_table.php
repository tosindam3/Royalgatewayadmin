<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('geofence_zones', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('cascade');
            $table->enum('geometry_type', ['circle', 'polygon'])->default('circle');
            $table->json('geometry')->nullable(); // Store polygon coordinates or circle data
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->integer('radius')->default(100); // meters for circle type
            $table->boolean('is_active')->default(true);
            $table->boolean('is_strict')->default(true); // Strict enforcement
            $table->boolean('allow_web')->default(true);
            $table->boolean('allow_app')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['is_active', 'branch_id']);
            $table->index('geometry_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('geofence_zones');
    }
};
