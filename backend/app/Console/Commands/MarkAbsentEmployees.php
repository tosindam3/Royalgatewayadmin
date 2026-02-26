<?php

namespace App\Console\Commands;

use App\Models\AttendanceLog;
use App\Models\AttendanceRecord;
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Console\Command;

class MarkAbsentEmployees extends Command
{
    protected $signature = 'attendance:mark-absent 
                            {--date= : Specific date to process (YYYY-MM-DD, defaults to yesterday)}';

    protected $description = 'Mark employees as absent if they have no attendance logs for the day';

    public function handle(): int
    {
        $date = $this->option('date') ?? Carbon::yesterday()->toDateString();
        
        $this->info("Processing absences for: {$date}");

        // Get all active employees
        $activeEmployees = Employee::where('status', 'active')
            ->whereNotNull('branch_id')
            ->whereHas('user')
            ->get();

        $this->info("Found {$activeEmployees->count()} active employees");

        // Get employees who clocked in on this date
        $presentEmployeeIds = AttendanceLog::whereDate('timestamp', $date)
            ->where('check_type', 'check_in')
            ->distinct()
            ->pluck('employee_id')
            ->toArray();

        $this->info("Employees with check-ins: " . count($presentEmployeeIds));

        $absentCount = 0;

        foreach ($activeEmployees as $employee) {
            // Skip if employee already has a record for this date
            $existingRecord = AttendanceRecord::where('employee_id', $employee->user_id)
                ->whereDate('attendance_date', $date)
                ->first();

            if ($existingRecord) {
                continue;
            }

            // If employee didn't clock in, mark as absent
            if (!in_array($employee->user_id, $presentEmployeeIds)) {
                AttendanceRecord::create([
                    'employee_id' => $employee->user_id,
                    'attendance_date' => $date,
                    'check_in_time' => null,
                    'check_out_time' => null,
                    'work_minutes' => 0,
                    'late_minutes' => 0,
                    'overtime_minutes' => 0,
                    'break_minutes' => 0,
                    'source' => 'system',
                    'status' => 'absent',
                    'branch_id' => $employee->branch_id,
                    'department_id' => $employee->department_id,
                    'geofence_status' => 'na',
                ]);

                $absentCount++;
                $this->line("  ✓ Marked absent: {$employee->user->name}");
            }
        }

        $this->info("\n✅ Marked {$absentCount} employees as absent");

        return Command::SUCCESS;
    }
}
