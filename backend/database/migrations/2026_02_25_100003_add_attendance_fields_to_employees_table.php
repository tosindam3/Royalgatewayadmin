<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->string('biometric_id', 50)->nullable()->unique()->after('employee_code');
            $table->foreignId('workplace_id')->nullable()->after('biometric_id')->constrained('workplaces')->nullOnDelete();
            $table->foreignId('work_schedule_id')->nullable()->after('workplace_id')->constrained('work_schedules')->nullOnDelete();
            $table->boolean('allow_mobile_checkin')->default(true)->after('work_schedule_id');

            $table->index('biometric_id');
            $table->index('workplace_id');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropForeign(['workplace_id']);
            $table->dropForeign(['work_schedule_id']);
            $table->dropIndex(['biometric_id']);
            $table->dropIndex(['workplace_id']);
            $table->dropColumn(['biometric_id', 'workplace_id', 'work_schedule_id', 'allow_mobile_checkin']);
        });
    }
};
