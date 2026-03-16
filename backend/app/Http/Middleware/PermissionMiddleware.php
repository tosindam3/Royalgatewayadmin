<?php

namespace App\Http\Middleware;

use App\Services\ScopeEngine;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PermissionMiddleware
{
    public function __construct(
        private ScopeEngine $scopeEngine
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  $permission
     * @param  string  $requiredScope
     * @return mixed
     */
    public function handle(Request $request, Closure $next, string $permission, string $requiredScope = 'self')
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated',
            ], 401);
        }

        $userScope = $this->scopeEngine->getUserScope($user, $permission);

        if ($userScope === 'none' || !$this->scopeEngine->isScopeSufficient($userScope, $requiredScope)) {
            return response()->json([
                'status' => 'error',
                'message' => "Forbidden: You do not have the required '{$permission}' permission with '{$requiredScope}' scope.",
                'debug' => [
                    'current_scope' => $userScope,
                    'required_scope' => $requiredScope
                ]
            ], 403);
        }

        // Attach scope to request attributes for controllers to use
        $request->attributes->set('access_scope', $userScope);
        $request->attributes->set('permission_name', $permission);

        return $next($request);
    }
}
