<?php

namespace App\Services;

use App\Models\AttendanceLog;
use Illuminate\Support\Facades\Cache;

class AttendanceService
{
    public function todayStatus(int $employeeId): array
    {
        return Cache::remember("attendance:today:{$employeeId}", 60, function () use ($employeeId) {
            $logs = AttendanceLog::where('employee_id', $employeeId)
                ->whereDate('timestamp', today())
                ->get(['check_type', 'timestamp', 'source']);

            $checkIn  = $logs->firstWhere('check_type', 'check_in');
            $checkOut = $logs->firstWhere('check_type', 'check_out');

            return [
                'checked_in'       => (bool) $checkIn,
                'checked_out'      => (bool) $checkOut,
                'check_in_time'    => $checkIn?->timestamp,
                'check_out_time'   => $checkOut?->timestamp,
                'check_in_source'  => $checkIn?->source,
                'check_out_source' => $checkOut?->source,
            ];
        });
    }

    public function invalidateTodayCache(int $employeeId): void
    {
        Cache::forget("attendance:today:{$employeeId}");
    }

    public function logAttendance(array $data): AttendanceLog
    {
        // Add schedule status if it's a check-in and employee has a schedule
        if ($data['check_type'] === 'check_in') {
            $employee = \App\Models\Employee::with('workSchedule')->find($data['employee_id']);
            if ($employee && $employee->workSchedule) {
                $schedule = $employee->workSchedule;
                $punchTime = \Carbon\Carbon::parse($data['timestamp']);
                $scheduleTime = \Carbon\Carbon::createFromFormat('H:i:s', $schedule->check_in_time);

                // Adjust schedule time to today
                $scheduleTime->setDate($punchTime->year, $punchTime->month, $punchTime->day);

                $lateBound = $scheduleTime->copy()->addMinutes($schedule->grace_period_minutes);

                if ($punchTime->gt($lateBound)) {
                    $data['status'] = 'late';
                } else {
                    $data['status'] = 'on_time';
                }
            }
        }

        $log = AttendanceLog::create($data);
        $this->invalidateTodayCache($data['employee_id']);
        return $log;
    }

    public function getRecentLogs(int $employeeId, int $limit = 30): \Illuminate\Database\Eloquent\Collection
    {
        return AttendanceLog::where('employee_id', $employeeId)
            ->latest('timestamp')
            ->limit($limit)
            ->get(['id', 'check_type', 'timestamp', 'source', 'location_lat', 'location_lng']);
    }

    public function getDateRangeLogs(int $employeeId, string $startDate, string $endDate)
    {
        return AttendanceLog::where('employee_id', $employeeId)
            ->whereBetween('timestamp', [$startDate, $endDate])
            ->orderBy('timestamp', 'desc')
            ->get();
    }
}
