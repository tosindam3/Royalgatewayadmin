<?php

namespace App\Http\Controllers;

use App\Models\PayrollItem;
use Illuminate\Http\Request;

class PayrollItemController extends Controller
{
    /**
     * List payroll items
     * GET /api/v1/payroll/items
     */
    public function index(Request $request)
    {
        $query = PayrollItem::query();

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter by active status
        if ($request->has('active')) {
            $query->where('active', $request->boolean('active'));
        }

        $query->orderBy('type')->orderBy('name');

        $items = $query->get();

        return response()->json([
            'data' => $items->map(function ($item) {
                return $this->formatItem($item);
            }),
        ]);
    }

    /**
     * Create payroll item
     * POST /api/v1/payroll/items
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:payroll_items,code',
            'type' => 'required|in:earning,deduction',
            'method' => 'required|in:fixed,percent_of_base',
            'default_value' => 'required|numeric|min:0',
            'active' => 'boolean',
            'description' => 'nullable|string|max:1000',
        ]);

        $item = PayrollItem::create($validated);

        return response()->json([
            'data' => $this->formatItem($item),
        ], 201);
    }

    /**
     * Update payroll item
     * PATCH /api/v1/payroll/items/{id}
     */
    public function update(Request $request, int $id)
    {
        $item = PayrollItem::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'code' => 'sometimes|string|max:50|unique:payroll_items,code,' . $id,
            'type' => 'sometimes|in:earning,deduction',
            'method' => 'sometimes|in:fixed,percent_of_base',
            'default_value' => 'sometimes|numeric|min:0',
            'active' => 'sometimes|boolean',
            'description' => 'nullable|string|max:1000',
        ]);

        $item->update($validated);

        return response()->json([
            'data' => $this->formatItem($item),
        ]);
    }

    /**
     * Format payroll item for API response
     */
    private function formatItem(PayrollItem $item): array
    {
        return [
            'id' => $item->id,
            'name' => $item->name,
            'code' => $item->code,
            'type' => $item->type,
            'method' => $item->method,
            'default_value' => (float) $item->default_value,
            'active' => $item->active,
            'description' => $item->description,
            'created_at' => $item->created_at->toIso8601String(),
            'updated_at' => $item->updated_at->toIso8601String(),
        ];
    }
}
