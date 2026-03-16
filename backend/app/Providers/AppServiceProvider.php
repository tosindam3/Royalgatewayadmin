<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Http\Request;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Prevent lazy loading for performance
        Model::preventLazyLoading(! $this->app->environment('production'));

        // Custom query macro for visibility scope
        Builder::macro('visibleTo', function ($user, string $permission = 'view') {
            /** @var Builder $this */

            // This is a placeholder for the actual logic that will interface with Spatie permissions
            // and the custom ScopeEngine mentioned in the foundation document.
            return $this->where('organization_id', $user->organization_id);
        });

        // Configure rate limiting
        $this->configureRateLimiting();
    }

    /**
     * Configure the rate limiters for the application.
     */
    protected function configureRateLimiting(): void
    {
        // API rate limit - per user
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(300)
                ->by($request->user()?->id ?: $request->ip())
                ->response(function () {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Too many requests. Please slow down.',
                    ], 429);
                });
        });

        // Attendance endpoints - higher limit for real-time operations
        RateLimiter::for('attendance', function (Request $request) {
            return Limit::perMinute(200)
                ->by($request->user()?->id ?: $request->ip());
        });

        // Auth endpoints - stricter limit
        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(10)
                ->by($request->ip());
        });
    }
}
