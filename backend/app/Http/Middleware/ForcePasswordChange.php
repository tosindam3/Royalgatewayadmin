<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForcePasswordChange
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Check if user has an employee profile that requires password change
        if ($user && $user->employeeProfile && $user->employeeProfile->password_change_required) {
            // Allow access to password change endpoints
            $allowedRoutes = [
                'api/auth/change-password',
                'api/auth/logout',
                'api/auth/me',
            ];

            $currentPath = $request->path();
            
            foreach ($allowedRoutes as $route) {
                if (str_starts_with($currentPath, $route)) {
                    return $next($request);
                }
            }

            // Block all other requests
            return response()->json([
                'error' => 'Password change required',
                'message' => 'You must change your password before accessing the system.',
                'password_change_required' => true,
                'redirect' => '/change-password'
            ], 403);
        }

        return $next($request);
    }
}
