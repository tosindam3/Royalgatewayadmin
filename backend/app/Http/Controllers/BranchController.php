<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Employee;
use App\Http\Requests\StoreBranchRequest;
use App\Http\Requests\UpdateBranchRequest;
use App\Traits\ApiResponse;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BranchController extends Controller
{
    use ApiResponse;

    protected $auditLogger;

    public function __construct(AuditLogger $auditLogger)
    {
        $this->auditLogger = $auditLogger;
    }

    /**
     * Display a listing of branches
     */
    public function index(Request $request)
    {
        $query = Branch::with(['manager', 'departments']);

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('city', 'like', "%{$search}%")
                  ->orWhere('country', 'like', "%{$search}%");
            });
        }

        // Type filter
        if ($request->has('type') && $request->type && $request->type !== 'All') {
            $query->where('type', $request->type);
        }

        // Status filter
        if ($request->has('status') && $request->status && $request->status !== 'All') {
            $query->where('status', $request->status);
        }

        // HQ filter
        if ($request->has('is_hq')) {
            $query->where('is_hq', $request->boolean('is_hq'));
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        if ($request->has('per_page') && $request->per_page === 'all') {
            $branches = $query->get();
            return $this->success($branches);
        }

        $perPage = $request->get('per_page', 15);
        $branches = $query->paginate($perPage);

        return $this->success([
            'data' => $branches->items(),
            'meta' => [
                'current_page' => $branches->currentPage(),
                'last_page' => $branches->lastPage(),
                'per_page' => $branches->perPage(),
                'total' => $branches->total(),
                'from' => $branches->firstItem(),
                'to' => $branches->lastItem(),
            ]
        ]);
    }

    /**
     * Store a newly created branch
     */
    public function store(StoreBranchRequest $request)
    {
        try {
            DB::beginTransaction();

            // Validate HQ constraint: Only one branch can be HQ
            if ($request->is_hq) {
                $existingHQ = Branch::where('is_hq', true)->exists();
                if ($existingHQ) {
                    return $this->error('Only one branch can be designated as headquarters. Please unset the current HQ first.', 422);
                }
            }

            $branch = Branch::create($request->validated());

            // Update employee count
            $branch->employee_count = 0;
            $branch->device_count = 0;
            $branch->save();

            // Audit log
            $this->auditLogger->log(
                'branch_created',
                'Branch',
                $branch->id,
                null,
                $branch->toArray(),
                "Created branch: {$branch->name}"
            );

            DB::commit();

            return $this->success(
                $branch->load(['manager', 'departments']),
                'Branch created successfully',
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to create branch: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Display the specified branch
     */
    public function show($id)
    {
        $branch = Branch::with([
            'manager', 
            'departments', 
            'employees',
            'geofenceZones',
            'biometricDevices',
            'workSchedules'
        ])->findOrFail($id);

        return $this->success($branch);
    }

    /**
     * Update the specified branch
     */
    public function update(UpdateBranchRequest $request, $id)
    {
        try {
            DB::beginTransaction();

            $branch = Branch::findOrFail($id);
            $oldData = $branch->toArray();

            // Validate HQ constraint: Only one branch can be HQ
            if ($request->has('is_hq') && $request->is_hq) {
                $existingHQ = Branch::where('is_hq', true)
                    ->where('id', '!=', $id)
                    ->exists();
                if ($existingHQ) {
                    return $this->error('Only one branch can be designated as headquarters. Please unset the current HQ first.', 422);
                }
            }

            $branch->update($request->validated());

            // Audit log
            $this->auditLogger->log(
                'branch_updated',
                'Branch',
                $branch->id,
                $oldData,
                $branch->toArray(),
                "Updated branch: {$branch->name}"
            );

            DB::commit();

            return $this->success(
                $branch->load(['manager', 'departments']),
                'Branch updated successfully'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to update branch: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Remove the specified branch (soft delete)
     */
    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $branch = Branch::findOrFail($id);

            // Check if branch has employees
            if ($branch->employees()->count() > 0) {
                return $this->error(
                    'Cannot delete branch with active employees. Please reassign employees first.',
                    422
                );
            }

            // Check if branch has departments
            if ($branch->departments()->count() > 0) {
                return $this->error(
                    'Cannot delete branch with departments. Please delete or reassign departments first.',
                    422
                );
            }

            // Prevent deletion of HQ
            if ($branch->is_hq) {
                return $this->error(
                    'Cannot delete the headquarters branch. Please designate another branch as HQ first.',
                    422
                );
            }

            $branchData = $branch->toArray();
            $branch->delete();

            // Audit log
            $this->auditLogger->log(
                'branch_deleted',
                'Branch',
                $branch->id,
                $branchData,
                null,
                "Deleted branch: {$branch->name}"
            );

            DB::commit();

            return $this->success(null, 'Branch deleted successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to delete branch: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Restore a soft-deleted branch
     */
    public function restore($id)
    {
        try {
            $branch = Branch::withTrashed()->findOrFail($id);

            if (!$branch->trashed()) {
                return $this->error('Branch is not deleted', 422);
            }

            $branch->restore();

            // Audit log
            $this->auditLogger->log(
                'branch_restored',
                'Branch',
                $branch->id,
                null,
                $branch->toArray(),
                "Restored branch: {$branch->name}"
            );

            return $this->success($branch, 'Branch restored successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to restore branch: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get employees for a specific branch
     */
    public function employees($id)
    {
        $branch = Branch::findOrFail($id);
        
        $employees = Employee::where('branch_id', $id)
            ->with(['department', 'designation', 'manager'])
            ->get();

        return $this->success([
            'branch' => $branch,
            'employees' => $employees,
            'total' => $employees->count()
        ]);
    }

    /**
     * Get statistics for a specific branch
     */
    public function statistics($id)
    {
        $branch = Branch::findOrFail($id);
        
        $totalEmployees = $branch->employees()->count();
        $activeEmployees = $branch->employees()->where('status', 'active')->count();
        $probationEmployees = $branch->employees()->where('status', 'probation')->count();
        $totalDepartments = $branch->departments()->count();
        $totalGeofenceZones = $branch->geofenceZones()->count();
        $activeGeofenceZones = $branch->geofenceZones()->where('is_active', true)->count();
        $totalBiometricDevices = $branch->biometricDevices()->count();
        $activeBiometricDevices = $branch->biometricDevices()->where('is_active', true)->count();
        $totalWorkSchedules = $branch->workSchedules()->count();

        $stats = [
            'total_employees' => $totalEmployees,
            'active_employees' => $activeEmployees,
            'probation_employees' => $probationEmployees,
            'total_departments' => $totalDepartments,
            'total_geofence_zones' => $totalGeofenceZones,
            'active_geofence_zones' => $activeGeofenceZones,
            'total_biometric_devices' => $totalBiometricDevices,
            'active_biometric_devices' => $activeBiometricDevices,
            'total_work_schedules' => $totalWorkSchedules,
            'attendance_today' => [
                'present' => 0, // Will be implemented with attendance module
                'late' => 0,
                'absent' => 0,
            ],
        ];

        return $this->success($stats);
    }

    /**
     * Update employee counts for a branch
     */
    public function updateCounts($id)
    {
        try {
            $branch = Branch::findOrFail($id);
            $branch->employee_count = $branch->employees()->count();
            $branch->save();

            return $this->success($branch, 'Branch counts updated successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to update counts: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get geofence zones for a specific branch
     */
    public function geofenceZones($id)
    {
        $branch = Branch::findOrFail($id);
        
        $zones = $branch->geofenceZones()
            ->orderBy('is_active', 'desc')
            ->orderBy('name')
            ->get();

        return $this->success([
            'branch' => $branch,
            'geofence_zones' => $zones,
            'total' => $zones->count(),
            'active' => $zones->where('is_active', true)->count()
        ]);
    }

    /**
     * Get biometric devices for a specific branch
     */
    public function biometricDevices($id)
    {
        $branch = Branch::findOrFail($id);
        
        $devices = $branch->biometricDevices()
            ->with('workplace')
            ->orderBy('is_active', 'desc')
            ->orderBy('device_name')
            ->get();

        return $this->success([
            'branch' => $branch,
            'biometric_devices' => $devices,
            'total' => $devices->count(),
            'active' => $devices->where('is_active', true)->count()
        ]);
    }

    /**
     * Get work schedules for a specific branch
     */
    public function workSchedules($id)
    {
        $branch = Branch::findOrFail($id);
        
        $schedules = $branch->workSchedules()
            ->withCount('employees')
            ->orderBy('is_active', 'desc')
            ->orderBy('name')
            ->get();

        return $this->success([
            'branch' => $branch,
            'work_schedules' => $schedules,
            'total' => $schedules->count(),
            'active' => $schedules->where('is_active', true)->count()
        ]);
    }
}
