<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    use ApiResponse;

    /**
     * Get all permissions
     */
    public function index(Request $request)
    {
        $query = Permission::query();

        if ($request->has('module')) {
            $query->where('module', $request->module);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('display_name', 'like', "%{$search}%")
                  ->orWhere('module', 'like', "%{$search}%");
            });
        }

        $permissions = $request->has('paginate') && $request->paginate === 'false'
            ? $query->orderBy('module')->orderBy('action')->get()
            : $query->orderBy('module')->orderBy('action')->paginate($request->get('per_page', 50));

        return $this->success($permissions);
    }

    /**
     * Get permissions grouped by module
     */
    public function groupedByModule()
    {
        $permissions = Permission::orderBy('module')->orderBy('action')->get();
        $grouped = $permissions->groupBy('module');

        return $this->success($grouped);
    }

    /**
     * Get single permission
     */
    public function show($id)
    {
        $permission = Permission::with(['roles'])->findOrFail($id);
        return $this->success($permission);
    }

    /**
     * Get all available modules
     */
    public function modules()
    {
        $modules = Permission::select('module')
            ->distinct()
            ->orderBy('module')
            ->pluck('module');

        return $this->success($modules);
    }

    /**
     * Get all available actions
     */
    public function actions()
    {
        $actions = Permission::select('action')
            ->distinct()
            ->orderBy('action')
            ->pluck('action');

        return $this->success($actions);
    }

    /**
     * Get permission matrix (for UI)
     */
    public function matrix()
    {
        $permissions = Permission::orderBy('module')->orderBy('action')->get();
        
        $matrix = [];
        foreach ($permissions as $permission) {
            if (!isset($matrix[$permission->module])) {
                $matrix[$permission->module] = [];
            }
            $matrix[$permission->module][] = [
                'id' => $permission->id,
                'name' => $permission->name,
                'display_name' => $permission->display_name,
                'action' => $permission->action,
                'available_scopes' => $permission->available_scopes,
            ];
        }

        return $this->success($matrix);
    }
}
