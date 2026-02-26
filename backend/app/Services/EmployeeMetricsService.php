<?php

namespace App\Services;

use App\Models\Employee;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class EmployeeMetricsService
{
    public function getMetrics(): array
    {
        return Cache::remember('employee_metrics', 60, function () {
            return [
                'total_employees' => Employee::count(),
                'active_employees' => Employee::where('status', 'active')->count(),
                'on_leave_today' => $this->getOnLeaveToday(),
                'new_hires_this_month' => Employee::whereMonth('hire_date', now()->month)
                    ->whereYear('hire_date', now()->year)
                    ->count(),
            ];
        });
    }

    private function getOnLeaveToday(): int
    {
        // This would integrate with Leave module when available
        // For now, return 0 or query from attendance/leave tables
        return 0;
    }
}
