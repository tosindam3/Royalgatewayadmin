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

        // Define permission requirements (role names must match DB snake_case values)
        $permissions = [
            'view'    => ['super_admin', 'admin', 'hr_manager', 'ceo', 'branch_manager', 'department_head', 'employee'],
            'update'  => ['super_admin', 'admin', 'hr_manager', 'ceo'],
            'reset'   => ['super_admin', 'admin'],
            'history' => ['super_admin', 'admin', 'hr_manager', 'ceo'],
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
