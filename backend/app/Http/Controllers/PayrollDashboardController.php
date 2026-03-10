<?php

namespace App\Http\Controllers;

use App\Models\PayrollRun;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PayrollDashboardController extends Controller
{
    /**
     * Get payroll dashboard metrics
     * GET /api/v1/payroll/metrics
     */
    public function metrics()
    {
        try {
            // 1. KPI Stats
            $monthlyPayroll = PayrollRun::approved()
                ->whereHas('period', function($q) {
                    $q->where('month', now()->month)->where('year', now()->year);
                })
                ->sum('total_net');

            $totalEmployees = Employee::operational()->count();

            $averagePay = $totalEmployees > 0 ? $monthlyPayroll / $totalEmployees : 0;

            // Recently approved runs for trend
            $recentRuns = PayrollRun::approved()
                ->with('period')
                ->orderBy('approved_at', 'desc')
                ->limit(5)
                ->get();

            // 2. Payment History (Last 6 months)
            $history = PayrollRun::query()
                ->join('payroll_periods', 'payroll_runs.period_id', '=', 'payroll_periods.id')
                ->where('payroll_runs.status', 'approved')
                ->select(
                    'payroll_periods.id',
                    'payroll_periods.year',
                    'payroll_periods.month',
                    DB::raw('SUM(payroll_runs.total_net) as amount')
                )
                ->groupBy('payroll_periods.id', 'payroll_periods.year', 'payroll_periods.month')
                ->orderBy('payroll_periods.year', 'desc')
                ->orderBy('payroll_periods.month', 'desc')
                ->limit(6)
                ->get()
                ->map(function($item) {
                    return [
                        'period' => date('F Y', mktime(0, 0, 0, $item->month, 1, $item->year)),
                        'amount' => (float) $item->amount
                    ];
                })
                ->reverse()
                ->values();

            // 3. Employee Type Distribution
            $distribution = Employee::operational()
                ->select('employment_type as type', DB::raw('count(*) as count'))
                ->groupBy('employment_type')
                ->get();

            // 4. Active run count (submitted + draft)
            $activeRuns = PayrollRun::whereIn('status', ['submitted', 'draft'])->count();

            return response()->json([
                'data' => [
                    'stats' => [
                        'monthly_payroll' => (float) $monthlyPayroll,
                        'total_employees' => $totalEmployees,
                        'average_pay' => (float) $averagePay,
                        'active_runs' => $activeRuns,
                    ],
                    'history' => $history,
                    'distribution' => $distribution,
                    'recent_runs' => $recentRuns->map(function($run) {
                        return [
                            'id' => $run->id,
                            'name' => $run->period?->name ?? 'Unknown Period',
                            'amount' => (float) $run->total_net,
                            'date' => $run->approved_at?->toDateString() ?? $run->updated_at?->toDateString() ?? now()->toDateString(),
                            'employees' => $run->employees()->count()
                        ];
                    })
                ]
            ]);
        } catch (\Throwable $e) {
            \Log::error('PayrollDashboard metrics error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'message' => 'Failed to load payroll metrics: ' . $e->getMessage(),
                'data' => [
                    'stats' => ['monthly_payroll' => 0, 'total_employees' => 0, 'average_pay' => 0, 'active_runs' => 0],
                    'history' => [],
                    'distribution' => [],
                    'recent_runs' => []
                ]
            ], 500);
        }
    }
}
