<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Traits\ApiResponse;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class DepartmentController extends Controller
{
    use ApiResponse;

    protected $auditLogger;

    public function __construct(AuditLogger $auditLogger)
    {
        $this->auditLogger = $auditLogger;
    }

    /**
     * Display a listing of departments
     */
    public function index(Request $request)
    {
        $query = Department::with('branch');

        // Filter by branch
        if ($request->has('branch_id') && $request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        if ($request->has('per_page') && $request->per_page === 'all') {
            $departments = $query->get();
            return $this->success($departments);
        }

        $perPage = $request->get('per_page', 15);
        $departments = $query->paginate($perPage);

        return $this->success([
            'data' => $departments->items(),
            'meta' => [
                'current_page' => $departments->currentPage(),
                'last_page' => $departments->lastPage(),
                'per_page' => $departments->perPage(),
                'total' => $departments->total(),
            ]
        ]);
    }

    /**
     * Store a newly created department
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:departments,code',
            'branch_id' => 'required|exists:branches,id',
        ]);

        try {
            DB::beginTransaction();

            $department = Department::create($validated);

            $this->auditLogger->log(
                'department_created',
                'Department',
                $department->id,
                null,
                $department->toArray(),
                "Created department: {$department->name}"
            );

            DB::commit();

            return $this->success(
                $department->load('branch'),
                'Department created successfully',
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to create department: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Display the specified department
     */
    public function show($id)
    {
        $department = Department::with(['branch', 'employees'])->findOrFail($id);
        return $this->success($department);
    }

    /**
     * Update the specified department
     */
    public function update(Request $request, $id)
    {
        $department = Department::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('departments', 'code')->ignore($id)
            ],
            'branch_id' => 'sometimes|required|exists:branches,id',
        ]);

        try {
            DB::beginTransaction();

            $oldData = $department->toArray();
            $department->update($validated);

            $this->auditLogger->log(
                'department_updated',
                'Department',
                $department->id,
                $oldData,
                $department->toArray(),
                "Updated department: {$department->name}"
            );

            DB::commit();

            return $this->success(
                $department->load('branch'),
                'Department updated successfully'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to update department: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Remove the specified department
     */
    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $department = Department::findOrFail($id);

            // Check if department has employees
            if ($department->employees()->count() > 0) {
                return $this->error(
                    'Cannot delete department with active employees. Please reassign employees first.',
                    422
                );
            }

            $departmentData = $department->toArray();
            $department->delete();

            $this->auditLogger->log(
                'department_deleted',
                'Department',
                $department->id,
                $departmentData,
                null,
                "Deleted department: {$department->name}"
            );

            DB::commit();

            return $this->success(null, 'Department deleted successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to delete department: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get employees for a specific department
     */
    public function employees($id)
    {
        $department = Department::findOrFail($id);
        
        $employees = $department->employees()
            ->with(['designation', 'manager'])
            ->get();

        return $this->success([
            'department' => $department,
            'employees' => $employees,
            'total' => $employees->count()
        ]);
    }
}
