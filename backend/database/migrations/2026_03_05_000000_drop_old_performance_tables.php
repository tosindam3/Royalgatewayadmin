<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * WARNING: This will delete all existing performance data!
     * - All evaluation templates
     * - All evaluation responses
     * - All review cycles
     * - All goals and OKRs
     * - All performance scores
     * 
     * NOTE: payroll_run_employees.performance_score column is preserved
     * for payroll integration
     */
    public function up(): void
    {
        // Drop in reverse order of dependencies
        
        // Goal-related tables
        Schema::dropIfExists('goal_updates');
        Schema::dropIfExists('key_result_updates');
        Schema::dropIfExists('key_results');
        Schema::dropIfExists('goals');
        
        // Evaluation-related tables
        Schema::dropIfExists('evaluation_responses');
        Schema::dropIfExists('cycle_participants');
        Schema::dropIfExists('review_cycles');
        Schema::dropIfExists('evaluation_templates');
        
        // Performance scores (old monthly scores table)
        Schema::dropIfExists('performance_monthly_scores');
        
        // NOTE: We keep payroll_run_employees.performance_score column
        // The new Paforma system will populate this field during payroll processing
    }

    /**
     * Reverse the migrations.
     * 
     * Note: This will recreate the tables but data will be lost
     */
    public function down(): void
    {
        // Evaluation Templates
        Schema::create('evaluation_templates', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->json('sessions'); // Array of evaluation sessions/sections
            $table->json('metadata')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('cloned_from')->nullable()->constrained('evaluation_templates')->onDelete('set null');
            $table->string('version')->default('1.0');
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft')->index();
            $table->timestamp('published_at')->nullable();
            $table->boolean('is_global')->default(false)->index();
            $table->timestamps();
            $table->softDeletes();
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
            $table->json('settings')->nullable();
            $table->timestamps();
            $table->softDeletes();
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
        });

        // Evaluation Responses
        Schema::create('evaluation_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('evaluation_templates')->onDelete('cascade');
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->foreignId('evaluator_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('cycle_id')->nullable()->constrained('review_cycles')->onDelete('set null');
            $table->json('answers');
            $table->enum('status', ['draft', 'submitted_to_manager', 'submitted_to_admin', 'approved', 'rejected', 'returned'])->default('draft')->index();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('review_comments')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['employee_id', 'status']);
            $table->index(['evaluator_id', 'status']);
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
            $table->enum('status', ['draft', 'active', 'completed', 'cancelled'])->default('draft');
            $table->integer('progress')->default(0);
            $table->timestamps();
        });

        // Key Results
        Schema::create('key_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('goal_id')->constrained('goals')->onDelete('cascade');
            $table->string('description');
            $table->decimal('target_value', 10, 2);
            $table->decimal('current_value', 10, 2)->default(0);
            $table->string('unit')->nullable();
            $table->timestamps();
        });

        // Key Result Updates
        Schema::create('key_result_updates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('key_result_id')->constrained('key_results')->onDelete('cascade');
            $table->foreignId('updated_by')->constrained('users')->onDelete('cascade');
            $table->decimal('value', 10, 2);
            $table->text('note')->nullable();
            $table->timestamps();
        });

        // Goal Updates
        Schema::create('goal_updates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('goal_id')->constrained('goals')->onDelete('cascade');
            $table->foreignId('key_result_id')->nullable()->constrained('key_results')->onDelete('cascade');
            $table->foreignId('updated_by')->constrained('users')->onDelete('cascade');
            $table->text('note');
            $table->timestamps();
        });

        // Performance Monthly Scores
        Schema::create('performance_monthly_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('period_id')->constrained('payroll_periods')->onDelete('cascade');
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->integer('score')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }
};
