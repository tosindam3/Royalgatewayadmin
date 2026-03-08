<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Ensure organization_settings table exists
        if (!Schema::hasTable('organization_settings')) {
            Schema::create('organization_settings', function (Blueprint $table) {
                $table->id();
                $table->string('key')->unique()->index();
                $table->json('value')->nullable();
                $table->string('type', 50)->default('string');
                $table->timestamps();
            });
        }

        // Insert default brand settings
        $defaultSettings = [
            [
                'key' => 'brand.company_name',
                'value' => json_encode('HR360'),
                'type' => 'string',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'brand.logo_url',
                'value' => json_encode(''),
                'type' => 'string',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'brand.primary_color',
                'value' => json_encode('#8252e9'),
                'type' => 'string',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($defaultSettings as $setting) {
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
        // Remove brand settings
        DB::table('organization_settings')
            ->whereIn('key', [
                'brand.company_name',
                'brand.logo_url',
                'brand.primary_color',
            ])
            ->delete();
    }
};
