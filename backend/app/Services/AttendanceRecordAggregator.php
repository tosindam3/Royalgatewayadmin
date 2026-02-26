<?php

namespace App\Services;

use App\Models\AttendanceLog;
use App\Models\AttendanceRecord;
use App\Models\Employee;
use App\Models\OrganizationSetting;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class AttendanceRecordAggregator
{
    private array $settings;

    public function __construct()
    {
        $this->loadSettings();
    }

    /**
     * Load attendance settings from database
     */
    private function loadSettings(): void
    {
        $this->settings = Cache::remember('attendance_settings', 3600, function () {
            $settings = OrganizationSetting::where('key', 'like', 'attendance.%')->get();
            
            $config = [];
            foreach ($settings as $setting) {
                $key = str_replace('attendance.', '', $setting->key);
                $config[$key] = json_decode($setting->value, true);
            }
            
            // Defaults if not set
            return array_merge([
                'work_start_time' => '09:00',
                'work_end_time' => '17:00',
                'work_hours_per_day' => 8,
                'grace_period_minutes' => 15,
                'working_days' => [1, 2, 3, 4, 5], // Monday to Friday
                'break_duration_minutes' => 60,
                'overtime_enabled' => true,
                'overtime_threshold_minutes' => 480,
                'late_marking_enabled' => true,
                'late_after_grace_period' => true,
            ], $config);
        });
    }

    /**
     * Check if date is a working day
     */
    private function isWorkingDay(string $date): bool
    {
        $dayOfWeek = Carbon::parse($date)->dayOfWeekIso; // 1 = Monday, 7 = Sunday
        return in_array($dayOfWeek, $this->settings['working_days']);
    }

    /**
     * Aggregate attendance logs for a specific date into attendance_records
     */
    public function aggregateForDate(string $date): void
    {
        // Only get employees who have logs for this date
        $employeeIds = AttendanceLog::whereDate('timestamp', $date)
            ->distinct()
            ->pluck('employee_id');

        foreach ($employeeIds as $employeeId) {
            $this->aggregateEmployeeDate($employeeId, $date);
        }
    }

    /**
     * Aggregate attendance logs for a specific employee and date
     */
    public function aggregateEmployeeDate(int $employeeId, string $date): AttendanceRecord
    {
        // Get employee with branch and department
        $employee = Employee::with(['branch', 'department'])->find($employeeId);
        
        $logs = AttendanceLog::where('employee_id', $employeeId)
            ->whereDate('timestamp', $date)
            ->orderBy('timestamp')
            ->get();

        $checkIn = $logs->where('check_type', 'check_in')->first();
        $checkOut = $logs->where('check_type', 'check_out')->first();

        // Calculate metrics
        $minutesWorked = 0;
        $lateMinutes = 0;
        $overtimeMinutes = 0;
        $breakMinutes = $this->settings['break_duration_minutes'];
        $status = 'absent';

        if ($checkIn) {
            $status = $checkOut ? 'present' : 'partial';
            
            if ($checkOut) {
                // Calculate total time between check-in and check-out
                $totalMinutes = $checkIn->timestamp->diffInMinutes($checkOut->timestamp);
                
                // Subtract break time to get actual work minutes
                $minutesWorked = max(0, $totalMinutes - $breakMinutes);
                
                // Calculate overtime based on company policy
                if ($this->settings['overtime_enabled']) {
                    $overtimeThreshold = $this->settings['overtime_threshold_minutes'];
                    if ($minutesWorked > $overtimeThreshold) {
                        $overtimeMinutes = $minutesWorked - $overtimeThreshold;
                    }
                }
            }

            // Calculate late minutes based on company policy
            if ($this->settings['late_marking_enabled']) {
                $workStartTime = $this->settings['work_start_time'];
                $gracePeriod = $this->settings['grace_period_minutes'];
                
                // Expected start time + grace period
                $expectedStart = Carbon::parse($date . ' ' . $workStartTime);
                $graceEnd = $expectedStart->copy()->addMinutes($gracePeriod);
                
                if ($checkIn->timestamp->gt($graceEnd)) {
                    // Late after grace period - calculate minutes late
                    $lateMinutes = $graceEnd->diffInMinutes($checkIn->timestamp);
                } elseif (!$this->settings['late_after_grace_period'] && $checkIn->timestamp->gt($expectedStart)) {
                    // Late from expected start (no grace) - calculate minutes late
                    $lateMinutes = $expectedStart->diffInMinutes($checkIn->timestamp);
                }
                // If checked in before expected start or within grace, late_minutes remains 0
            }
        }

        // Map source from logs
        $sourceIn = $checkIn ? $this->mapSource($checkIn->source) : null;
        $sourceOut = $checkOut ? $this->mapSource($checkOut->source) : null;

        // Geofence status
        $geofenceStatusIn = $checkIn && $checkIn->geofence_zone_id ? 'pass' : 'na';
        $geofenceStatusOut = $checkOut && $checkOut->geofence_zone_id ? 'pass' : 'na';

        // Detect anomalies
        $hasMissingPunch = $checkIn && !$checkOut;
        $hasDuplicate = $logs->where('check_type', 'check_in')->count() > 1 || 
                        $logs->where('check_type', 'check_out')->count() > 1;

        // Upsert record
        return AttendanceRecord::updateOrCreate(
            [
                'employee_id' => $employeeId,
                'attendance_date' => $date,
            ],
            [
                'check_in_time' => $checkIn?->timestamp,
                'check_out_time' => $checkOut?->timestamp,
                'work_minutes' => $minutesWorked,
                'late_minutes' => $lateMinutes,
                'overtime_minutes' => $overtimeMinutes,
                'break_minutes' => $checkOut ? $breakMinutes : 0,
                'source' => $sourceIn ?? $sourceOut ?? 'app',
                'branch_id' => $employee?->branch_id,
                'department_id' => $employee?->department_id,
                'geofence_status' => $geofenceStatusIn,
                'status' => $status,
            ]
        );
    }

    /**
     * Map attendance log source to attendance record source
     */
    private function mapSource(string $logSource): string
    {
        return match($logSource) {
            'biometric' => 'device',
            'mobile_app' => 'app',
            'web_app' => 'app',
            'kiosk' => 'device',
            default => 'app',
        };
    }

    /**
     * Aggregate for a date range
     */
    public function aggregateDateRange(string $startDate, string $endDate): void
    {
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);

        while ($start->lte($end)) {
            $this->aggregateForDate($start->toDateString());
            $start->addDay();
        }
    }

    /**
     * Aggregate for entire month
     */
    public function aggregateMonth(string $month): void
    {
        $start = Carbon::parse($month . '-01');
        $end = $start->copy()->endOfMonth();
        
        $this->aggregateDateRange($start->toDateString(), $end->toDateString());
    }
}
