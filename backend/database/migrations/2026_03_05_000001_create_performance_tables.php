<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Performance Submissions (main table for employee performance data)
        Schema::create('performance_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->foreignId('department_id')->constrained('departments')->onDelete('cascade');
            $table->string('period'); // e.g., "2026-W10", "2026-03"
            $table->json('form_data'); // Dynamic form responses
            $table->decimal('score', 5, 2)->nullable();
            $table->json('rating')->nullable(); // {label, color, bgColor, borderColor}
            $table->json('breakdown')->nullable(); // Score breakdown by field
            $table->enum('status', ['draft', 'submitted', 'reviewed', 'approved'])->default('draft');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('reviewer_comments')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['employee_id', 'status']);
            $table->index(['department_id', 'status']);
            $table->index(['period', 'status']);
            $table->index('submitted_at');
        });

        // Performance Department Configs (department-specific form templates)
        Schema::create('performance_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained('departments')->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->json('sections'); // Form sections with fields
            $table->json('scoring_config'); // Scoring method, thresholds, weights
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            
            $table->index(['department_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('performance_submissions');
        Schema::dropIfExists('performance_configs');
    }
};
