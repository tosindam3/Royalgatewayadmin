<?php

namespace App\Http\Controllers;

use App\Models\Designation;
use App\Traits\ApiResponse;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class DesignationController extends Controller
{
    use ApiResponse;

    protected $auditLogger;
    protected $scopeEngine;

    public function __construct(AuditLogger $auditLogger, \App\Services\ScopeEngine $scopeEngine)
    {
        $this->auditLogger = $auditLogger;
        $this->scopeEngine = $scopeEngine;
    }

    /**
     * Display a listing of designations
     */
    public function index(Request $request)
    {
        if (!$this->scopeEngine->hasPermission($request->user(), 'organization.view')) {
            return $this->error('Unauthorized', 403);
        }

        $query = Designation::query();

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
            $designations = $query->get();
            return $this->success($designations);
        }

        $perPage = $request->get('per_page', 15);
        $designations = $query->paginate($perPage);

        return $this->success([
            'data' => $designations->items(),
            'meta' => [
                'current_page' => $designations->currentPage(),
                'last_page' => $designations->lastPage(),
                'per_page' => $designations->perPage(),
                'total' => $designations->total(),
            ]
        ]);
    }

    /**
     * Store a newly created designation
     */
    public function store(Request $request)
    {
        if (!$this->scopeEngine->hasPermission($request->user(), 'organization.update')) {
            return $this->error('Unauthorized', 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:designations,code',
        ]);

        try {
            DB::beginTransaction();

            $designation = Designation::create($validated);

            $this->auditLogger->log(
                'designation_created',
                'Designation',
                $designation->id,
                null,
                $designation->toArray(),
                "Created designation: {$designation->name}"
            );

            DB::commit();

            return $this->success(
                $designation,
                'Designation created successfully',
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to create designation: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Display the specified designation
     */
    public function show($id)
    {
        if (!$this->scopeEngine->hasPermission(request()->user(), 'organization.view')) {
            return $this->error('Unauthorized', 403);
        }

        $designation = Designation::with('employees')->findOrFail($id);
        return $this->success($designation);
    }

    /**
     * Update the specified designation
     */
    public function update(Request $request, $id)
    {
        if (!$this->scopeEngine->hasPermission($request->user(), 'organization.update')) {
            return $this->error('Unauthorized', 403);
        }

        $designation = Designation::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('designations', 'code')->ignore($id)
            ],
        ]);

        try {
            DB::beginTransaction();

            $oldData = $designation->toArray();
            $designation->update($validated);

            $this->auditLogger->log(
                'designation_updated',
                'Designation',
                $designation->id,
                $oldData,
                $designation->toArray(),
                "Updated designation: {$designation->name}"
            );

            DB::commit();

            return $this->success(
                $designation,
                'Designation updated successfully'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to update designation: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Remove the specified designation
     */
    public function destroy($id)
    {
        if (!$this->scopeEngine->hasPermission(request()->user(), 'organization.delete')) {
            return $this->error('Unauthorized', 403);
        }

        try {
            DB::beginTransaction();

            $designation = Designation::findOrFail($id);

            // Check if designation has employees
            if ($designation->employees()->count() > 0) {
                return $this->error(
                    'Cannot delete designation with active employees. Please reassign employees first.',
                    422
                );
            }

            $designationData = $designation->toArray();
            $designation->delete();

            $this->auditLogger->log(
                'designation_deleted',
                'Designation',
                $designation->id,
                $designationData,
                null,
                "Deleted designation: {$designation->name}"
            );

            DB::commit();

            return $this->success(null, 'Designation deleted successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to delete designation: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get employees for a specific designation
     */
    public function employees($id)
    {
        $designation = Designation::findOrFail($id);
        
        $employees = $designation->employees()
            ->with(['branch', 'department', 'manager'])
            ->get();

        return $this->success([
            'designation' => $designation,
            'employees' => $employees,
            'total' => $employees->count()
        ]);
    }
}
