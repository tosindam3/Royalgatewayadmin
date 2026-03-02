<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->foreignId('leave_type_id')->constrained('leave_types')->onDelete('cascade');
            $table->year('year');
            $table->decimal('total_allocated', 5, 2)->default(0);
            $table->decimal('used', 5, 2)->default(0);
            $table->decimal('pending', 5, 2)->default(0);
            $table->decimal('available', 5, 2)->default(0);
            $table->decimal('carried_forward', 5, 2)->default(0);
            $table->date('expiry_date')->nullable();
            $table->timestamps();
            
            // Unique constraint
            $table->unique(['employee_id', 'leave_type_id', 'year']);
            
            // Performance indexes
            $table->index(['employee_id', 'year']);
            $table->index(['leave_type_id', 'year']);
            $table->index('expiry_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_balances');
    }
};
