<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            if (!Schema::hasColumn('branches', 'address')) {
                $table->string('address')->nullable()->after('location');
            }
            if (!Schema::hasColumn('branches', 'city')) {
                $table->string('city')->nullable()->after('address');
            }
            if (!Schema::hasColumn('branches', 'country')) {
                $table->string('country')->nullable()->after('city');
            }
            if (!Schema::hasColumn('branches', 'type')) {
                $table->enum('type', ['HQ', 'Regional', 'Satellite', 'Virtual'])->default('Regional')->after('code');
            }
            if (!Schema::hasColumn('branches', 'is_hq')) {
                $table->boolean('is_hq')->default(false)->after('type');
            }
            if (!Schema::hasColumn('branches', 'manager_id')) {
                $table->unsignedBigInteger('manager_id')->nullable()->after('is_hq');
                $table->foreign('manager_id')->references('id')->on('employees')->onDelete('set null');
            }
            if (!Schema::hasColumn('branches', 'employee_count')) {
                $table->integer('employee_count')->default(0)->after('manager_id');
            }
            if (!Schema::hasColumn('branches', 'device_count')) {
                $table->integer('device_count')->default(0)->after('employee_count');
            }

            // softDeletes and indexes might also exist, but Schema::hasColumn only checks columns
            // For simplicity, we just check the primary columns
        });
    }

    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropForeign(['manager_id']);
            $table->dropColumn([
                'address',
                'city',
                'country',
                'type',
                'is_hq',
                'manager_id',
                'employee_count',
                'device_count'
            ]);
        });
    }
};
