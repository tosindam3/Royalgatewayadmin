<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->decimal('base_salary', 12, 2)->default(0)->after('allow_mobile_checkin');
            $table->string('bank_account_number')->nullable()->after('base_salary');
            $table->string('bank_name')->nullable()->after('bank_account_number');
            $table->string('tax_id')->nullable()->after('bank_name');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['base_salary', 'bank_account_number', 'bank_name', 'tax_id']);
        });
    }
};
