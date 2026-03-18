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
        Schema::table('organization_settings', function (Blueprint $table) {
            $table->text('proposed_value')->nullable()->after('value');
            $table->boolean('is_pending_approval')->default(false)->after('proposed_value');
            $table->foreignId('proposed_by_id')->nullable()->constrained('users')->after('is_pending_approval');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('organization_settings', function (Blueprint $table) {
            $table->dropColumn(['proposed_value', 'is_pending_approval', 'proposed_by_id']);
        });
    }
};
