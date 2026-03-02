<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('period_id')->constrained('payroll_periods')->onDelete('cascade');
            $table->enum('scope_type', ['all', 'department', 'branch', 'custom'])->default('all');
            $table->unsignedBigInteger('scope_ref_id')->nullable();
            $table->enum('status', ['draft', 'submitted', 'approved', 'rejected'])->default('draft');
            $table->foreignId('prepared_by_user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('approver_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('approval_request_id')->nullable()->constrained('approval_requests')->onDelete('set null');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->decimal('total_gross', 15, 2)->default(0);
            $table->decimal('total_deductions', 15, 2)->default(0);
            $table->decimal('total_net', 15, 2)->default(0);
            $table->text('note')->nullable();
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['period_id', 'status']);
            $table->index(['approver_user_id', 'status']);
            $table->index(['status', 'submitted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_runs');
    }
};
