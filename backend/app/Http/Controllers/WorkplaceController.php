<?php

namespace App\Http\Controllers;

use App\Models\Workplace;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class WorkplaceController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $workplaces = Workplace::withCount(['employees', 'biometricDevices'])
            ->orderBy('is_active', 'desc')
            ->orderBy('name')
            ->get();

        return $this->success('Workplaces retrieved successfully.', $workplaces);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'radius_meters' => 'nullable|integer|min:10|max:1000',
            'is_active' => 'boolean',
        ]);

        $workplace = Workplace::create($data);

        return $this->success('Workplace created successfully.', $workplace, 201);
    }

    public function show(int $id)
    {
        $workplace = Workplace::withCount(['employees', 'biometricDevices'])
            ->findOrFail($id);

        return $this->success('Workplace retrieved successfully.', $workplace);
    }

    public function update(Request $request, int $id)
    {
        $workplace = Workplace::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:100',
            'latitude' => 'sometimes|numeric|between:-90,90',
            'longitude' => 'sometimes|numeric|between:-180,180',
            'radius_meters' => 'sometimes|integer|min:10|max:1000',
            'is_active' => 'boolean',
        ]);

        $workplace->update($data);

        return $this->success('Workplace updated successfully.', $workplace);
    }

    public function destroy(int $id)
    {
        $workplace = Workplace::findOrFail($id);
        
        if ($workplace->employees()->count() > 0) {
            return $this->error('Cannot delete workplace with assigned employees.', 422);
        }

        $workplace->delete();

        return $this->success('Workplace deleted successfully.');
    }
}
