<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Onboarding Templates
        Schema::create('onboarding_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedBigInteger('department_id')->nullable();
            $table->unsignedBigInteger('designation_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('is_active');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('set null');
            $table->foreign('designation_id')->references('id')->on('designations')->onDelete('set null');
        });

        // Template Tasks
        Schema::create('onboarding_template_tasks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('template_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('default_owner_role')->nullable();
            $table->integer('offset_days')->default(0);
            $table->boolean('required')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('template_id');
            $table->foreign('template_id')->references('id')->on('onboarding_templates')->onDelete('cascade');
        });

        // Onboarding Cases
        Schema::create('onboarding_cases', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id');
            $table->unsignedBigInteger('template_id')->nullable();
            $table->date('start_date');
            $table->enum('status', ['ongoing', 'completed', 'cancelled'])->default('ongoing');
            $table->integer('completion_percent')->default(0);
            $table->unsignedBigInteger('created_by');
            $table->timestamps();

            $table->index('employee_id');
            $table->index('status');
            $table->index('start_date');
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            $table->foreign('template_id')->references('id')->on('onboarding_templates')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('restrict');
        });

        // Onboarding Tasks
        Schema::create('onboarding_tasks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('case_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('owner_user_id')->nullable();
            $table->string('owner_role')->nullable();
            $table->date('due_date')->nullable();
            $table->enum('status', ['todo', 'in_progress', 'blocked', 'done'])->default('todo');
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
            $table->boolean('required')->default(true);
            $table->timestamps();

            $table->index(['case_id', 'status']);
            $table->index('due_date');
            $table->index('owner_user_id');
            $table->foreign('case_id')->references('id')->on('onboarding_cases')->onDelete('cascade');
            $table->foreign('owner_user_id')->references('id')->on('users')->onDelete('set null');
        });

        // Task Comments
        Schema::create('onboarding_task_comments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('task_id');
            $table->unsignedBigInteger('user_id');
            $table->text('body');
            $table->timestamps();

            $table->index('task_id');
            $table->foreign('task_id')->references('id')->on('onboarding_tasks')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // Task Attachments
        Schema::create('onboarding_task_attachments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('task_id');
            $table->string('file_path');
            $table->string('original_name');
            $table->string('mime_type');
            $table->integer('size');
            $table->unsignedBigInteger('uploaded_by');
            $table->timestamps();

            $table->index('task_id');
            $table->foreign('task_id')->references('id')->on('onboarding_tasks')->onDelete('cascade');
            $table->foreign('uploaded_by')->references('id')->on('users')->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('onboarding_task_attachments');
        Schema::dropIfExists('onboarding_task_comments');
        Schema::dropIfExists('onboarding_tasks');
        Schema::dropIfExists('onboarding_cases');
        Schema::dropIfExists('onboarding_template_tasks');
        Schema::dropIfExists('onboarding_templates');
    }
};
