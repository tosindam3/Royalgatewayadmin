<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use App\Services\ScopeEngine;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserRoleController extends Controller
{
    use ApiResponse;

    protected $scopeEngine;

    public function __construct(ScopeEngine $scopeEngine)
    {
        $this->scopeEngine = $scopeEngine;
    }

    /**
     * Get user's roles
     */
    public function getUserRoles($userId)
    {
        $user = User::with(['roles', 'primaryRole'])->findOrFail($userId);
        return $this->success([
            'roles' => $user->roles,
            'primary_role' => $user->primaryRole,
        ]);
    }

    /**
     * Assign roles to user
     */
    public function assignRoles(Request $request, $userId)
    {
        $user = User::findOrFail($userId);
        $currentUser = $request->user();

        $validated = $request->validate([
            'role_ids' => 'required|array',
            'role_ids.*' => 'exists:roles,id',
            'primary_role_id' => 'nullable|exists:roles,id',
        ]);

        try {
            DB::transaction(function () use ($user, $validated, $currentUser) {
                // Singleton Superadmin Enforcement
                $superRole = Role::where('name', 'super_admin')->first();
                if ($superRole && (in_array($superRole->id, $validated['role_ids']) || ($validated['primary_role_id'] ?? null) == $superRole->id)) {
                    // 1. Only existing super_admin can assign super_admin role
                    if (!$currentUser || !$currentUser->hasRole('super_admin')) {
                        throw new \Exception('Only the Super Administrator can assign the super_admin role.');
                    }

                    // 2. Check if another user already has the role (check both pivot and primary_role_id)
                    $existingSuper = User::where(function($q) use ($superRole) {
                        $q->whereHas('roles', function ($sub) use ($superRole) {
                            $sub->where('roles.id', $superRole->id);
                        })->orWhere('primary_role_id', $superRole->id);
                    })->where('users.id', '!=', $user->id)->exists();

                    if ($existingSuper) {
                        throw new \Exception('A Super Administrator already exists. There can only be one global superadmin.');
                    }
                }

                $user->syncRoles($validated['role_ids'], $currentUser);

                if (isset($validated['primary_role_id'])) {
                    $user->update(['primary_role_id' => $validated['primary_role_id']]);
                }
            });

            return $this->success(
                $user->fresh(['roles', 'primaryRole']),
                'Roles assigned successfully'
            );
        } catch (\Exception $e) {
            return $this->error('Failed to assign roles: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Remove role from user
     */
    public function removeRole(Request $request, $userId, $roleId)
    {
        $user = User::findOrFail($userId);
        $role = Role::findOrFail($roleId);

        try {
            $user->removeRole($role);

            // If removing primary role, clear it
            if ($user->primary_role_id == $roleId) {
                $user->update(['primary_role_id' => null]);
            }

            return $this->success(
                $user->fresh(['roles', 'primaryRole']),
                'Role removed successfully'
            );
        } catch (\Exception $e) {
            return $this->error('Failed to remove role: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get user's effective permissions
     */
    public function getUserPermissions($userId)
    {
        $user = User::with(['roles.permissions'])->findOrFail($userId);
        $permissions = $this->scopeEngine->getUserPermissions($user);

        return $this->success($permissions);
    }

    /**
     * Check if user has specific permission
     */
    public function checkPermission(Request $request, $userId)
    {
        $validated = $request->validate([
            'permission' => 'required|string',
            'scope' => 'nullable|in:all,branch,department,team,self',
        ]);

        $user = User::with(['roles.permissions'])->findOrFail($userId);
        
        $hasPermission = $this->scopeEngine->hasPermission(
            $user,
            $validated['permission'],
            $validated['scope'] ?? 'self'
        );

        return $this->success([
            'has_permission' => $hasPermission,
            'user_scope' => $this->scopeEngine->getUserScope($user, $validated['permission']),
        ]);
    }

    /**
     * Get all users with a specific role
     */
    public function getUsersByRole($roleId)
    {
        $role = Role::with(['users'])->findOrFail($roleId);
        return $this->success($role->users);
    }

    /**
     * Bulk assign role to multiple users
     */
    public function bulkAssignRole(Request $request)
    {
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
            'role_id' => 'required|exists:roles,id',
        ]);

        $currentUser = $request->user();
        $role = Role::findOrFail($validated['role_id']);

        try {
            DB::transaction(function () use ($validated, $role, $currentUser) {
                // Singleton Superadmin Enforcement
                if ($role->name === 'super_admin') {
                    // 1. Only existing super_admin can assign super_admin role
                    if (!$currentUser || !$currentUser->hasRole('super_admin')) {
                        throw new \Exception('Only the Super Administrator can assign the super_admin role.');
                    }

                    // 2. Prevent bulk assignment if it would result in > 1 superadmin
                    if (count($validated['user_ids']) > 1) {
                        throw new \Exception('There can only be one global superadmin. Bulk assignment of this role is not permitted.');
                    }

                    // 3. Check if another user already has the role
                    $existingSuper = User::where(function($q) use ($role) {
                        $q->whereHas('roles', function ($sub) use ($role) {
                            $sub->where('roles.id', $role->id);
                        })->orWhere('primary_role_id', $role->id);
                    })->where('users.id', '!=', $validated['user_ids'][0])->exists();

                    if ($existingSuper) {
                        throw new \Exception('A Super Administrator already exists. There can only be one global superadmin.');
                    }
                }

                foreach ($validated['user_ids'] as $userId) {
                    $user = User::find($userId);
                    $user->assignRole($role, $currentUser);
                }
            });

            return $this->success(null, 'Role assigned to ' . count($validated['user_ids']) . ' users');
        } catch (\Exception $e) {
            return $this->error('Failed to bulk assign role: ' . $e->getMessage(), 500);
        }
    }
}
