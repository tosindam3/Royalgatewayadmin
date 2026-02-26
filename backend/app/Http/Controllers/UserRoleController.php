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
