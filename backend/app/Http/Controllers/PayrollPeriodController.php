<?php

namespace App\Http\Controllers;

use App\Models\PayrollPeriod;
use Illuminate\Http\Request;

class PayrollPeriodController extends Controller
{
    /**
     * List payroll periods
     * GET /api/v1/payroll/periods
     */
    public function index(Request $request)
    {
        $query = PayrollPeriod::query();

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by year
        if ($request->has('year')) {
            $query->where('year', $request->year);
        }

        $query->orderBy('year', 'desc')->orderBy('month', 'desc');

        $periods = $query->get();

        return response()->json([
            'data' => $periods->map(function ($period) {
                return $this->formatPeriod($period);
            }),
        ]);
    }

    /**
     * Get single period
     * GET /api/v1/payroll/periods/{id}
     */
    public function show(int $id)
    {
        $period = PayrollPeriod::findOrFail($id);

        return response()->json([
            'data' => $this->formatPeriod($period),
        ]);
    }

    /**
     * Create a new payroll period
     * POST /api/v1/payroll/periods
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'year' => 'required|integer|min:2020|max:2100',
            'month' => 'required|integer|min:1|max:12',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'working_days' => 'required|integer|min:1|max:31',
        ]);

        // Check if period already exists
        if (PayrollPeriod::forYearMonth($validated['year'], $validated['month'])->exists()) {
            return response()->json(['message' => 'Payroll period already exists for this month and year'], 422);
        }

        $period = PayrollPeriod::create(array_merge($validated, ['status' => 'open']));

        return response()->json([
            'data' => $this->formatPeriod($period),
            'message' => 'Payroll period created successfully'
        ], 201);
    }

    /**
     * Format period for API response
     */
    private function formatPeriod(PayrollPeriod $period): array
    {
        return [
            'id' => $period->id,
            'name' => $period->name,
            'year' => $period->year,
            'month' => $period->month,
            'start_date' => $period->start_date->toDateString(),
            'end_date' => $period->end_date->toDateString(),
            'working_days' => $period->working_days,
            'status' => $period->status,
            'created_at' => $period->created_at->toIso8601String(),
            'updated_at' => $period->updated_at->toIso8601String(),
        ];
    }
}
