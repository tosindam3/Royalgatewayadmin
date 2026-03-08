<?php

namespace App\Console\Commands;

use App\Services\BrandSettingsService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class WarmCache extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cache:warm
                            {--force : Force cache warming even if cache exists}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Warm up application cache with critical data';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🔥 Warming up application cache...');
        $this->newLine();

        $force = $this->option('force');
        $warmed = 0;

        // 1. Brand Settings
        if ($force || !Cache::has('brand_settings')) {
            $this->line('  ⏳ Warming brand settings cache...');
            app(BrandSettingsService::class)->getBrandSettings();
            $this->info('  ✅ Brand settings cached');
            $warmed++;
        } else {
            $this->line('  ⏭️  Brand settings already cached');
        }

        // 2. Organization Settings (common ones)
        $commonSettings = [
            'app.timezone',
            'app.locale',
            'app.date_format',
            'attendance.grace_period',
            'leave.max_days_advance',
        ];

        foreach ($commonSettings as $setting) {
            $cacheKey = "settings.{$setting}";
            if ($force || !Cache::has($cacheKey)) {
                $this->line("  ⏳ Warming setting: {$setting}...");
                Cache::remember($cacheKey, 3600, function () use ($setting) {
                    return \App\Models\OrganizationSetting::get($setting);
                });
                $this->info("  ✅ Setting cached: {$setting}");
                $warmed++;
            }
        }

        // 3. Active Roles (if using Spatie)
        if (class_exists(\Spatie\Permission\Models\Role::class)) {
            if ($force || !Cache::has('roles.active')) {
                $this->line('  ⏳ Warming roles cache...');
                Cache::remember('roles.active', 3600, function () {
                    return \Spatie\Permission\Models\Role::with('permissions')->get();
                });
                $this->info('  ✅ Roles cached');
                $warmed++;
            } else {
                $this->line('  ⏭️  Roles already cached');
            }
        }

        // 4. Active Permissions
        if (class_exists(\Spatie\Permission\Models\Permission::class)) {
            if ($force || !Cache::has('permissions.active')) {
                $this->line('  ⏳ Warming permissions cache...');
                Cache::remember('permissions.active', 3600, function () {
                    return \Spatie\Permission\Models\Permission::all();
                });
                $this->info('  ✅ Permissions cached');
                $warmed++;
            } else {
                $this->line('  ⏭️  Permissions already cached');
            }
        }

        $this->newLine();
        $this->info("✅ Cache warming complete! Warmed {$warmed} cache entries.");
        
        // Show cache statistics
        try {
            $redis = \Illuminate\Support\Facades\Redis::connection('cache');
            $info = $redis->info();
            
            if (isset($info['used_memory_human'])) {
                $this->line("📊 Redis Memory Usage: {$info['used_memory_human']}");
            }
            
            if (isset($info['connected_clients'])) {
                $this->line("👥 Connected Clients: {$info['connected_clients']}");
            }
        } catch (\Exception $e) {
            // Silently fail if Redis info not available
        }

        return Command::SUCCESS;
    }
}
