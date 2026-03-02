<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\Holiday;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class LeaveService
{
    /**
     * Calculate working days between two dates excluding weekends and holidays
     */
    public function calculateWorkingDays(Carbon $startDate, Carbon $endDate, ?int $branchId = null): float
    {
        $cacheKey = "working_days_{$startDate->format('Y-m-d')}_{$endDate->format('Y-m-d')}_{$branchId}";
        
        return Cache::remember($cacheKey, 3600, function () use ($startDate, $endDate, $branchId) {
            $period = CarbonPeriod::create($startDate, $endDate);
            $workingDays = 0;
            
            // Get holidays for the period
            $holidays = Holiday::whereBetween('date', [$startDate, $endDate])
                ->when($branchId, fn($q) => $q->forBranch($branchId), fn($q) => $q->global())
                ->pluck('date')
                ->map(fn($date) => $date->format('Y-m-d'))
                ->toArray();
            
            foreach ($period as $date) {
                // Skip weekends (Saturday = 6, Sunday = 0)
                if ($date->dayOfWeek === 0 || $date->dayOfWeek === 6) {
                    continue;
                }
                
                // Skip holidays
                if (in_array($date->format('Y-m-d'), $holidays)) {
                    continue;
                }
                
                $workingDays++;
            }
            
            return $workingDays;
        });
    }

    /**
     * Generate unique leave request number
     */
    public function generateRequestNumber(): string
    {
        $year = now()->year;
        $lastRequest = LeaveRequest::where('request_number', 'like', "LR-{$year}-%")
            ->orderByDesc('id')
            ->first();
        
        if ($lastRequest) {
            $lastNumber = (int) substr($lastRequest->request_number, -5);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return sprintf('LR-%d-%05d', $year, $newNumber);
    }

    /**
     * Create leave request with validation
     */
    public function createLeaveRequest(array $data): LeaveRequest
    {
        return DB::transaction(function () use ($data) {
            $employee = Employee::findOrFail($data['employee_id']);
            $leaveType = LeaveType::findOrFail($data['leave_type_id']);
            
            $startDate = Carbon::parse($data['start_date']);
            $endDate = Carbon::parse($data['end_date']);
            
            // Calculate working days
            $workingDays = $this->calculateWorkingDays($startDate, $endDate, $employee->branch_id);
            
            // Check balance
            $balance = LeaveBalance::where('employee_id', $employee->id)
                ->where('leave_type_id', $leaveType->id)
                ->where('year', now()->year)
                ->first();
            
            if (!$balance || !$balance->hasSufficientBalance($workingDays)) {
                throw new \Exception('Insufficient leave balance');
            }
            
            // Create request
            $request = LeaveRequest::create([
                'request_number' => $this->generateRequestNumber(),
                'employee_id' => $employee->id,
                'leave_type_id' => $leaveType->id,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'total_days' => $workingDays,
                'reason' => $data['reason'],
                'contact_during_leave' => $data['contact_during_leave'] ?? null,
                'document_path' => $data['document_path'] ?? null,
                'status' => 'pending',
            ]);
            
            // Update pending balance
            $balance->pending += $workingDays;
            $balance->recalculate();
            
            return $request;
        });
    }

    /**
     * Approve leave request
     */
    public function approveLeaveRequest(LeaveRequest $request, int $approverId, ?string $notes = null): LeaveRequest
    {
        return DB::transaction(function () use ($request, $approverId, $notes) {
            $request->update([
                'status' => 'approved',
                'approved_by' => $approverId,
                'approved_at' => now(),
                'approval_notes' => $notes,
            ]);
            
            // Update balance: move from pending to used
            $balance = LeaveBalance::where('employee_id', $request->employee_id)
                ->where('leave_type_id', $request->leave_type_id)
                ->where('year', now()->year)
                ->first();
            
            if ($balance) {
                $balance->pending -= $request->total_days;
                $balance->used += $request->total_days;
                $balance->recalculate();
            }
            
            return $request->fresh();
        });
    }

    /**
     * Reject leave request
     */
    public function rejectLeaveRequest(LeaveRequest $request, int $approverId, string $reason): LeaveRequest
    {
        return DB::transaction(function () use ($request, $approverId, $reason) {
            $request->update([
                'status' => 'rejected',
                'approved_by' => $approverId,
                'approved_at' => now(),
                'rejection_reason' => $reason,
            ]);
            
            // Release pending balance
            $balance = LeaveBalance::where('employee_id', $request->employee_id)
                ->where('leave_type_id', $request->leave_type_id)
                ->where('year', now()->year)
                ->first();
            
            if ($balance) {
                $balance->pending -= $request->total_days;
                $balance->recalculate();
            }
            
            return $request->fresh();
        });
    }

    /**
     * Cancel leave request
     */
    public function cancelLeaveRequest(LeaveRequest $request, int $userId, string $reason): LeaveRequest
    {
        return DB::transaction(function () use ($request, $userId, $reason) {
            $request->update([
                'status' => 'cancelled',
                'cancelled_by' => $userId,
                'cancelled_at' => now(),
                'cancellation_reason' => $reason,
            ]);
            
            // Restore balance based on previous status
            $balance = LeaveBalance::where('employee_id', $request->employee_id)
                ->where('leave_type_id', $request->leave_type_id)
                ->where('year', now()->year)
                ->first();
            
            if ($balance) {
                if ($request->status === 'pending') {
                    $balance->pending -= $request->total_days;
                } elseif ($request->status === 'approved') {
                    $balance->used -= $request->total_days;
                }
                $balance->recalculate();
            }
            
            return $request->fresh();
        });
    }

    /**
     * Initialize leave balances for an employee
     */
    public function initializeEmployeeBalances(Employee $employee, int $year): void
    {
        $leaveTypes = LeaveType::active()->get();
        
        foreach ($leaveTypes as $leaveType) {
            $allocated = $this->calculateProRataAllocation($employee, $leaveType, $year);
            
            LeaveBalance::updateOrCreate(
                [
                    'employee_id' => $employee->id,
                    'leave_type_id' => $leaveType->id,
                    'year' => $year,
                ],
                [
                    'total_allocated' => $allocated,
                    'available' => $allocated,
                    'expiry_date' => Carbon::create($year, 12, 31),
                ]
            );
        }
    }

    /**
     * Calculate pro-rata allocation based on hire date
     */
    private function calculateProRataAllocation(Employee $employee, LeaveType $leaveType, int $year): float
    {
        if ($leaveType->accrual_method === 'per_incident') {
            return 0; // Allocated on request
        }
        
        $hireDate = Carbon::parse($employee->hire_date);
        $yearStart = Carbon::create($year, 1, 1);
        $yearEnd = Carbon::create($year, 12, 31);
        
        // If hired before year start, give full allocation
        if ($hireDate->lt($yearStart)) {
            return $leaveType->default_days_per_year;
        }
        
        // If hired after year end, no allocation
        if ($hireDate->gt($yearEnd)) {
            return 0;
        }
        
        // Pro-rata calculation
        $monthsRemaining = $hireDate->diffInMonths($yearEnd) + 1;
        return round(($leaveType->default_days_per_year / 12) * $monthsRemaining, 2);
    }

    /**
     * Get employees on leave today (cached)
     */
    public function getEmployeesOnLeaveToday(): int
    {
        return Cache::remember('employees_on_leave_today', 300, function () {
            return LeaveRequest::ongoing()->count();
        });
    }

    /**
     * Get leave statistics for dashboard
     */
    public function getDashboardStats(): array
    {
        return Cache::remember('leave_dashboard_stats', 300, function () {
            return [
                'on_leave_today' => LeaveRequest::ongoing()->count(),
                'pending_requests' => LeaveRequest::pending()->count(),
                'approved_this_month' => LeaveRequest::approved()
                    ->whereMonth('approved_at', now()->month)
                    ->count(),
                'rejected_this_month' => LeaveRequest::where('status', 'rejected')
                    ->whereMonth('approved_at', now()->month)
                    ->count(),
                'upcoming_leaves' => LeaveRequest::upcoming()
                    ->whereBetween('start_date', [now(), now()->addDays(7)])
                    ->count(),
            ];
        });
    }
}
