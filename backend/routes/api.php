<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// API v1 Routes
Route::prefix('v1')->group(function () {
    // Authentication Routes
    Route::post('/login', [App\Http\Controllers\AuthController::class, 'login']);
    Route::post('/logout', [App\Http\Controllers\AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('/user', [App\Http\Controllers\AuthController::class, 'user'])->middleware('auth:sanctum');
    Route::post('/change-password', [App\Http\Controllers\AuthController::class, 'changePassword'])->middleware('auth:sanctum');

    // HR Core Module Routes
    Route::prefix('hr-core')->group(function () {
        // Attendance System (ZKTeco + Mobile)
        Route::prefix('attendance')->middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
            Route::post('/check-in', [App\Http\Controllers\AttendanceController::class, 'checkIn']);
            Route::post('/check-out', [App\Http\Controllers\AttendanceController::class, 'checkOut']);
            Route::get('/today', [App\Http\Controllers\AttendanceController::class, 'today']);
            Route::get('/live', [App\Http\Controllers\AttendanceController::class, 'liveAttendance']);
            Route::get('/overview', [App\Http\Controllers\AttendanceController::class, 'overview']);
            Route::get('/daily-summary', [App\Http\Controllers\AttendanceController::class, 'dailySummary']);
            Route::get('/overtime', [App\Http\Controllers\AttendanceController::class, 'overtime']);
            Route::get('/history', [App\Http\Controllers\AttendanceController::class, 'history']);

            // Summary Tab (Monthly Aggregates)
            Route::prefix('summary')->group(function () {
                Route::get('/kpis', [App\Http\Controllers\AttendanceSummaryController::class, 'kpis']);
                Route::get('/', [App\Http\Controllers\AttendanceSummaryController::class, 'index']);
                Route::get('/{employeeId}', [App\Http\Controllers\AttendanceSummaryController::class, 'employeeMonth']);
                Route::post('/export', [App\Http\Controllers\AttendanceSummaryController::class, 'export']);
            });

            // Record Details
            Route::get('/records/{recordId}/details', [App\Http\Controllers\AttendanceSummaryController::class, 'recordDetails']);

            // Settings Workspace
            Route::prefix('settings')->group(function () {
                Route::get('/', [App\Http\Controllers\AttendanceController::class, 'getSettings']);
                Route::put('/', [App\Http\Controllers\AttendanceController::class, 'updateSettings']);

                Route::get('/geofences', [App\Http\Controllers\AttendanceController::class, 'getGeofences']);
                Route::post('/geofences', [App\Http\Controllers\AttendanceController::class, 'storeGeofence']);
                Route::put('/geofences/{id}', [App\Http\Controllers\AttendanceController::class, 'updateGeofence']);
                Route::delete('/geofences/{id}', [App\Http\Controllers\AttendanceController::class, 'destroyGeofence']);

                Route::get('/ip-whitelist', [App\Http\Controllers\AttendanceController::class, 'getIPWhitelist']);
                Route::post('/ip-whitelist', [App\Http\Controllers\AttendanceController::class, 'storeIPWhitelist']);
                Route::put('/ip-whitelist/{id}', [App\Http\Controllers\AttendanceController::class, 'updateIPWhitelist']);
                Route::delete('/ip-whitelist/{id}', [App\Http\Controllers\AttendanceController::class, 'destroyIPWhitelist']);
                Route::get('/my-ip', [App\Http\Controllers\AttendanceController::class, 'getMyIP']);

                Route::get('/biometric/devices', [App\Http\Controllers\BiometricDeviceController::class, 'index']); // Link to existing controller
                Route::get('/audit', [App\Http\Controllers\AttendanceController::class, 'auditLogs']);
            });
        });

        // Biometric Devices Management
        Route::prefix('biometric-devices')->group(function () {
            Route::get('/', [App\Http\Controllers\BiometricDeviceController::class, 'index']);
            Route::post('/', [App\Http\Controllers\BiometricDeviceController::class, 'store']);
            Route::get('/{id}', [App\Http\Controllers\BiometricDeviceController::class, 'show']);
            Route::put('/{id}', [App\Http\Controllers\BiometricDeviceController::class, 'update']);
            Route::delete('/{id}', [App\Http\Controllers\BiometricDeviceController::class, 'destroy']);
            Route::post('/{id}/test', [App\Http\Controllers\BiometricDeviceController::class, 'testConnection']);
            Route::post('/{id}/sync', [App\Http\Controllers\BiometricDeviceController::class, 'sync']);
            Route::post('/sync-all', [App\Http\Controllers\BiometricDeviceController::class, 'syncAll']);
        });

        // Workplaces Management
        Route::prefix('workplaces')->group(function () {
            Route::get('/', [App\Http\Controllers\WorkplaceController::class, 'index']);
            Route::post('/', [App\Http\Controllers\WorkplaceController::class, 'store']);
            Route::get('/{id}', [App\Http\Controllers\WorkplaceController::class, 'show']);
            Route::put('/{id}', [App\Http\Controllers\WorkplaceController::class, 'update']);
            Route::delete('/{id}', [App\Http\Controllers\WorkplaceController::class, 'destroy']);
        });

        // Employee Routes (No auth required for development - add auth:sanctum middleware in production)
        Route::prefix('employees')->group(function () {
            Route::get('/metrics', [App\Http\Controllers\EmployeeController::class, 'metrics']);
            Route::get('/department/{departmentId}', [App\Http\Controllers\EmployeeController::class, 'byDepartment']);
            Route::get('/branch/{branchId}', [App\Http\Controllers\EmployeeController::class, 'byBranch']);
            Route::get('/{id}/subordinates', [App\Http\Controllers\EmployeeController::class, 'subordinates']);
            Route::get('/{id}', [App\Http\Controllers\EmployeeController::class, 'show']);
            Route::get('/', [App\Http\Controllers\EmployeeController::class, 'index']);
            Route::post('/', [App\Http\Controllers\EmployeeController::class, 'store']);
            Route::put('/{id}', [App\Http\Controllers\EmployeeController::class, 'update']);
            Route::patch('/{id}/status', [App\Http\Controllers\EmployeeController::class, 'updateStatus']);
            Route::delete('/{id}', [App\Http\Controllers\EmployeeController::class, 'destroy']);
        });

        // Branch Routes (No auth required for development - add auth:sanctum middleware in production)
        Route::prefix('branches')->group(function () {
            Route::get('/', [App\Http\Controllers\BranchController::class, 'index']);
            Route::post('/', [App\Http\Controllers\BranchController::class, 'store']);
            Route::get('/{id}', [App\Http\Controllers\BranchController::class, 'show']);
            Route::put('/{id}', [App\Http\Controllers\BranchController::class, 'update']);
            Route::delete('/{id}', [App\Http\Controllers\BranchController::class, 'destroy']);
            Route::post('/{id}/restore', [App\Http\Controllers\BranchController::class, 'restore']);
            Route::get('/{id}/employees', [App\Http\Controllers\BranchController::class, 'employees']);
            Route::get('/{id}/statistics', [App\Http\Controllers\BranchController::class, 'statistics']);
            Route::patch('/{id}/update-counts', [App\Http\Controllers\BranchController::class, 'updateCounts']);
        });

        // Department Routes
        Route::prefix('departments')->group(function () {
            Route::get('/', [App\Http\Controllers\DepartmentController::class, 'index']);
            Route::post('/', [App\Http\Controllers\DepartmentController::class, 'store']);
            Route::get('/{id}', [App\Http\Controllers\DepartmentController::class, 'show']);
            Route::put('/{id}', [App\Http\Controllers\DepartmentController::class, 'update']);
            Route::delete('/{id}', [App\Http\Controllers\DepartmentController::class, 'destroy']);
            Route::get('/{id}/employees', [App\Http\Controllers\DepartmentController::class, 'employees']);
        });

        // Designation Routes
        Route::prefix('designations')->group(function () {
            Route::get('/', [App\Http\Controllers\DesignationController::class, 'index']);
            Route::post('/', [App\Http\Controllers\DesignationController::class, 'store']);
            Route::get('/{id}', [App\Http\Controllers\DesignationController::class, 'show']);
            Route::put('/{id}', [App\Http\Controllers\DesignationController::class, 'update']);
            Route::delete('/{id}', [App\Http\Controllers\DesignationController::class, 'destroy']);
            Route::get('/{id}/employees', [App\Http\Controllers\DesignationController::class, 'employees']);
        });
    });

    // RBAC & Approval System Routes
    Route::prefix('rbac')->group(function () {
        // Roles
        Route::prefix('roles')->group(function () {
            Route::get('/', [App\Http\Controllers\RoleController::class, 'index']);
            Route::post('/', [App\Http\Controllers\RoleController::class, 'store']);
            Route::get('/{id}', [App\Http\Controllers\RoleController::class, 'show']);
            Route::put('/{id}', [App\Http\Controllers\RoleController::class, 'update']);
            Route::delete('/{id}', [App\Http\Controllers\RoleController::class, 'destroy']);
            Route::post('/{id}/permissions', [App\Http\Controllers\RoleController::class, 'assignPermissions']);
            Route::get('/{id}/permissions', [App\Http\Controllers\RoleController::class, 'permissions']);
            Route::get('/{id}/users', [App\Http\Controllers\RoleController::class, 'users']);
        });

        // Permissions
        Route::prefix('permissions')->group(function () {
            Route::get('/', [App\Http\Controllers\PermissionController::class, 'index']);
            Route::get('/grouped', [App\Http\Controllers\PermissionController::class, 'groupedByModule']);
            Route::get('/matrix', [App\Http\Controllers\PermissionController::class, 'matrix']);
            Route::get('/modules', [App\Http\Controllers\PermissionController::class, 'modules']);
            Route::get('/actions', [App\Http\Controllers\PermissionController::class, 'actions']);
            Route::get('/{id}', [App\Http\Controllers\PermissionController::class, 'show']);
        });

        // User Roles
        Route::prefix('users')->group(function () {
            Route::get('/{userId}/roles', [App\Http\Controllers\UserRoleController::class, 'getUserRoles']);
            Route::post('/{userId}/roles', [App\Http\Controllers\UserRoleController::class, 'assignRoles']);
            Route::delete('/{userId}/roles/{roleId}', [App\Http\Controllers\UserRoleController::class, 'removeRole']);
            Route::get('/{userId}/permissions', [App\Http\Controllers\UserRoleController::class, 'getUserPermissions']);
            Route::post('/{userId}/check-permission', [App\Http\Controllers\UserRoleController::class, 'checkPermission']);
        });

        Route::post('/bulk-assign-role', [App\Http\Controllers\UserRoleController::class, 'bulkAssignRole']);
        Route::get('/role/{roleId}/users', [App\Http\Controllers\UserRoleController::class, 'getUsersByRole']);
    });

    // Approval Workflows
    Route::prefix('workflows')->group(function () {
        Route::get('/', [App\Http\Controllers\WorkflowController::class, 'index']);
        Route::post('/', [App\Http\Controllers\WorkflowController::class, 'store']);
        Route::get('/{id}', [App\Http\Controllers\WorkflowController::class, 'show']);
        Route::put('/{id}', [App\Http\Controllers\WorkflowController::class, 'update']);
        Route::delete('/{id}', [App\Http\Controllers\WorkflowController::class, 'destroy']);
        Route::put('/{id}/steps', [App\Http\Controllers\WorkflowController::class, 'updateSteps']);
        Route::patch('/{id}/toggle-active', [App\Http\Controllers\WorkflowController::class, 'toggleActive']);
    });

    // Approvals
    Route::prefix('approvals')->group(function () {
        Route::get('/pending', [App\Http\Controllers\ApprovalController::class, 'pending']);
        Route::get('/history', [App\Http\Controllers\ApprovalController::class, 'history']);
        Route::get('/statistics', [App\Http\Controllers\ApprovalController::class, 'statistics']);
        Route::get('/', [App\Http\Controllers\ApprovalController::class, 'index']);
        Route::get('/{id}', [App\Http\Controllers\ApprovalController::class, 'show']);
        Route::post('/{id}/approve', [App\Http\Controllers\ApprovalController::class, 'approve']);
        Route::post('/{id}/reject', [App\Http\Controllers\ApprovalController::class, 'reject']);
        Route::post('/{id}/cancel', [App\Http\Controllers\ApprovalController::class, 'cancel']);
    });
});
