<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_run_employees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payroll_run_id')->constrained('payroll_runs')->onDelete('cascade');
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            
            // Snapshots (reproducible calculation inputs)
            $table->decimal('base_salary_snapshot', 12, 2)->default(0);
            $table->integer('absent_days')->default(0);
            $table->integer('late_minutes')->default(0);
            $table->decimal('overtime_hours', 8, 2)->default(0);
            $table->integer('performance_score')->default(0);
            
            // Calculated results
            $table->json('earnings_json')->nullable(); // [{code, label, amount}]
            $table->json('deductions_json')->nullable(); // [{code, label, amount}]
            $table->decimal('gross_pay', 12, 2)->default(0);
            $table->decimal('total_deductions', 12, 2)->default(0);
            $table->decimal('net_pay', 12, 2)->default(0);
            
            // Calculation version for future recalculations
            $table->integer('calc_version')->default(1);
            
            $table->timestamps();
            
            // Constraints and indexes
            $table->unique(['payroll_run_id', 'employee_id']);
            $table->index(['payroll_run_id', 'net_pay']);
            $table->index('employee_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_run_employees');
    }
};
