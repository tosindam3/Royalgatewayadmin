<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $currencySettings = [
            [
                'key' => 'payroll.currency_code',
                'value' => json_encode('USD'),
                'type' => 'string',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'payroll.currency_symbol',
                'value' => json_encode('$'),
                'type' => 'string',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'payroll.currency_position',
                'value' => json_encode('before'), // before or after
                'type' => 'string',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'payroll.decimal_separator',
                'value' => json_encode('.'),
                'type' => 'string',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'payroll.thousand_separator',
                'value' => json_encode(','),
                'type' => 'string',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'payroll.decimal_places',
                'value' => json_encode(2),
                'type' => 'integer',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($currencySettings as $setting) {
            DB::table('organization_settings')->updateOrInsert(
                ['key' => $setting['key']],
                $setting
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('organization_settings')
            ->whereIn('key', [
                'payroll.currency_code',
                'payroll.currency_symbol',
                'payroll.currency_position',
                'payroll.decimal_separator',
                'payroll.thousand_separator',
                'payroll.decimal_places',
            ])
            ->delete();
    }
};
