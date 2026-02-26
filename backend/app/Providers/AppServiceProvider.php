<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

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
    }
}
