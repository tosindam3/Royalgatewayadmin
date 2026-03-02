<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('performance_monthly_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('period_id')->constrained('payroll_periods')->onDelete('cascade');
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->integer('score')->default(0); // 0-100
            $table->text('notes')->nullable();
            $table->timestamps();
            
            // Constraints and indexes
            $table->unique(['period_id', 'employee_id']);
            $table->index('score');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('performance_monthly_scores');
    }
};
