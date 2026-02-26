<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Roles table
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('display_name');
            $table->text('description')->nullable();
            $table->enum('default_scope', ['all', 'branch', 'department', 'team', 'self'])->default('self');
            $table->boolean('is_system')->default(false); // System roles cannot be deleted
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // Permissions table
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // e.g., employees.view
            $table->string('display_name');
            $table->string('module'); // employees, leave, payroll, etc.
            $table->string('action'); // view, create, update, delete, approve, etc.
            $table->text('description')->nullable();
            $table->json('available_scopes')->nullable(); // ['all', 'branch', 'department', 'team', 'self']
            $table->boolean('is_system')->default(false);
            $table->timestamps();
        });

        // Role-Permission pivot with scope
        Schema::create('role_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained()->onDelete('cascade');
            $table->foreignId('permission_id')->constrained()->onDelete('cascade');
            $table->enum('scope_level', ['all', 'branch', 'department', 'team', 'self']);
            $table->timestamps();
            
            $table->unique(['role_id', 'permission_id', 'scope_level']);
        });

        // User-Role assignments
        Schema::create('user_roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('role_id')->constrained()->onDelete('cascade');
            $table->foreignId('assigned_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('assigned_at');
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            
            $table->unique(['user_id', 'role_id']);
        });

        // Add role tracking to users table
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('primary_role_id')->nullable()->constrained('roles')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['primary_role_id']);
            $table->dropColumn('primary_role_id');
        });
        
        Schema::dropIfExists('user_roles');
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
    }
};
