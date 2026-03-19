<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Job Openings
        Schema::create('job_openings', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->text('requirements')->nullable();
            $table->text('responsibilities')->nullable();
            $table->unsignedBigInteger('department_id')->nullable();
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->string('location');
            $table->enum('employment_type', ['full_time', 'part_time', 'contract', 'intern'])->default('full_time');
            $table->enum('experience_level', ['entry', 'mid', 'senior', 'lead', 'executive'])->default('mid');
            $table->integer('openings')->default(1);
            $table->enum('status', ['draft', 'active', 'on_hold', 'closed'])->default('draft');
            $table->date('posted_date')->nullable();
            $table->date('closing_date')->nullable();
            $table->unsignedBigInteger('created_by');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'posted_date']);
            $table->index('department_id');
            $table->index('branch_id');
            $table->index('created_by');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('set null');
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('restrict');
        });

        // Candidates
        Schema::create('candidates', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->unique();
            $table->string('phone', 50)->nullable();
            $table->string('resume_path', 500)->nullable();
            $table->string('linkedin_url', 500)->nullable();
            $table->enum('source', ['linkedin', 'indeed', 'referral', 'direct', 'agency', 'other'])->default('direct');
            $table->decimal('overall_rating', 3, 2)->nullable();
            $table->unsignedBigInteger('user_id')->nullable(); // Link to user if internal
            $table->timestamps();
            $table->softDeletes();

            $table->index('email');
            $table->index('source');
            $table->index('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });

        // Applications
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('candidate_id');
            $table->unsignedBigInteger('job_opening_id');
            $table->enum('stage', ['applied', 'screening', 'technical', 'interview', 'offer', 'hired', 'rejected'])->default('applied');
            $table->enum('status', ['active', 'withdrawn', 'rejected', 'hired'])->default('active');
            $table->timestamp('applied_date')->useCurrent();
            $table->text('cover_letter')->nullable();
            $table->unsignedBigInteger('referrer_employee_id')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['candidate_id', 'job_opening_id']);
            $table->index(['job_opening_id', 'stage']);
            $table->index(['job_opening_id', 'status']);
            $table->index('stage');
            $table->index('referrer_employee_id');
            $table->foreign('candidate_id')->references('id')->on('candidates')->onDelete('cascade');
            $table->foreign('job_opening_id')->references('id')->on('job_openings')->onDelete('cascade');
            $table->foreign('referrer_employee_id')->references('id')->on('employees')->onDelete('set null');
        });

        // Interviews
        Schema::create('interviews', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('application_id');
            $table->enum('interview_type', ['phone', 'video', 'in_person', 'technical', 'panel'])->default('video');
            $table->dateTime('scheduled_date');
            $table->integer('duration_minutes')->default(60);
            $table->string('location')->nullable();
            $table->string('meeting_link', 500)->nullable();
            $table->unsignedBigInteger('interviewer_id')->nullable();
            $table->text('feedback')->nullable();
            $table->decimal('rating', 3, 2)->nullable();
            $table->enum('status', ['scheduled', 'completed', 'cancelled', 'no_show'])->default('scheduled');
            $table->timestamps();
            $table->softDeletes();

            $table->index('application_id');
            $table->index('scheduled_date');
            $table->index('interviewer_id');
            $table->index('status');
            $table->foreign('application_id')->references('id')->on('applications')->onDelete('cascade');
            $table->foreign('interviewer_id')->references('id')->on('users')->onDelete('set null');
        });

        // Candidate Notes
        Schema::create('candidate_notes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('application_id');
            $table->unsignedBigInteger('user_id');
            $table->text('note');
            $table->boolean('is_private')->default(false);
            $table->timestamps();

            $table->index('application_id');
            $table->index('user_id');
            $table->foreign('application_id')->references('id')->on('applications')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidate_notes');
        Schema::dropIfExists('interviews');
        Schema::dropIfExists('applications');
        Schema::dropIfExists('candidates');
        Schema::dropIfExists('job_openings');
    }
};
