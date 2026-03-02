<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Evaluation Templates
        Schema::create('evaluation_templates', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->json('sessions'); // Array of sessions containing fields
            $table->json('metadata')->nullable(); // Template settings, version info
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('cloned_from')->nullable()->constrained('evaluation_templates')->onDelete('set null');
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft')->index();
            $table->timestamp('published_at')->nullable();
            $table->integer('version')->default(1);
            $table->timestamps();
            $table->softDeletes();

            $table->index('created_by');
        });

        // Review Cycles
        Schema::create('review_cycles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['draft', 'active', 'closed'])->default('draft')->index();
            $table->foreignId('template_id')->nullable()->constrained('evaluation_templates')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['start_date', 'end_date']);
        });

        // Cycle Participants
        Schema::create('cycle_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cycle_id')->constrained('review_cycles')->onDelete('cascade');
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->foreignId('evaluator_id')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('status', ['pending', 'in_progress', 'completed'])->default('pending');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['cycle_id', 'employee_id']);
        });

        // Evaluation Responses
        Schema::create('evaluation_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('evaluation_templates')->onDelete('cascade');
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->foreignId('evaluator_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('cycle_id')->nullable()->constrained('review_cycles')->onDelete('set null');
            $table->json('answers'); // Session-based responses
            $table->enum('status', ['draft', 'submitted_to_manager', 'submitted_to_admin', 'approved', 'rejected', 'returned'])->default('draft')->index();
            $table->foreignId('submitted_to')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('feedback')->nullable();
            $table->json('approval_chain')->nullable(); // Track approval flow
            $table->timestamps();
            $table->softDeletes();

            $table->index(['employee_id', 'status']);
            $table->index('submitted_to');
            $table->index('evaluator_id');
        });

        // Goals
        Schema::create('goals', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('owner_id')->constrained('employees')->onDelete('cascade');
            $table->foreignId('parent_goal_id')->nullable()->constrained('goals')->onDelete('cascade');
            $table->enum('type', ['company', 'department', 'team', 'individual'])->default('individual');
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['draft', 'active', 'completed', 'cancelled'])->default('draft')->index();
            $table->integer('progress')->default(0); // 0-100
            $table->timestamps();
            $table->softDeletes();
        });

        // Key Results
        Schema::create('key_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('goal_id')->constrained('goals')->onDelete('cascade');
            $table->string('description');
            $table->decimal('target_value', 10, 2);
            $table->decimal('current_value', 10, 2)->default(0);
            $table->string('unit', 50); // e.g., '%', 'users', 'revenue'
            $table->integer('weight')->default(100); // For weighted progress
            $table->timestamps();
        });

        // Goal Updates (Progress tracking)
        Schema::create('goal_updates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('goal_id')->constrained('goals')->onDelete('cascade');
            $table->foreignId('key_result_id')->nullable()->constrained('key_results')->onDelete('cascade');
            $table->foreignId('updated_by')->constrained('users')->onDelete('cascade');
            $table->decimal('previous_value', 10, 2)->nullable();
            $table->decimal('new_value', 10, 2);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('goal_updates');
        Schema::dropIfExists('key_results');
        Schema::dropIfExists('goals');
        Schema::dropIfExists('evaluation_responses');
        Schema::dropIfExists('cycle_participants');
        Schema::dropIfExists('review_cycles');
        Schema::dropIfExists('evaluation_templates');
    }
};
