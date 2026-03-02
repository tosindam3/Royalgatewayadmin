<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Employee;
use App\Models\LeaveType;
use App\Models\LeaveRequest;
use App\Models\LeaveBalance;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LeaveRequestsSeeder extends Seeder
{
    public function run(): void
    {
        $employees = Employee::where('status', 'active')->get();
        $leaveTypes = LeaveType::active()->get();
        $approvers = User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['HR Admin', 'Branch Manager', 'Department Head']);
        })->get();
        
        if ($employees->isEmpty() || $leaveTypes->isEmpty()) {
            $this->command->warn('No employees or leave types found. Skipping leave requests seeding.');
            return;
        }
        
        $currentYear = now()->year;
        $requestCount = 0;
        
        $this->command->info("Generating sample leave requests for {$employees->count()} employees...");
        
        foreach ($employees as $employee) {
            // Generate 2-5 leave requests per employee
            $numRequests = rand(2, 5);
            
            for ($i = 0; $i < $numRequests; $i++) {
                $leaveType = $leaveTypes->random();
                
                // Random status distribution
                $statusRand = rand(1, 100);
                if ($statusRand <= 60) {
                    $status = 'approved';
                } elseif ($statusRand <= 80) {
                    $status = 'pending';
                } elseif ($statusRand <= 90) {
                    $status = 'rejected';
                } else {
                    $status = 'cancelled';
                }
                
                // Generate dates
                $startDate = $this->generateRandomDate($status);
                $duration = rand(1, min(5, $leaveType->max_consecutive_days ?? 5));
                $endDate = $startDate->copy()->addDays($duration - 1);
                
                // Skip weekends
                while ($startDate->isWeekend()) {
                    $startDate->addDay();
                }
                while ($endDate->isWeekend()) {
                    $endDate->addDay();
                }
                
                $requestNumber = $this->generateRequestNumber($currentYear, $requestCount + 1);
                
                $requestData = [
                    'request_number' => $requestNumber,
                    'employee_id' => $employee->id,
                    'leave_type_id' => $leaveType->id,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'total_days' => $duration,
                    'reason' => $this->generateReason($leaveType->code),
                    'contact_during_leave' => $employee->phone ?? '+1-555-0000',
                    'status' => $status,
                    'created_at' => $startDate->copy()->subDays(rand(7, 30)),
                ];
                
                // Add approval/rejection data
                if (in_array($status, ['approved', 'rejected']) && $approvers->isNotEmpty()) {
                    $approver = $approvers->random();
                    $requestData['approved_by'] = $approver->id;
                    $requestData['approved_at'] = $requestData['created_at']->copy()->addDays(rand(1, 3));
                    
                    if ($status === 'approved') {
                        $requestData['approval_notes'] = 'Approved as per company policy.';
                    } else {
                        $requestData['rejection_reason'] = 'Insufficient staffing during requested period.';
                    }
                }
                
                // Add cancellation data
                if ($status === 'cancelled') {
                    $requestData['cancelled_by'] = $employee->user_id ?? $approvers->random()->id;
                    $requestData['cancelled_at'] = $requestData['created_at']->copy()->addDays(rand(1, 5));
                    $requestData['cancellation_reason'] = 'Personal circumstances changed.';
                }
                
                try {
                    DB::transaction(function () use ($requestData, $employee, $leaveType, $status, $duration) {
                        $request = LeaveRequest::create($requestData);
                        
                        // Update leave balance
                        $balance = LeaveBalance::where('employee_id', $employee->id)
                            ->where('leave_type_id', $leaveType->id)
                            ->where('year', now()->year)
                            ->first();
                        
                        if ($balance) {
                            if ($status === 'pending') {
                                $balance->pending += $duration;
                            } elseif ($status === 'approved') {
                                $balance->used += $duration;
                            }
                            $balance->available = $balance->total_allocated - $balance->used - $balance->pending;
                            $balance->save();
                        }
                    });
                    
                    $requestCount++;
                } catch (\Exception $e) {
                    $this->command->warn("Failed to create request for employee {$employee->employee_code}: {$e->getMessage()}");
                }
            }
        }
        
        $this->command->info("Created {$requestCount} leave requests successfully.");
    }
    
    private function generateRandomDate(string $status): Carbon
    {
        $now = now();
        
        if ($status === 'approved') {
            // Mix of past, current, and future approved leaves
            $rand = rand(1, 100);
            if ($rand <= 40) {
                // Past leaves (last 3 months)
                return $now->copy()->subDays(rand(1, 90));
            } elseif ($rand <= 60) {
                // Current/ongoing leaves
                return $now->copy()->subDays(rand(0, 5));
            } else {
                // Future leaves (next 2 months)
                return $now->copy()->addDays(rand(1, 60));
            }
        } elseif ($status === 'pending') {
            // Pending requests are typically for future dates
            return $now->copy()->addDays(rand(7, 45));
        } else {
            // Rejected/cancelled - mostly past
            return $now->copy()->subDays(rand(1, 60));
        }
    }
    
    private function generateReason(string $leaveCode): string
    {
        $reasons = [
            'ANNUAL' => [
                'Family vacation to the beach',
                'Personal time off for rest and relaxation',
                'Attending family wedding ceremony',
                'Planned trip abroad',
                'Spending time with family',
            ],
            'SICK' => [
                'Medical appointment and recovery',
                'Flu and fever symptoms',
                'Doctor recommended rest',
                'Minor surgery recovery',
                'Health checkup and treatment',
            ],
            'CASUAL' => [
                'Personal errands and appointments',
                'Family emergency',
                'Home maintenance issues',
                'Attending to personal matters',
                'Short personal break',
            ],
            'MATERNITY' => [
                'Childbirth and postnatal care',
                'Maternity leave as per policy',
            ],
            'PATERNITY' => [
                'Supporting spouse during childbirth',
                'Paternity leave for newborn care',
            ],
            'STUDY' => [
                'Attending professional certification exam',
                'Educational course attendance',
            ],
            'BEREAVEMENT' => [
                'Mourning loss of family member',
                'Attending funeral services',
            ],
        ];
        
        $typeReasons = $reasons[$leaveCode] ?? ['Personal leave'];
        return $typeReasons[array_rand($typeReasons)];
    }
    
    private function generateRequestNumber(int $year, int $sequence): string
    {
        return sprintf('LR-%d-%05d', $year, $sequence);
    }
}
