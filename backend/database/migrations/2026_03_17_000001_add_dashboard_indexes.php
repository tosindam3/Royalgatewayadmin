<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Attendance pulse: today's records by branch + status
        $this->addIndex('attendance_records', 'idx_att_date_branch_status',
            ['attendance_date', 'branch_id', 'status']);

        // Leave stats by employee + status + date range (no department_id on this table)
        $this->addIndex('leave_requests', 'idx_leave_emp_status_date',
            ['employee_id', 'status', 'start_date', 'end_date']);

        // Employee headcount over time
        $this->addIndex('employees', 'idx_emp_created_branch_status',
            ['created_at', 'branch_id', 'status']);

        // Performance submissions by employee
        $this->addIndex('performance_submissions', 'idx_perf_emp_status_score',
            ['employee_id', 'status', 'submitted_at']);

        // Performance by dept
        $this->addIndex('performance_submissions', 'idx_perf_dept_status_score',
            ['department_id', 'status']);
    }

    public function down(): void
    {
        $this->dropIndexSafe('attendance_records', 'idx_att_date_branch_status');
        $this->dropIndexSafe('leave_requests', 'idx_leave_emp_status_date');
        $this->dropIndexSafe('employees', 'idx_emp_created_branch_status');
        $this->dropIndexSafe('performance_submissions', 'idx_perf_emp_status_score');
        $this->dropIndexSafe('performance_submissions', 'idx_perf_dept_status_score');
    }

    private function addIndex(string $table, string $name, array $columns): void
    {
        if (!Schema::hasTable($table)) return;

        $exists = DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$name]);
        if (empty($exists)) {
            Schema::table($table, function (Blueprint $t) use ($name, $columns) {
                $t->index($columns, $name);
            });
        }
    }

    private function dropIndexSafe(string $table, string $name): void
    {
        if (!Schema::hasTable($table)) return;
        $exists = DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$name]);
        if (!empty($exists)) {
            Schema::table($table, fn(Blueprint $t) => $t->dropIndex($name));
        }
    }
};
