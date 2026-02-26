<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class OrganizationMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // If authenticated, we could set a global organization ID or check permissions.
        // For a single-tenant "tenant-ready" app, we might just ensure the organization
        // settings are loaded.

        return $next($request);
    }
}
