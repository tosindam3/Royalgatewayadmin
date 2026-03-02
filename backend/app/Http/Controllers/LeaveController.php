<?php

namespace App\Http\Controllers;

use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\LeaveBalance;
use App\Models\Employee;
use App\Services\LeaveService;
use App\Services\ScopeEngine;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LeaveController extends Controller
{
    use ApiResponse;

    protected LeaveService $leaveService;
    protected ScopeEngine $scopeEngine;

    public function __construct(LeaveService $leaveService, ScopeEngine $scopeEngine)
    {
        $this->leaveService = $leaveService;
        $this->scopeEngine = $scopeEngine;
    }

    /**
     * Get leave dashboard statistics
     */
    public function dashboard(Request $request)
    {
        $user = $request->user();
        
        // Check permission
        if (!$user->hasPermission('leave.view')) {
            return $this->error('Unauthorized', 403);
        }
        
        $stats = $this->leaveService->getDashboardStats();
        
        return $this->success($stats, 'Dashboard statistics retrieved.');
    }

    /**
     * List leave requests with RBAC scoping
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        if (!$user->hasPermission('leave.view')) {
            return $this->error('Unauthorized', 403);
        }
        
        $scope = $user->getPermissionScope('leave.view');
        
        $query = LeaveRequest::with(['employee.branch', 'employee.department', 'leaveType', 'approver'])
            ->orderByDesc('created_at');
        
        // Apply RBAC scoping based on employee relationship
        if ($scope !== 'all') {
            $query->whereHas('employee', function ($q) use ($scope, $user) {
                $this->scopeEngine->applyScopeLevel($q, $user, $scope);
            });
        }
        
        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        
        if ($request->filled('leave_type_id')) {
            $query->where('leave_type_id', $request->leave_type_id);
        }
        
        if ($request->filled('start_date')) {
            $query->whereDate('start_date', '>=', $request->start_date);
        }
        
        if ($request->filled('end_date')) {
            $query->whereDate('end_date', '<=', $request->end_date);
        }
        
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('employee', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('employee_code', 'like', "%{$search}%");
            });
        }
        
        $perPage = $request->input('per_page', 15);
        $requests = $query->paginate($perPage);
        
        return $this->success($requests, 'Leave requests retrieved.');
    }

    /**
     * Get single leave request
     */
    public function show(Request $request, LeaveRequest $leaveRequest)
    {
        $user = $request->user();
        
        if (!$user->hasPermission('leave.view')) {
            return $this->error('Unauthorized', 403);
        }
        
        // Check scope access
        $scope = $user->getPermissionScope('leave.view');
        if ($scope !== 'all' && !$this->canAccessEmployee($leaveRequest->employee_id, $scope, $user)) {
            return $this->error('Unauthorized to view this leave request', 403);
        }
        
        $leaveRequest->load(['employee', 'leaveType', 'approver', 'canceller']);
        
        return $this->success($leaveRequest, 'Leave request retrieved.');
    }

    /**
     * Create leave request
     */
    public function store(Request $request)
    {
        $user = $request->user();
        
        if (!$user->hasPermission('leave.apply')) {
            return $this->error('Unauthorized', 403);
        }
        
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string|max:1000',
            'contact_during_leave' => 'nullable|string|max:255',
            'document_path' => 'nullable|string|max:500',
        ]);
        
        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }
        
        // Check if user can apply for this employee
        $scope = $user->getPermissionScope('leave.apply');
        if ($scope !== 'all' && !$this->canAccessEmployee($request->employee_id, $scope, $user)) {
            return $this->error('Unauthorized to apply leave for this employee', 403);
        }
        
        try {
            $leaveRequest = $this->leaveService->createLeaveRequest($request->all());
            return $this->success($leaveRequest, 'Leave request created successfully.', 201);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * Approve leave request
     */
    public function approve(Request $request, LeaveRequest $leaveRequest)
    {
        $user = $request->user();
        
        if (!$user->hasPermission('leave.approve')) {
            return $this->error('Unauthorized', 403);
        }
        
        // Check scope access
        $scope = $user->getPermissionScope('leave.approve');
        if ($scope !== 'all' && !$this->canAccessEmployee($leaveRequest->employee_id, $scope, $user)) {
            return $this->error('Unauthorized to approve this leave request', 403);
        }
        
        if ($leaveRequest->status !== 'pending') {
            return $this->error('Only pending requests can be approved', 400);
        }
        
        $validator = Validator::make($request->all(), [
            'notes' => 'nullable|string|max:500',
        ]);
        
        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }
        
        try {
            $leaveRequest = $this->leaveService->approveLeaveRequest(
                $leaveRequest,
                $user->id,
                $request->notes
            );
            
            return $this->success($leaveRequest, 'Leave request approved successfully.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * Reject leave request
     */
    public function reject(Request $request, LeaveRequest $leaveRequest)
    {
        $user = $request->user();
        
        if (!$user->hasPermission('leave.reject')) {
            return $this->error('Unauthorized', 403);
        }
        
        // Check scope access
        $scope = $user->getPermissionScope('leave.reject');
        if ($scope !== 'all' && !$this->canAccessEmployee($leaveRequest->employee_id, $scope, $user)) {
            return $this->error('Unauthorized to reject this leave request', 403);
        }
        
        if ($leaveRequest->status !== 'pending') {
            return $this->error('Only pending requests can be rejected', 400);
        }
        
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:500',
        ]);
        
        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }
        
        try {
            $leaveRequest = $this->leaveService->rejectLeaveRequest(
                $leaveRequest,
                $user->id,
                $request->reason
            );
            
            return $this->success($leaveRequest, 'Leave request rejected.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * Cancel leave request
     */
    public function cancel(Request $request, LeaveRequest $leaveRequest)
    {
        $user = $request->user();
        
        if (!$user->hasPermission('leave.cancel')) {
            return $this->error('Unauthorized', 403);
        }
        
        if (!$leaveRequest->isCancellable()) {
            return $this->error('This leave request cannot be cancelled', 400);
        }
        
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:500',
        ]);
        
        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }
        
        try {
            $leaveRequest = $this->leaveService->cancelLeaveRequest(
                $leaveRequest,
                $user->id,
                $request->reason
            );
            
            return $this->success($leaveRequest, 'Leave request cancelled.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * Get leave balances
     */
    public function balances(Request $request)
    {
        $user = $request->user();
        
        if (!$user->hasPermission('leave.view')) {
            return $this->error('Unauthorized', 403);
        }
        
        $scope = $user->getPermissionScope('leave.view');
        $year = $request->input('year', now()->year);
        
        $query = LeaveBalance::with(['employee', 'leaveType'])
            ->where('year', $year);
        
        // Apply RBAC scoping based on employee relationship
        if ($scope !== 'all') {
            $query->whereHas('employee', function ($q) use ($scope, $user) {
                $this->scopeEngine->applyScopeLevel($q, $user, $scope);
            });
        }
        
        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }
        
        $balances = $query->get();
        
        return $this->success($balances, 'Leave balances retrieved.');
    }

    /**
     * Get leave types
     */
    public function types(Request $request)
    {
        $types = LeaveType::active()->get();
        return $this->success($types, 'Leave types retrieved.');
    }

    /**
     * Helper method to check if user can access employee
     */
    protected function canAccessEmployee(int $employeeId, string $scope, User $user): bool
    {
        if ($scope === 'all') {
            return true;
        }

        $employee = Employee::find($employeeId);
        if (!$employee || !$user->employeeProfile) {
            return false;
        }

        switch ($scope) {
            case 'branch':
                return $employee->branch_id === $user->employeeProfile->branch_id;
            case 'department':
                return $employee->department_id === $user->employeeProfile->department_id;
            case 'team':
                return $employee->manager_id === $user->employeeProfile->id;
            case 'self':
                return $employee->id === $user->employeeProfile->id;
            default:
                return false;
        }
    }
}
