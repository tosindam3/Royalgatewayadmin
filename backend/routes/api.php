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

    // Broadcasting Auth
    Illuminate\Support\Facades\Broadcast::routes(['middleware' => ['auth:sanctum']]);

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
        // Submissions
        Route::get('/submissions', [App\Http\Controllers\PerformanceController::class, 'index']);
        Route::post('/submissions', [App\Http\Controllers\PerformanceController::class, 'store']);

        // Drafts
        Route::get('/drafts/my-draft', [App\Http\Controllers\PerformanceController::class, 'getDraft']);
        Route::post('/drafts/save', [App\Http\Controllers\PerformanceController::class, 'saveDraft']);

        // Analytics & Leaderboard
        Route::get('/analytics/personal', [App\Http\Controllers\PerformanceController::class, 'personalAnalytics']);
        Route::get('/analytics/branch', [App\Http\Controllers\PerformanceController::class, 'branchAnalytics']);
        Route::get('/leaderboard', [App\Http\Controllers\PerformanceController::class, 'leaderboard']);
        Route::get('/department-summaries', [App\Http\Controllers\PerformanceController::class, 'departmentSummaries']);
        Route::get('/analytics', [App\Http\Controllers\PerformanceController::class, 'analytics']);

        // Template resolution for employees (must be before /{id} routes)
        Route::get('/configs/for-employee', [App\Http\Controllers\PerformanceController::class, 'getConfigForEmployee']);
        Route::get('/configs/department/{departmentId}', [App\Http\Controllers\PerformanceController::class, 'getConfigByDepartment']);

        // Config CRUD
        Route::get('/configs', [App\Http\Controllers\PerformanceController::class, 'getConfigs']);
        Route::post('/configs', [App\Http\Controllers\PerformanceController::class, 'createConfig']);
        Route::get('/configs/{id}', [App\Http\Controllers\PerformanceController::class, 'getConfig']);
        Route::put('/configs/{id}', [App\Http\Controllers\PerformanceController::class, 'updateConfig']);
        Route::delete('/configs/{id}', [App\Http\Controllers\PerformanceController::class, 'deleteConfig']);

        // Template lifecycle actions
        Route::post('/configs/{id}/publish', [App\Http\Controllers\PerformanceController::class, 'publishConfig']);
        Route::post('/configs/{id}/revert', [App\Http\Controllers\PerformanceController::class, 'revertConfig']);
        Route::post('/configs/{id}/archive', [App\Http\Controllers\PerformanceController::class, 'archiveConfig']);
        Route::post('/configs/{id}/clone', [App\Http\Controllers\PerformanceController::class, 'cloneConfig']);
    });

    // Memo System Routes
    Route::prefix('memos')->middleware('auth:sanctum')->group(function () {
        // Search & Stats (must be before /{id})
        Route::get('/search', [App\Http\Controllers\MemoController::class, 'search']);
        Route::get('/stats', [App\Http\Controllers\MemoController::class, 'stats']);
        
        // Bulk operations (must be before /{id})
        Route::post('/bulk-send', [App\Http\Controllers\MemoController::class, 'bulkSend']);
        Route::post('/bulk-delete', [App\Http\Controllers\MemoController::class, 'bulkDelete']);
        Route::post('/bulk-read', [App\Http\Controllers\MemoController::class, 'bulkMarkAsRead']);
        
        // Main CRUD
        Route::get('/', [App\Http\Controllers\MemoController::class, 'index']);
        Route::post('/', [App\Http\Controllers\MemoController::class, 'store']);
        Route::get('/{id}', [App\Http\Controllers\MemoController::class, 'show']);
        Route::put('/{id}', [App\Http\Controllers\MemoController::class, 'update']);
        Route::delete('/{id}', [App\Http\Controllers\MemoController::class, 'destroy']);
        
        // Actions on specific memos
        Route::post('/{id}/reply', [App\Http\Controllers\MemoController::class, 'reply']);
        Route::post('/{id}/forward', [App\Http\Controllers\MemoController::class, 'forward']);
        Route::post('/{id}/star', [App\Http\Controllers\MemoController::class, 'toggleStar']);
        Route::post('/{id}/read', [App\Http\Controllers\MemoController::class, 'markAsRead']);
        Route::post('/{id}/move', [App\Http\Controllers\MemoController::class, 'moveToFolder']);
        
        // Attachments (specific routes before parameterized ones)
        Route::get('/attachments/{attachmentId}/download', [App\Http\Controllers\MemoAttachmentController::class, 'download']);
        Route::delete('/attachments/{attachmentId}', [App\Http\Controllers\MemoAttachmentController::class, 'destroy']);
        Route::post('/{id}/attachments', [App\Http\Controllers\MemoAttachmentController::class, 'upload']);
        Route::get('/{id}/attachments', [App\Http\Controllers\MemoAttachmentController::class, 'index']);
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

    // Brand Settings Routes
    Route::prefix('brand-settings')->middleware('auth:sanctum')->group(function () {
        Route::get('/', [App\Http\Controllers\BrandSettingsController::class, 'index']);
        Route::put('/', [App\Http\Controllers\BrandSettingsController::class, 'update']);
        Route::post('/reset', [App\Http\Controllers\BrandSettingsController::class, 'reset']);
        Route::get('/history', [App\Http\Controllers\BrandSettingsController::class, 'history']);
    });

    // Team Chat Routes
    Route::prefix('chat')->middleware('auth:sanctum')->group(function () {
        // Channels
        Route::get('/channels', [App\Http\Controllers\ChatChannelController::class, 'index']);
        Route::post('/channels', [App\Http\Controllers\ChatChannelController::class, 'store']);
        Route::get('/channels/{channel}', [App\Http\Controllers\ChatChannelController::class, 'show']);
        Route::put('/channels/{channel}', [App\Http\Controllers\ChatChannelController::class, 'update']);
        Route::delete('/channels/{channel}', [App\Http\Controllers\ChatChannelController::class, 'destroy']);
        Route::post('/channels/{channel}/archive', [App\Http\Controllers\ChatChannelController::class, 'toggleArchive']);
        Route::post('/channels/{channel}/pin', [App\Http\Controllers\ChatChannelController::class, 'togglePin']);
        Route::post('/channels/{channel}/mute', [App\Http\Controllers\ChatChannelController::class, 'toggleMute']);
        Route::post('/channels/{channel}/read', [App\Http\Controllers\ChatChannelController::class, 'markAsRead']);
        Route::get('/channels/{channel}/stats', [App\Http\Controllers\ChatChannelController::class, 'stats']);
        
        // Channel Members
        Route::post('/channels/{channel}/members', [App\Http\Controllers\ChatChannelController::class, 'addMembers']);
        Route::delete('/channels/{channel}/members/{userId}', [App\Http\Controllers\ChatChannelController::class, 'removeMember']);
        Route::put('/channels/{channel}/members/{userId}/role', [App\Http\Controllers\ChatChannelController::class, 'updateMemberRole']);
        
        // Messages
        Route::get('/channels/{channel}/messages', [App\Http\Controllers\ChatMessageController::class, 'index']);
        Route::post('/channels/{channel}/messages', [App\Http\Controllers\ChatMessageController::class, 'store']);
        Route::get('/channels/{channel}/messages/{message}', [App\Http\Controllers\ChatMessageController::class, 'show']);
        Route::put('/channels/{channel}/messages/{message}', [App\Http\Controllers\ChatMessageController::class, 'update']);
        Route::delete('/channels/{channel}/messages/{message}', [App\Http\Controllers\ChatMessageController::class, 'destroy']);
        
        // Message Reactions
        Route::post('/channels/{channel}/messages/{message}/reactions', [App\Http\Controllers\ChatMessageController::class, 'addReaction']);
        Route::delete('/channels/{channel}/messages/{message}/reactions/{emoji}', [App\Http\Controllers\ChatMessageController::class, 'removeReaction']);
        
        // Typing Indicators
        Route::post('/channels/{channel}/typing', [App\Http\Controllers\ChatMessageController::class, 'setTyping']);
        Route::get('/channels/{channel}/typing', [App\Http\Controllers\ChatMessageController::class, 'getTypingUsers']);
        
        // Admin Routes
        Route::prefix('admin')->group(function () {
            Route::get('/analytics', [App\Http\Controllers\ChatAdminController::class, 'analytics']);
            Route::get('/message-activity', [App\Http\Controllers\ChatAdminController::class, 'messageActivity']);
            Route::get('/top-channels', [App\Http\Controllers\ChatAdminController::class, 'topChannels']);
            Route::get('/top-users', [App\Http\Controllers\ChatAdminController::class, 'topUsers']);
            Route::get('/compliance-settings', [App\Http\Controllers\ChatAdminController::class, 'getComplianceSettings']);
            
            // Blocked Keywords
            Route::get('/blocked-keywords', [App\Http\Controllers\ChatAdminController::class, 'getBlockedKeywords']);
            Route::post('/blocked-keywords', [App\Http\Controllers\ChatAdminController::class, 'addBlockedKeyword']);
            Route::put('/blocked-keywords/{keyword}', [App\Http\Controllers\ChatAdminController::class, 'updateBlockedKeyword']);
            Route::delete('/blocked-keywords/{keyword}', [App\Http\Controllers\ChatAdminController::class, 'deleteBlockedKeyword']);
        });
    });
});
