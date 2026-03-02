<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_types', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Annual, Sick, Casual, Maternity, etc.
            $table->string('code')->unique(); // ANNUAL, SICK, CASUAL
            $table->text('description')->nullable();
            $table->integer('default_days_per_year'); // Default allocation
            $table->enum('accrual_method', ['upfront', 'monthly', 'pro_rata', 'per_incident'])->default('upfront');
            $table->decimal('accrual_rate', 5, 2)->nullable(); // For monthly accrual
            $table->boolean('is_carry_forward')->default(false);
            $table->integer('max_carry_forward_days')->nullable();
            $table->boolean('requires_approval')->default(true);
            $table->boolean('requires_document')->default(false);
            $table->integer('min_notice_days')->default(0); // Minimum notice required
            $table->integer('max_consecutive_days')->nullable();
            $table->boolean('is_paid')->default(true);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            // Performance indexes
            $table->index('code');
            $table->index(['is_active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_types');
    }
};
