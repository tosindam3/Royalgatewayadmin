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
        Schema::table('employees', function (Blueprint $table) {
            // Composite indexes for common filtering patterns
            $table->index(['status', 'department_id'], 'idx_emp_status_dept');
            $table->index(['status', 'branch_id'], 'idx_emp_status_branch');
            $table->index(['branch_id', 'department_id'], 'idx_emp_branch_dept');

            // Covering index for common list views
            $table->index(['status', 'last_name', 'first_name'], 'idx_emp_status_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropIndex('idx_emp_status_dept');
            $table->dropIndex('idx_emp_status_branch');
            $table->dropIndex('idx_emp_branch_dept');
            $table->dropIndex('idx_emp_status_name');
        });
    }
};
