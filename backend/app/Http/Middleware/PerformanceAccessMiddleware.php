<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PerformanceAccessMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $scope = 'all')
    {
        $user = Auth::user();
        
        if (!$user || !$user->employee_id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied: Employee profile required'
            ], 403);
        }

        $userRoles = $user->roles->pluck('name')->toArray();
        $isHRAdmin = in_array('hr_admin', $userRoles) || in_array('super_admin', $userRoles);
        $isManager = in_array('manager', $userRoles) || in_array('department_head', $userRoles) || in_array('branch_manager', $userRoles);
        
        // Store user permissions in request for controllers to use
        $request->merge([
            'user_permissions' => [
                'is_hr_admin' => $isHRAdmin,
                'is_manager' => $isManager,
                'is_employee' => !$isHRAdmin && !$isManager,
                'employee_id' => $user->employee_id,
                'department_id' => $user->employeeProfile->department_id ?? null,
                'branch_id' => $user->employeeProfile->branch_id ?? null,
            ]
        ]);

        // Scope-based access control
        switch ($scope) {
            case 'admin_only':
                if (!$isHRAdmin) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Access denied: HR Admin privileges required'
                    ], 403);
                }
                break;
                
            case 'manager_or_admin':
                if (!$isHRAdmin && !$isManager) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Access denied: Manager or Admin privileges required'
                    ], 403);
                }
                break;
                
            case 'own_data_only':
                // This will be handled in individual controllers
                break;
        }

        return $next($request);
    }
}