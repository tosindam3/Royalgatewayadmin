<?php
// Simple script to seed brand settings without cache issues
require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

try {
    // Use DB directly to avoid cache issues
    $pdo = DB::connection()->getPdo();
    
    // Check if organization_settings table exists
    $tableExists = DB::select("SHOW TABLES LIKE 'organization_settings'");
    
    if (empty($tableExists)) {
        echo "❌ Error: organization_settings table does not exist!\n";
        echo "Run migrations first: php artisan migrate\n";
        exit(1);
    }
    
    // Check if record exists
    $existing = DB::table('organization_settings')->first();
    
    if (!$existing) {
        // Create new record
        DB::table('organization_settings')->insert([
            'organization_id' => 1,
            'company_name' => 'HR360',
            'primary_color' => '#8252e9',
            'secondary_color' => '#6366f1',
            'logo_url' => '',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        echo "✅ Brand settings created!\n";
    } else {
        // Update existing record
        DB::table('organization_settings')
            ->where('id', $existing->id)
            ->update([
                'company_name' => 'HR360',
                'primary_color' => '#8252e9',
                'secondary_color' => '#6366f1',
                'updated_at' => now(),
            ]);
        echo "✅ Brand settings updated!\n";
    }
    
    // Verify
    $settings = DB::table('organization_settings')->first();
    echo "\nCurrent Settings:\n";
    echo "Company: " . $settings->company_name . "\n";
    echo "Primary Color: " . $settings->primary_color . "\n";
    echo "Secondary Color: " . $settings->secondary_color . "\n";
    
    // Clear cache
    echo "\nClearing cache...\n";
    Artisan::call('cache:clear');
    echo "✅ Cache cleared!\n";
    
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
