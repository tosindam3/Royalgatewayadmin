<?php

namespace App\Http\Middleware;

use App\Services\AttendanceScopeService;
use Closure;
use Illuminate\Http\Request;

class AttendanceAccessMiddleware
{
    public function __construct(
        private AttendanceScopeService $scopeService
    ) {}

    public function handle(Request $request, Closure $next, string $requiredAccess = 'view')
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated',
            ], 401);
        }

        // Check specific access requirements
        switch ($requiredAccess) {
            case 'settings':
                if (!$this->scopeService->canManageSettings($user)) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'You do not have permission to manage attendance settings',
                    ], 403);
                }
                break;
                
            case 'approve':
                if (!$this->scopeService->canApproveCorrections($user)) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'You do not have permission to approve corrections',
                    ], 403);
                }
                break;
                
            case 'export':
                if (!$this->scopeService->canExport($user)) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'You do not have permission to export reports',
                    ], 403);
                }
                break;
                
            case 'view':
            default:
                // Basic view access - everyone with employee profile can view their own
                // Superadmins and Admins can view even without a profile
                if (!$user->employeeProfile && !$user->hasRole('super_admin') && !$user->hasRole('admin')) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Employee profile not found',
                    ], 403);
                }
                break;
        }

        // Attach scope to request for use in controllers
        $request->attributes->set('attendance_scope', $this->scopeService->getAccessScope($user));

        return $next($request);
    }
}
