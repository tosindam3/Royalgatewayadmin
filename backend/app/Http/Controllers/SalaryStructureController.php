<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SalaryStructure;

class SalaryStructureController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json([
            'data' => SalaryStructure::all()
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'earnings_components' => 'required|array',
            'deductions_components' => 'required|array',
            'is_active' => 'boolean',
        ]);

        $structure = SalaryStructure::create($validated);

        return response()->json([
            'data' => $structure,
            'message' => 'Salary structure created successfully'
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $structure = SalaryStructure::findOrFail($id);
        return response()->json(['data' => $structure]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $structure = SalaryStructure::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:1000',
            'earnings_components' => 'sometimes|array',
            'deductions_components' => 'sometimes|array',
            'is_active' => 'boolean',
        ]);

        $structure->update($validated);

        return response()->json([
            'data' => $structure,
            'message' => 'Salary structure updated successfully'
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $structure = SalaryStructure::findOrFail($id);
        
        // Prevent deletion if associated with employee salaries
        if ($structure->employeeSalaries()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete structure while it is assigned to employees'
            ], 422);
        }

        $structure->delete();

        return response()->json([
            'message' => 'Salary structure deleted successfully'
        ]);
    }
}
