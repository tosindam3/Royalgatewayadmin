<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'status')) {
                $table->string('status')->default('active')->after('password');
            }
            if (!Schema::hasColumn('users', 'branch_id')) {
                $table->foreignId('branch_id')->nullable()->after('status')->constrained('branches')->onDelete('set null');
            }
            if (!Schema::hasColumn('users', 'department_id')) {
                $table->foreignId('department_id')->nullable()->after('branch_id')->constrained('departments')->onDelete('set null');
            }
            if (!Schema::hasColumn('users', 'manager_id')) {
                $table->foreignId('manager_id')->nullable()->after('department_id')->constrained('users')->onDelete('set null');
            }
            if (!Schema::hasColumn('users', 'primary_role_id')) {
                $table->foreignId('primary_role_id')->nullable()->after('manager_id')->constrained('roles')->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropForeign(['department_id']);
            $table->dropForeign(['manager_id']);
            $table->dropForeign(['primary_role_id']);
            $table->dropColumn(['status', 'branch_id', 'department_id', 'manager_id', 'primary_role_id']);
        });
    }
};
