<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Branches
        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('location')->nullable();
            $table->string('timezone')->default('UTC');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
            
            $table->index('name');
        });

        // Departments
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->timestamps();
            
            $table->index('name');
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('set null');
        });

        // Designations
        Schema::create('designations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->timestamps();
            
            $table->index('name');
        });

        // Employees (core table with performance indexes)
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('employee_code')->unique();
            $table->unsignedBigInteger('user_id')->nullable()->unique();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->unsignedBigInteger('branch_id');
            $table->unsignedBigInteger('department_id');
            $table->unsignedBigInteger('designation_id');
            $table->unsignedBigInteger('manager_id')->nullable();
            $table->enum('employment_type', ['full-time', 'part-time', 'contract'])->default('full-time');
            $table->enum('work_mode', ['onsite', 'remote', 'hybrid'])->default('onsite');
            $table->enum('status', ['active', 'probation', 'suspended', 'terminated'])->default('active');
            $table->date('hire_date');
            $table->date('dob')->nullable();
            $table->string('avatar')->nullable();
            $table->string('blood_group')->nullable();
            $table->string('genotype')->nullable();
            $table->text('academics')->nullable();
            $table->boolean('password_change_required')->default(true);
            $table->timestamps();
            $table->softDeletes();

            // Performance indexes (per spec)
            $table->index('branch_id');
            $table->index('department_id');
            $table->index('designation_id');
            $table->index('manager_id');
            $table->index('status');
            $table->index('hire_date');
            $table->index(['last_name', 'first_name']);
            $table->index('created_at');
            $table->index('user_id');

            // Foreign keys
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('restrict');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('restrict');
            $table->foreign('designation_id')->references('id')->on('designations')->onDelete('restrict');
            $table->foreign('manager_id')->references('id')->on('employees')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
        Schema::dropIfExists('designations');
        Schema::dropIfExists('departments');
        Schema::dropIfExists('branches');
    }
};
