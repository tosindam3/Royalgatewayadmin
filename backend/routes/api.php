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
            // Everyone can check in/out and view their own status
            Route::post('/check-in', [App\Http\Controllers\AttendanceController::class, 'checkIn']);
            Route::post('/check-out', [App\Http\Controllers\AttendanceController::class, 'checkOut']);
            Route::get('/today', [App\Http\Controllers\AttendanceController::class, 'today']);
            Route::get('/scope', [App\Http\Controllers\AttendanceController::class, 'getScope']);
            Route::get('/history', [App\Http\Controllers\AttendanceController::class, 'history']); // Moved outside middleware - auto-scoped to user
            
            // View access - scoped by role
            Route::middleware('attendance.access:view')->group(function () {
                Route::get('/live', [App\Http\Controllers\AttendanceController::class, 'liveAttendance']);
                Route::get('/overview', [App\Http\Controllers\AttendanceController::class, 'overview']);
                Route::get('/daily-summary', [App\Http\Controllers\AttendanceController::class, 'dailySummary']);
                Route::get('/overtime', [App\Http\Controllers\AttendanceController::class, 'overtime']);

                // Summary Tab (Monthly Aggregates)
                Route::prefix('summary')->group(function () {
                    Route::get('/kpis', [App\Http\Controllers\AttendanceSummaryController::class, 'kpis']);
                    Route::get('/', [App\Http\Controllers\AttendanceSummaryController::class, 'index']);
                    Route::get('/{employeeId}', [App\Http\Controllers\AttendanceSummaryController::class, 'employeeMonth']);
                });

                // Record Details
                Route::get('/records/{recordId}/details', [App\Http\Controllers\AttendanceSummaryController::class, 'recordDetails']);
            });
            
            // Export access - managers and HR only
            Route::middleware('attendance.access:export')->group(function () {
                Route::post('/summary/export', [App\Http\Controllers\AttendanceSummaryController::class, 'export']);
            });

            // Settings Workspace
            Route::prefix('settings')->group(function () {
                // GET routes - accessible to all (returns filtered data based on role)
                Route::get('/', [App\Http\Controllers\AttendanceController::class, 'getSettings']);
                Route::get('/geofences', [App\Http\Controllers\AttendanceController::class, 'getGeofences']);
                Route::get('/ip-whitelist', [App\Http\Controllers\AttendanceController::class, 'getIPWhitelist']);
                Route::get('/my-ip', [App\Http\Controllers\AttendanceController::class, 'getMyIP']);
                Route::get('/biometric/devices', [App\Http\Controllers\BiometricDeviceController::class, 'index']);
                Route::get('/audit', [App\Http\Controllers\AttendanceController::class, 'auditLogs']);
                
                // POST/PUT/DELETE routes - HR Admin only
                Route::middleware('attendance.access:settings')->group(function () {
                    Route::put('/', [App\Http\Controllers\AttendanceController::class, 'updateSettings']);
                    Route::post('/geofences', [App\Http\Controllers\AttendanceController::class, 'storeGeofence']);
                    Route::put('/geofences/{id}', [App\Http\Controllers\AttendanceController::class, 'updateGeofence']);
                    Route::delete('/geofences/{id}', [App\Http\Controllers\AttendanceController::class, 'destroyGeofence']);
                    Route::post('/ip-whitelist', [App\Http\Controllers\AttendanceController::class, 'storeIPWhitelist']);
                    Route::put('/ip-whitelist/{id}', [App\Http\Controllers\AttendanceController::class, 'updateIPWhitelist']);
                    Route::delete('/ip-whitelist/{id}', [App\Http\Controllers\AttendanceController::class, 'destroyIPWhitelist']);
                });
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

        // Employee Routes
        Route::prefix('employees')->middleware('auth:sanctum')->group(function () {
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

        // Branch Routes
        Route::prefix('branches')->middleware('auth:sanctum')->group(function () {
            Route::get('/', [App\Http\Controllers\BranchController::class, 'index']);
            Route::post('/', [App\Http\Controllers\BranchController::class, 'store']);
            Route::get('/{id}', [App\Http\Controllers\BranchController::class, 'show']);
            Route::put('/{id}', [App\Http\Controllers\BranchController::class, 'update']);
            Route::delete('/{id}', [App\Http\Controllers\BranchController::class, 'destroy']);
            Route::post('/{id}/restore', [App\Http\Controllers\BranchController::class, 'restore']);
            Route::get('/{id}/employees', [App\Http\Controllers\BranchController::class, 'employees']);
            Route::get('/{id}/statistics', [App\Http\Controllers\BranchController::class, 'statistics']);
            Route::patch('/{id}/update-counts', [App\Http\Controllers\BranchController::class, 'updateCounts']);
            Route::get('/{id}/geofence-zones', [App\Http\Controllers\BranchController::class, 'geofenceZones']);
            Route::get('/{id}/biometric-devices', [App\Http\Controllers\BranchController::class, 'biometricDevices']);
            Route::get('/{id}/work-schedules', [App\Http\Controllers\BranchController::class, 'workSchedules']);
        });

        // Department Routes
        Route::prefix('departments')->middleware('auth:sanctum')->group(function () {
            Route::get('/', [App\Http\Controllers\DepartmentController::class, 'index']);
            Route::post('/', [App\Http\Controllers\DepartmentController::class, 'store']);
            Route::get('/{id}', [App\Http\Controllers\DepartmentController::class, 'show']);
            Route::put('/{id}', [App\Http\Controllers\DepartmentController::class, 'update']);
            Route::delete('/{id}', [App\Http\Controllers\DepartmentController::class, 'destroy']);
            Route::get('/{id}/employees', [App\Http\Controllers\DepartmentController::class, 'employees']);
        });

        // Designation Routes
        Route::prefix('designations')->middleware('auth:sanctum')->group(function () {
            Route::get('/', [App\Http\Controllers\DesignationController::class, 'index']);
            Route::post('/', [App\Http\Controllers\DesignationController::class, 'store']);
            Route::get('/{id}', [App\Http\Controllers\DesignationController::class, 'show']);
            Route::put('/{id}', [App\Http\Controllers\DesignationController::class, 'update']);
            Route::delete('/{id}', [App\Http\Controllers\DesignationController::class, 'destroy']);
            Route::get('/{id}/employees', [App\Http\Controllers\DesignationController::class, 'employees']);
        });
    });

    // RBAC & Approval System Routes
    Route::prefix('rbac')->middleware('auth:sanctum')->group(function () {
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
    Route::prefix('workflows')->middleware('auth:sanctum')->group(function () {
        Route::get('/', [App\Http\Controllers\WorkflowController::class, 'index']);
        Route::post('/', [App\Http\Controllers\WorkflowController::class, 'store']);
        Route::get('/{id}', [App\Http\Controllers\WorkflowController::class, 'show']);
        Route::put('/{id}', [App\Http\Controllers\WorkflowController::class, 'update']);
        Route::delete('/{id}', [App\Http\Controllers\WorkflowController::class, 'destroy']);
        Route::put('/{id}/steps', [App\Http\Controllers\WorkflowController::class, 'updateSteps']);
        Route::patch('/{id}/toggle-active', [App\Http\Controllers\WorkflowController::class, 'toggleActive']);
    });

    // Approvals
    Route::prefix('approvals')->middleware('auth:sanctum')->group(function () {
        Route::get('/pending', [App\Http\Controllers\ApprovalController::class, 'pending']);
        Route::get('/history', [App\Http\Controllers\ApprovalController::class, 'history']);
        Route::get('/statistics', [App\Http\Controllers\ApprovalController::class, 'statistics']);
        Route::get('/', [App\Http\Controllers\ApprovalController::class, 'index']);
        Route::get('/{id}', [App\Http\Controllers\ApprovalController::class, 'show']);
        Route::post('/{id}/approve', [App\Http\Controllers\ApprovalController::class, 'approve']);
        Route::post('/{id}/reject', [App\Http\Controllers\ApprovalController::class, 'reject']);
        Route::post('/{id}/cancel', [App\Http\Controllers\ApprovalController::class, 'cancel']);
    });

    // Payroll Module Routes
    Route::prefix('payroll')->middleware('auth:sanctum')->group(function () {
        // Payroll Periods
        Route::get('/periods', [App\Http\Controllers\PayrollPeriodController::class, 'index']);
        Route::get('/periods/{id}', [App\Http\Controllers\PayrollPeriodController::class, 'show']);

        // Payroll Runs
        Route::get('/runs', [App\Http\Controllers\PayrollRunController::class, 'index']);
        Route::post('/runs', [App\Http\Controllers\PayrollRunController::class, 'store']);
        Route::get('/runs/{id}', [App\Http\Controllers\PayrollRunController::class, 'show']);
        Route::get('/runs/{id}/employees', [App\Http\Controllers\PayrollRunController::class, 'employees']);
        Route::get('/runs/{runId}/employees/{employeeId}/breakdown', [App\Http\Controllers\PayrollRunController::class, 'employeeBreakdown']);
        Route::post('/runs/{id}/recalculate', [App\Http\Controllers\PayrollRunController::class, 'recalculate']);
        Route::post('/runs/{id}/submit', [App\Http\Controllers\PayrollRunController::class, 'submit']);

        // Payroll Items
        Route::get('/items', [App\Http\Controllers\PayrollItemController::class, 'index']);
        Route::post('/items', [App\Http\Controllers\PayrollItemController::class, 'store']);
        Route::patch('/items/{id}', [App\Http\Controllers\PayrollItemController::class, 'update']);

        // Salary Structures
        Route::get('/structures', [App\Http\Controllers\SalaryStructureController::class, 'index']);
        Route::post('/structures', [App\Http\Controllers\SalaryStructureController::class, 'store']);
        Route::get('/structures/{id}', [App\Http\Controllers\SalaryStructureController::class, 'show']);
        Route::patch('/structures/{id}', [App\Http\Controllers\SalaryStructureController::class, 'update']);
        Route::delete('/structures/{id}', [App\Http\Controllers\SalaryStructureController::class, 'destroy']);

        // Employee Salaries
        Route::get('/salaries', [App\Http\Controllers\EmployeeSalaryController::class, 'index']);
        Route::post('/salaries', [App\Http\Controllers\EmployeeSalaryController::class, 'store']);
        Route::get('/salaries/{id}', [App\Http\Controllers\EmployeeSalaryController::class, 'show']);
        Route::patch('/salaries/{id}', [App\Http\Controllers\EmployeeSalaryController::class, 'update']);
        Route::delete('/salaries/{id}', [App\Http\Controllers\EmployeeSalaryController::class, 'destroy']);

        // Organization Settings
        Route::get('/settings', [App\Http\Controllers\OrganizationSettingController::class, 'index']);
        Route::get('/settings/{key}', [App\Http\Controllers\OrganizationSettingController::class, 'show']);
        Route::post('/settings', [App\Http\Controllers\OrganizationSettingController::class, 'update']);
    });

    // Payroll Approval Routes
    Route::prefix('payroll/approvals')->middleware('auth:sanctum')->group(function () {
        Route::get('/inbox', [App\Http\Controllers\PayrollApprovalController::class, 'inbox']);
        Route::get('/{id}', [App\Http\Controllers\PayrollApprovalController::class, 'show']);
        Route::post('/{id}/approve', [App\Http\Controllers\PayrollApprovalController::class, 'approve']);
        Route::post('/{id}/reject', [App\Http\Controllers\PayrollApprovalController::class, 'reject']);
    });

    // Leave Management Routes
    Route::prefix('leave')->middleware('auth:sanctum')->group(function () {
        // Dashboard & Statistics
        Route::get('/dashboard', [App\Http\Controllers\LeaveController::class, 'dashboard']);
        
        // Leave Types
        Route::get('/types', [App\Http\Controllers\LeaveController::class, 'types']);
        
        // Leave Balances
        Route::get('/balances', [App\Http\Controllers\LeaveController::class, 'balances']);
        
        // Leave Requests
        Route::get('/requests', [App\Http\Controllers\LeaveController::class, 'index']);
        Route::post('/requests', [App\Http\Controllers\LeaveController::class, 'store']);
        Route::get('/requests/{leaveRequest}', [App\Http\Controllers\LeaveController::class, 'show']);
        Route::post('/requests/{leaveRequest}/approve', [App\Http\Controllers\LeaveController::class, 'approve']);
        Route::post('/requests/{leaveRequest}/reject', [App\Http\Controllers\LeaveController::class, 'reject']);
        Route::post('/requests/{leaveRequest}/cancel', [App\Http\Controllers\LeaveController::class, 'cancel']);
    });

    // Performance Management Routes
    Route::prefix('performance')->middleware('auth:sanctum')->group(function () {
        // Dashboard & Analytics
        Route::get('/dashboard', [App\Http\Controllers\PerformanceController::class, 'dashboard']);
        Route::get('/team-performance', [App\Http\Controllers\PerformanceController::class, 'teamPerformance']);
        Route::get('/insights', [App\Http\Controllers\PerformanceController::class, 'insights']);
        Route::get('/employees/{employeeId}/stats', [App\Http\Controllers\PerformanceController::class, 'employeeStats']);

        // Evaluation Templates
        Route::get('/templates', [App\Http\Controllers\EvaluationTemplateController::class, 'index']);
        Route::post('/templates', [App\Http\Controllers\EvaluationTemplateController::class, 'store']);
        Route::get('/templates/{id}', [App\Http\Controllers\EvaluationTemplateController::class, 'show']);
        Route::patch('/templates/{id}', [App\Http\Controllers\EvaluationTemplateController::class, 'update']);
        Route::delete('/templates/{id}', [App\Http\Controllers\EvaluationTemplateController::class, 'destroy']);

        // Evaluation Responses
        Route::get('/evaluations', [App\Http\Controllers\EvaluationResponseController::class, 'index']);
        Route::get('/evaluations/pending', [App\Http\Controllers\EvaluationResponseController::class, 'pending']);
        Route::get('/evaluations/pending-review', [App\Http\Controllers\EvaluationResponseController::class, 'pendingReview']);
        Route::post('/evaluations', [App\Http\Controllers\EvaluationResponseController::class, 'store']);
        Route::get('/evaluations/{id}', [App\Http\Controllers\EvaluationResponseController::class, 'show']);
        Route::patch('/evaluations/{id}', [App\Http\Controllers\EvaluationResponseController::class, 'update']);
        Route::post('/evaluations/{id}/submit', [App\Http\Controllers\EvaluationResponseController::class, 'submit']);
        Route::post('/evaluations/{id}/approve', [App\Http\Controllers\EvaluationResponseController::class, 'approve']);
        Route::post('/evaluations/{id}/reject', [App\Http\Controllers\EvaluationResponseController::class, 'reject']);

        // Review Cycles
        Route::get('/cycles', [App\Http\Controllers\ReviewCycleController::class, 'index']);
        Route::post('/cycles', [App\Http\Controllers\ReviewCycleController::class, 'store']);
        Route::get('/cycles/{id}', [App\Http\Controllers\ReviewCycleController::class, 'show']);
        Route::patch('/cycles/{id}', [App\Http\Controllers\ReviewCycleController::class, 'update']);
        Route::post('/cycles/{id}/launch', [App\Http\Controllers\ReviewCycleController::class, 'launch']);
        Route::post('/cycles/{id}/participants', [App\Http\Controllers\ReviewCycleController::class, 'addParticipants']);

        // Goals & OKRs
        Route::get('/goals', [App\Http\Controllers\GoalController::class, 'index']);
        Route::post('/goals', [App\Http\Controllers\GoalController::class, 'store']);
        Route::get('/goals/{id}', [App\Http\Controllers\GoalController::class, 'show']);
        Route::patch('/goals/{id}', [App\Http\Controllers\GoalController::class, 'update']);
        Route::post('/goals/{goalId}/key-results/{krId}/update', [App\Http\Controllers\GoalController::class, 'updateKeyResult']);
    });

    // Memo System Routes
    Route::prefix('memos')->middleware('auth:sanctum')->group(function () {
        // Main CRUD
        Route::get('/', [App\Http\Controllers\MemoController::class, 'index']);
        Route::post('/', [App\Http\Controllers\MemoController::class, 'store']);
        Route::get('/{id}', [App\Http\Controllers\MemoController::class, 'show']);
        Route::put('/{id}', [App\Http\Controllers\MemoController::class, 'update']);
        Route::delete('/{id}', [App\Http\Controllers\MemoController::class, 'destroy']);
        
        // Actions
        Route::post('/{id}/reply', [App\Http\Controllers\MemoController::class, 'reply']);
        Route::post('/{id}/forward', [App\Http\Controllers\MemoController::class, 'forward']);
        Route::post('/{id}/star', [App\Http\Controllers\MemoController::class, 'toggleStar']);
        Route::post('/{id}/read', [App\Http\Controllers\MemoController::class, 'markAsRead']);
        Route::post('/{id}/move', [App\Http\Controllers\MemoController::class, 'moveToFolder']);
        
        // Bulk operations
        Route::post('/bulk-send', [App\Http\Controllers\MemoController::class, 'bulkSend']);
        Route::post('/bulk-delete', [App\Http\Controllers\MemoController::class, 'bulkDelete']);
        Route::post('/bulk-read', [App\Http\Controllers\MemoController::class, 'bulkMarkAsRead']);
        
        // Search & Stats
        Route::get('/search', [App\Http\Controllers\MemoController::class, 'search']);
        Route::get('/stats', [App\Http\Controllers\MemoController::class, 'stats']);
        
        // Attachments
        Route::post('/{id}/attachments', [App\Http\Controllers\MemoAttachmentController::class, 'upload']);
        Route::get('/{id}/attachments', [App\Http\Controllers\MemoAttachmentController::class, 'index']);
        Route::get('/attachments/{attachmentId}/download', [App\Http\Controllers\MemoAttachmentController::class, 'download']);
        Route::delete('/attachments/{attachmentId}', [App\Http\Controllers\MemoAttachmentController::class, 'destroy']);
    });

    // Memo Signatures
    Route::prefix('memo-signatures')->middleware('auth:sanctum')->group(function () {
        Route::get('/', [App\Http\Controllers\MemoSignatureController::class, 'index']);
        Route::post('/', [App\Http\Controllers\MemoSignatureController::class, 'store']);
        Route::put('/{id}', [App\Http\Controllers\MemoSignatureController::class, 'update']);
        Route::delete('/{id}', [App\Http\Controllers\MemoSignatureController::class, 'destroy']);
        Route::post('/{id}/set-default', [App\Http\Controllers\MemoSignatureController::class, 'setDefault']);
    });

    // Memo Folders
    Route::prefix('memo-folders')->middleware('auth:sanctum')->group(function () {
        Route::get('/', [App\Http\Controllers\MemoFolderController::class, 'index']);
        Route::post('/', [App\Http\Controllers\MemoFolderController::class, 'store']);
        Route::put('/{id}', [App\Http\Controllers\MemoFolderController::class, 'update']);
        Route::delete('/{id}', [App\Http\Controllers\MemoFolderController::class, 'destroy']);
    });
});
