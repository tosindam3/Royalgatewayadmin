<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'role')) {
                // Nullable string to store a legacy/convenience role name
                // e.g. 'super_admin', 'employee' — mirrors primary_role_id for quick lookups
                $table->string('role')->nullable()->after('name');
            }
        });

        // Backfill existing users from their primary role
        DB::table('users')
            ->join('roles', 'users.primary_role_id', '=', 'roles.id')
            ->where(function ($q) {
                $q->whereNull('users.role')->orWhere('users.role', '');
            })
            ->update(['users.role' => DB::raw('roles.name')]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'role')) {
                $table->dropColumn('role');
            }
        });
    }
};
