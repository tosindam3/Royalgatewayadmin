<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_number')->unique(); // LR-2026-00001
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->foreignId('leave_type_id')->constrained('leave_types')->onDelete('restrict');
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('total_days', 5, 2); // Supports half days
            $table->text('reason');
            $table->string('contact_during_leave')->nullable();
            $table->string('document_path')->nullable();
            $table->enum('status', ['draft', 'pending', 'approved', 'rejected', 'cancelled', 'withdrawn'])->default('pending');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('approval_notes')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->timestamps();
            
            // Performance indexes
            $table->index('request_number');
            $table->index(['employee_id', 'status']);
            $table->index(['leave_type_id', 'status']);
            $table->index(['start_date', 'end_date']);
            $table->index(['status', 'created_at']);
            $table->index('approved_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_requests');
    }
};
