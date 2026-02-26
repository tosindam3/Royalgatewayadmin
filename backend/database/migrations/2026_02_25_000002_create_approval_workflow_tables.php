<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Approval Workflows
        Schema::create('approval_workflows', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique(); // leave_request, attendance_correction, etc.
            $table->string('module'); // leave, attendance, payroll, etc.
            $table->string('trigger_event'); // created, status_change, etc.
            $table->text('description')->nullable();
            $table->json('conditions')->nullable(); // Conditional rules (amount > 1000, days > 5, etc.)
            $table->boolean('is_active')->default(true);
            $table->boolean('is_system')->default(false);
            $table->integer('priority')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        // Approval Steps (workflow stages)
        Schema::create('approval_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_id')->constrained('approval_workflows')->onDelete('cascade');
            $table->integer('step_order'); // 1, 2, 3, etc.
            $table->string('name'); // Manager Approval, HR Approval, etc.
            $table->enum('approver_type', ['role', 'user', 'manager', 'department_head', 'branch_head']); // Who approves
            $table->foreignId('approver_role_id')->nullable()->constrained('roles')->onDelete('cascade');
            $table->foreignId('approver_user_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->enum('scope_level', ['all', 'branch', 'department', 'team', 'self'])->default('team');
            $table->boolean('is_required')->default(true); // Can this step be skipped?
            $table->boolean('allow_parallel')->default(false); // Multiple approvers at same step?
            $table->integer('timeout_hours')->nullable(); // Auto-escalate after X hours
            $table->json('conditions')->nullable(); // Step-specific conditions
            $table->timestamps();
            
            $table->unique(['workflow_id', 'step_order']);
        });

        // Approval Requests (instances of workflows)
        Schema::create('approval_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_number')->unique(); // AR-2024-00001
            $table->foreignId('workflow_id')->constrained('approval_workflows')->onDelete('cascade');
            $table->morphs('requestable'); // The entity being approved (leave, correction, etc.)
            $table->foreignId('requester_id')->constrained('users')->onDelete('cascade');
            $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled', 'expired'])->default('pending');
            $table->integer('current_step')->default(1);
            $table->foreignId('current_approver_id')->nullable()->constrained('users')->onDelete('set null');
            $table->text('requester_comment')->nullable();
            $table->timestamp('submitted_at');
            $table->timestamp('completed_at')->nullable();
            $table->json('metadata')->nullable(); // Additional context
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['status', 'current_approver_id']);
        });

        // Approval Actions (individual approver actions)
        Schema::create('approval_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('request_id')->constrained('approval_requests')->onDelete('cascade');
            $table->foreignId('step_id')->constrained('approval_steps')->onDelete('cascade');
            $table->foreignId('approver_id')->constrained('users')->onDelete('cascade');
            $table->enum('action', ['approved', 'rejected', 'delegated', 'escalated'])->default('approved');
            $table->text('comment')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('acted_at');
            $table->timestamps();
            
            $table->index(['request_id', 'step_id']);
            $table->index(['approver_id', 'acted_at']);
        });

        // Approval Delegates (temporary delegation)
        Schema::create('approval_delegates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Original approver
            $table->foreignId('delegate_id')->constrained('users')->onDelete('cascade'); // Delegate
            $table->foreignId('workflow_id')->nullable()->constrained('approval_workflows')->onDelete('cascade'); // Specific workflow or all
            $table->dateTime('start_date');
            $table->dateTime('end_date');
            $table->text('reason')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index(['user_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_delegates');
        Schema::dropIfExists('approval_actions');
        Schema::dropIfExists('approval_requests');
        Schema::dropIfExists('approval_steps');
        Schema::dropIfExists('approval_workflows');
    }
};
