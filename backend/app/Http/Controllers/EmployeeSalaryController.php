<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\EmployeeSalary;

class EmployeeSalaryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = EmployeeSalary::with([
            'employee:id,first_name,last_name,employee_code',
            'salaryStructure:id,name'
        ]);
        
        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        return response()->json([
            'data' => $query->get()
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'salary_structure_id' => 'required|exists:salary_structures,id',
            'base_salary' => 'required|numeric|min:0',
            'effective_date' => 'required|date',
            'is_active' => 'boolean'
        ]);

        // If active, deactivate other mappings for the same employee
        if ($request->boolean('is_active', true)) {
            EmployeeSalary::where('employee_id', $validated['employee_id'])->update(['is_active' => false]);
            $validated['is_active'] = true;
        }

        $mapping = EmployeeSalary::create($validated);

        return response()->json([
            'data' => $mapping->load(['employee', 'salaryStructure']),
            'message' => 'Salary structure assigned successfully'
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $mapping = EmployeeSalary::with(['employee', 'salaryStructure.employees'])->findOrFail($id);
        
        // In a real system, we'd also aggregate attendance penalties here
        // For this demo, we'll return the core data and the frontend will fetch others
        
        return response()->json([
            'data' => $mapping
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'salary_structure_id' => 'required|exists:salary_structures,id',
            'base_salary' => 'required|numeric|min:0',
            'effective_date' => 'required|date',
            'is_active' => 'boolean'
        ]);

        $mapping = EmployeeSalary::findOrFail($id);
        $mapping->update($validated);

        return response()->json([
            'data' => $mapping->load(['employee', 'salaryStructure']),
            'message' => 'Salary mapping updated successfully'
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $mapping = EmployeeSalary::findOrFail($id);
        $mapping->delete();

        return response()->json([
            'message' => 'Salary mapping deleted successfully'
        ]);
    }
}
