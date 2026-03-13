<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RoleController extends Controller
{
    use ApiResponse;

    /**
     * Get all roles
     */
    public function index(Request $request)
    {
        $query = Role::with(['permissions']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('display_name', 'like', "%{$search}%");
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $roles = $request->has('paginate') && $request->paginate === 'false'
            ? $query->get()
            : $query->paginate($request->get('per_page', 20));

        return $this->success($roles);
    }

    /**
     * Get single role
     */
    public function show($id)
    {
        $role = Role::with(['permissions', 'users'])->findOrFail($id);
        return $this->success($role);
    }

    /**
     * Create new role
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:roles,name|max:255',
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'default_scope' => 'required|in:all,branch,department,team,self',
            'is_active' => 'boolean',
        ]);

        try {
            $role = DB::transaction(function () use ($validated) {
                return Role::create($validated);
            });

            return $this->success($role, 'Role created successfully', 201);
        } catch (\Exception $e) {
            return $this->error('Failed to create role: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update role
     */
    public function update(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        if ($role->is_system || $role->name === 'super_admin') {
            return $this->error('The Super Administrator role is a protected system role and cannot be modified.', 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|unique:roles,name,' . $id . '|max:255',
            'display_name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'default_scope' => 'sometimes|in:all,branch,department,team,self',
            'is_active' => 'boolean',
        ]);

        try {
            $role->update($validated);
            return $this->success($role->fresh(['permissions']), 'Role updated successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to update role: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete role
     */
    public function destroy($id)
    {
        $role = Role::findOrFail($id);

        if ($role->is_system) {
            return $this->error('System roles cannot be deleted', 403);
        }

        if ($role->users()->count() > 0) {
            return $this->error('Cannot delete role with assigned users', 400);
        }

        try {
            $role->delete();
            return $this->success(null, 'Role deleted successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to delete role: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Assign permissions to role
     */
    public function assignPermissions(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        $validated = $request->validate([
            'permissions' => 'required|array',
            'permissions.*.permission_id' => 'required|exists:permissions,id',
            'permissions.*.scope_level' => 'required|in:all,branch,department,team,self',
        ]);

        try {
            DB::transaction(function () use ($role, $validated) {
                $syncData = [];
                foreach ($validated['permissions'] as $perm) {
                    $syncData[$perm['permission_id']] = ['scope_level' => $perm['scope_level']];
                }
                $role->permissions()->sync($syncData);
            });

            return $this->success(
                $role->fresh(['permissions']),
                'Permissions assigned successfully'
            );
        } catch (\Exception $e) {
            return $this->error('Failed to assign permissions: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get role permissions
     */
    public function permissions($id)
    {
        $role = Role::with(['permissions'])->findOrFail($id);
        
        $permissions = $role->permissions->map(function ($permission) {
            return [
                'id' => $permission->id,
                'name' => $permission->name,
                'display_name' => $permission->display_name,
                'module' => $permission->module,
                'action' => $permission->action,
                'scope_level' => $permission->pivot->scope_level,
            ];
        });

        return $this->success($permissions);
    }

    /**
     * Get users with this role
     */
    public function users($id)
    {
        $role = Role::with(['users'])->findOrFail($id);
        return $this->success($role->users);
    }
}
