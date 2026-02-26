<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Services\EmployeeService;
use App\Http\Requests\UpdateEmployeeRequest;
use Illuminate\Http\Request;
use App\Traits\ApiResponse;

class EmployeeController extends Controller
{
    use ApiResponse;

    protected $employeeService;

    public function __construct(EmployeeService $employeeService)
    {
        $this->employeeService = $employeeService;
    }

    public function index(Request $request)
    {
        $query = Employee::with(['branch', 'department', 'designation', 'manager']);

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "{$search}%") // Optimized to use index prefix if possible
                    ->orWhere('last_name', 'like', "{$search}%")
                    ->orWhere('email', 'like', "{$search}%")
                    ->orWhere('employee_code', $search); // Exact match for code is faster
            });
        }

        // Status filter
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Department filter
        if ($request->has('department_id') && $request->department_id) {
            $query->where('department_id', $request->department_id);
        }

        // Branch filter
        if ($request->has('branch_id') && $request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        // Employment type filter
        if ($request->has('employment_type') && $request->employment_type) {
            $query->where('employment_type', $request->employment_type);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $perPage = $request->get('per_page', 10);
        $employees = $query->paginate($perPage);

        return $this->success([
            'data' => $employees->items(),
            'meta' => [
                'current_page' => $employees->currentPage(),
                'last_page' => $employees->lastPage(),
                'per_page' => $employees->perPage(),
                'total' => $employees->total(),
                'from' => $employees->firstItem(),
                'to' => $employees->lastItem(),
            ]
        ]);
    }

    public function store(Request $request)
    {
        // Manual validation
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:employees,email',
            'phone' => 'required|string|max:20',
            'branch_id' => 'required|exists:branches,id',
            'department_id' => 'required|exists:departments,id',
            'designation_id' => 'required|exists:designations,id',
            'manager_id' => 'nullable|exists:employees,id',
            'employment_type' => 'required|in:full-time,part-time,contract',
            'work_mode' => 'required|in:onsite,remote,hybrid',
            'status' => 'required|in:active,probation,suspended,terminated',
            'hire_date' => 'required|date',
            'dob' => 'required|date|before:today',
            'blood_group' => 'nullable|string|max:10',
            'genotype' => 'nullable|string|max:10',
            'academics' => 'nullable|string',
            'create_user_account' => 'boolean',
            'password' => 'required_if:create_user_account,true|nullable|string|min:8',
            'password_confirmation' => 'required_if:create_user_account,true|nullable|same:password',
            'role_ids' => 'nullable|array',
            'role_ids.*' => 'exists:roles,id',
            'primary_role_id' => 'nullable|exists:roles,id',
        ]);

        try {
            $employee = $this->employeeService->createEmployee($validated);
            return $this->success($employee, 'Employee created successfully', 201);
        } catch (\Exception $e) {
            return $this->error('Failed to create employee: ' . $e->getMessage(), 500);
        }
    }

    public function show($id)
    {
        $employee = Employee::with(['branch', 'department', 'designation', 'manager', 'subordinates'])
            ->findOrFail($id);

        return $this->success($employee);
    }

    public function update(UpdateEmployeeRequest $request, $id)
    {
        try {
            $employee = Employee::findOrFail($id);
            $employee = $this->employeeService->updateEmployee($employee, $request->validated());
            return $this->success($employee, 'Employee updated successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to update employee: ' . $e->getMessage(), 500);
        }
    }

    public function destroy($id)
    {
        try {
            $employee = Employee::findOrFail($id);
            $this->employeeService->deleteEmployee($employee);
            return $this->success(null, 'Employee deleted successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to delete employee: ' . $e->getMessage(), 500);
        }
    }

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:active,probation,suspended,terminated',
        ]);

        try {
            $employee = Employee::findOrFail($id);
            $employee = $this->employeeService->updateEmployee($employee, $validated);
            return $this->success($employee, 'Employee status updated successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to update status: ' . $e->getMessage(), 500);
        }
    }

    public function metrics()
    {
        try {
            $metrics = $this->employeeService->getMetrics();
            return $this->success($metrics);
        } catch (\Exception $e) {
            return $this->error('Failed to fetch metrics: ' . $e->getMessage(), 500);
        }
    }
}
