<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckBrandSettingsPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $action = 'view'): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated',
            ], 401);
        }

        // Define permission requirements
        $permissions = [
            'view' => ['Super Admin', 'Admin', 'HR Admin', 'Manager', 'Employee'],
            'update' => ['Super Admin', 'Admin', 'HR Admin'],
            'reset' => ['Super Admin', 'Admin'],
            'history' => ['Super Admin', 'Admin', 'HR Admin'],
        ];

        $allowedRoles = $permissions[$action] ?? [];

        if (!$user->hasAnyRole($allowedRoles)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized to ' . $action . ' brand settings',
            ], 403);
        }

        return $next($request);
    }
}
