<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\AttendanceService;
use App\Services\GeofenceService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AttendanceService $attendance,
        protected GeofenceService $geo,
        protected \App\Services\AttendanceScopeService $scopeService
    ) {}

    public function checkIn(Request $request)
    {
        $data = $request->validate([
            'latitude'  => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'photo'     => 'nullable|image|max:2048',
        ]);

        $user = $request->user()->load(['employeeProfile.workplace']);
        $emp = $user->employeeProfile;

        if (!$emp) {
            return $this->error('Employee profile not found.', 404);
        }

        if (!$emp->allow_mobile_checkin) {
            return $this->error('Mobile check-in not permitted for your account.', 403);
        }

        $status = $this->attendance->todayStatus($emp->id);
        if ($status['checked_in']) {
            return $this->error('Already checked in today.', 400);
        }

        $geofenceZoneId = null;
        $hasLatLng = isset($data['latitude']) && isset($data['longitude'])
            && $data['latitude'] !== null && $data['longitude'] !== null;

        if ($hasLatLng) {
            // 1. Try matching against specific geofence zones
            $zone = $this->geo->findMatchingZone($data['latitude'], $data['longitude'], $emp->branch_id);

            if ($zone) {
                $geofenceZoneId = $zone->id;
            } else {
                // 2. Count total active geofences to decide if enforcement is active
                $activeZoneCount = \App\Models\GeofenceZone::where('is_active', true)->count();

                if ($activeZoneCount > 0) {
                    // Geofences are configured but employee is outside all of them
                    return $this->error('Outside permitted operations zone. Please check in from an authorised location.', 422);
                }

                // 3. Fallback: if a workplace is assigned, validate its radius
                if ($emp->workplace) {
                    $wp = $emp->workplace;
                    if (!$this->geo->within(
                        $data['latitude'],
                        $data['longitude'],
                        $wp->latitude,
                        $wp->longitude,
                        $wp->radius_meters
                    )) {
                        return $this->error('Outside permitted workplace radius.', 422);
                    }
                }
                // No zones configured and no workplace — allow check-in freely
            }
        }

        $requestData = $request->validate([
            'latitude'  => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'accuracy'  => 'nullable|numeric',
            'source'    => 'nullable|string',
            'photo'     => 'nullable|image|max:2048',
        ]);

        $log = $this->attendance->logAttendance([
            'employee_id' => $emp->id, // Use employee ID
            'check_type'  => 'check_in',
            'timestamp'   => now(),
            'source'      => $requestData['source'] ?? 'web_app',
            'location_lat' => $requestData['latitude'] ?? null,
            'location_lng' => $requestData['longitude'] ?? null,
            'geofence_zone_id' => $geofenceZoneId,
            'photo_url'   => $request->hasFile('photo')
                ? $request->file('photo')->store('attendance_photos', 'public')
                : null,
            'verified'    => true,
            'sync_status' => 'synced',
        ]);

        // Auto-aggregate attendance record for today
        try {
            app(\App\Services\AttendanceRecordAggregator::class)
                ->aggregateEmployeeDate($emp->id, now()->toDateString());
        } catch (\Exception $e) {
            \Log::warning('Failed to auto-aggregate after check-in: ' . $e->getMessage());
        }

        return $this->success('Checked in successfully.', $log, 201);
    }

    public function checkOut(Request $request)
    {
        $data = $request->validate([
            'latitude'  => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'photo'     => 'nullable|image|max:2048',
        ]);

        $requestData = $request->validate([
            'latitude'  => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'accuracy'  => 'nullable|numeric',
            'source'    => 'nullable|string',
            'photo'     => 'nullable|image|max:2048',
        ]);

        $user = $request->user()->load('employeeProfile');
        $emp = $user->employeeProfile;

        if (!$emp) {
            return $this->error('Employee profile not found.', 404);
        }

        $status = $this->attendance->todayStatus($emp->id); // Use employee ID

        if (!$status['checked_in']) {
            return $this->error('No check-in found for today.', 400);
        }
        if ($status['checked_out']) {
            return $this->error('Already checked out today.', 400);
        }

        $log = $this->attendance->logAttendance([
            'employee_id' => $emp->id, // Use employee ID
            'check_type'  => 'check_out',
            'timestamp'   => now(),
            'source'      => $requestData['source'] ?? 'web_app',
            'location_lat' => $requestData['latitude'] ?? null,
            'location_lng' => $requestData['longitude'] ?? null,
            'status'      => $this->calculateCheckoutStatus($emp, now()),
            'photo_url'   => $request->hasFile('photo')
                ? $request->file('photo')->store('attendance_photos', 'public')
                : null,
            'verified'    => true,
            'sync_status' => 'synced',
        ]);

        // Auto-aggregate attendance record for today
        try {
            app(\App\Services\AttendanceRecordAggregator::class)
                ->aggregateEmployeeDate($emp->id, now()->toDateString());
        } catch (\Exception $e) {
            \Log::warning('Failed to auto-aggregate after check-out: ' . $e->getMessage());
        }

        return $this->success('Checked out successfully.', $log, 201);
    }

    public function today(Request $request)
    {
        $user = $request->user()->load('employeeProfile');
        if (!$user->employeeProfile) {
            return $this->error('Employee profile not found.', 404);
        }
        
        $employeeId = $user->employeeProfile->id;
        $status = $this->attendance->todayStatus($employeeId);
        
        // Get today's attendance record for work hours calculation
        $todayRecord = \App\Models\AttendanceRecord::where('employee_id', $employeeId)
            ->whereDate('attendance_date', now()->toDateString())
            ->first();
        
        // Get organization work hours setting
        $workHoursPerDay = \App\Models\OrganizationSetting::where('key', 'attendance.work_hours_per_day')
            ->value('value');
        $requiredMinutes = $workHoursPerDay ? (int)json_decode($workHoursPerDay) * 60 : 480; // Default 8 hours
        
        // Calculate worked hours and completion status
        $workedMinutes = $todayRecord ? abs($todayRecord->work_minutes) : 0;
        $workedHours = round($workedMinutes / 60, 2);
        $completionStatus = 'incomplete'; // not checked in
        
        if ($status['checked_in']) {
            if ($status['checked_out']) {
                // Both check-in and check-out exist
                if ($workedMinutes >= $requiredMinutes) {
                    $completionStatus = 'complete'; // Green - fulfilled working hours
                } else {
                    $completionStatus = 'partial'; // Yellow - checked out but didn't fulfill hours
                }
            } else {
                // Only checked in, still working
                $completionStatus = 'working'; // Blue - currently working
            }
        }
        
        $status['worked_hours'] = $workedHours;
        $status['worked_minutes'] = $workedMinutes;
        $status['required_minutes'] = $requiredMinutes;
        $status['completion_status'] = $completionStatus;
        $status['late_minutes'] = $todayRecord?->late_minutes ?? 0;
        
        return $this->success($status, 'Today\'s attendance status.');
    }

    /**
     * Get user's attendance access scope
     */
    public function getScope(Request $request)
    {
        $user = $request->user();
        $scope = $this->scopeService->getAccessScope($user);
        
        return $this->success($scope, 'Access scope retrieved.');
    }

    public function history(Request $request)
    {
        $data = $request->validate([
            'start_date' => 'nullable|date',
            'end_date'   => 'nullable|date|after_or_equal:start_date',
            'limit'      => 'nullable|integer|min:1|max:100',
        ]);

        $user = $request->user()->load('employeeProfile');
        $employeeId = $user->employeeProfile?->id;

        if (!$employeeId) {
            return $this->error('Employee profile not found.', 404);
        }

        // Return attendance records instead of logs for better data
        if (isset($data['start_date']) && isset($data['end_date'])) {
            $records = \App\Models\AttendanceRecord::where('employee_id', $employeeId)
                ->whereBetween('attendance_date', [$data['start_date'], $data['end_date']])
                ->orderBy('attendance_date', 'desc')
                ->get()
                ->map(function($record) {
                    return [
                        'id' => $record->id,
                        'date' => $record->attendance_date->format('Y-m-d'),
                        'check_in_time' => $record->check_in_time?->toIso8601String(),
                        'check_out_time' => $record->check_out_time?->toIso8601String(),
                        'worked_minutes' => abs($record->work_minutes),
                        'worked_hours' => round(abs($record->work_minutes) / 60, 2),
                        'late_minutes' => $record->late_minutes,
                        'status' => $record->status,
                        'source' => $record->source,
                    ];
                });
            
            return $this->success($records, 'Attendance history retrieved.');
        }

        // Fallback to logs for recent history
        $logs = $this->attendance->getRecentLogs($employeeId, $data['limit'] ?? 30);
        return $this->success($logs, 'Attendance history retrieved.');
    }

    public function liveAttendance(Request $request)
    {
        $today = now()->toDateString();
        $user = $request->user();

        $query = \App\Models\AttendanceLog::with(['employee' => function ($q) {
            $q->with('user:id,name');
        }])
            ->whereDate('timestamp', $today);
            
        // Apply Scoping
        $query = $this->scopeService->applyScopeToQuery($query, $user);

        $logs = $query->get()
            ->groupBy('employee_id')
            ->map(function ($entries) {
                $checkIn  = $entries->firstWhere('check_type', 'check_in');
                $checkOut = $entries->firstWhere('check_type', 'check_out');
                $emp = $checkIn?->employee ?? $checkOut?->employee;

                return [
                    'id'            => $checkIn?->id ?? $checkOut?->id,
                    'employee_id'   => $emp?->id,
                    'employee_name' => $emp?->full_name ?? 'Unknown',
                    'status'        => $checkOut ? 'checked_out' : ($checkIn ? 'present' : 'absent'),
                    'check_in'      => $checkIn?->timestamp?->format('H:i:s'),
                    'check_out'     => $checkOut?->timestamp?->format('H:i:s'),
                    'duration'      => ($checkIn && $checkOut)
                        ? gmdate('H:i', $checkOut->timestamp->diffInSeconds($checkIn->timestamp))
                        : null,
                    'source'        => $checkIn?->source,
                ];
            })
            ->values();

        return $this->success($logs, 'Live attendance retrieved.');
    }

    public function overview(Request $request)
    {
        $today = now()->toDateString();
        $user = $request->user();
        
        // Scope employees count
        $accessibleEmployees = $this->scopeService->getAccessibleEmployees($user);
        $totalEmployees = $accessibleEmployees->count();
        $employeeIds = $accessibleEmployees->pluck('id');

        // Use AttendanceRecord for accurate data instead of logs
        $todayRecords = \App\Models\AttendanceRecord::with('employee')
            ->whereDate('attendance_date', $today)
            ->whereIn('employee_id', $employeeIds)
            ->get();
        
        $present = $todayRecords->whereIn('status', ['present', 'partial'])->count();
        $late = $todayRecords->where('late_minutes', '>', 0)->count();
        $absent = max(0, $totalEmployees - $present);
        $onLeave = 0; // extend when leave module is wired

        // 7-day trend using attendance records
        $weeklyTrend = collect(range(6, 0))->map(function ($daysAgo) use ($employeeIds) {
            $date = now()->subDays($daysAgo)->toDateString();
            $presentCount = \App\Models\AttendanceRecord::whereDate('attendance_date', $date)
                ->whereIn('employee_id', $employeeIds)
                ->whereIn('status', ['present', 'partial'])
                ->count();
            return ['date' => $date, 'present' => $presentCount];
        });
        
        // Late arrivals details for the card
        $lateArrivals = $todayRecords->where('late_minutes', '>', 0)->map(function($record) {
            return [
                'employee_id' => $record->employee_id,
                'employee_name' => $record->employee->full_name ?? 'Unknown',
                'late_minutes' => $record->late_minutes,
                'check_in_time' => $record->check_in_time?->format('H:i:s'),
            ];
        })->values();

        return $this->success([
            'todayPresent'  => $present,
            'todayAbsent'   => $absent,
            'todayLate'     => $late,
            'todayOnLeave'  => $onLeave,
            'totalEmployees' => $totalEmployees,
            'weeklyTrend'   => $weeklyTrend,
            'lateArrivals'  => $lateArrivals,
        ], 'Attendance overview retrieved.');
    }

    public function dailySummary(Request $request)
    {
        $date = $request->get('date', now()->toDateString());
        $user = $request->user();
        
        $accessibleEmployees = $this->scopeService->getAccessibleEmployees($user);
        $totalEmployees = $accessibleEmployees->count();
        $employeeIds = $accessibleEmployees->pluck('id');

        // Use AttendanceRecord for accurate aggregated data
        $attendanceRecords = \App\Models\AttendanceRecord::with(['employee' => function ($q) {
            $q->with(['user:id,name', 'department:id,name']);
        }])
            ->whereDate('attendance_date', $date)
            ->whereIn('employee_id', $employeeIds)
            ->get();

        $records = $attendanceRecords->map(function ($record) {
            $workedMinutes = abs($record->work_minutes);
            
            return [
                'id'            => $record->id,
                'employee_id'   => $record->employee_id,
                'employee_name' => $record->employee->full_name ?? 'Unknown',
                'department'    => $record->employee->department?->name ?? '—',
                'check_in'      => $record->check_in_time?->format('H:i:s'),
                'check_out'     => $record->check_out_time?->format('H:i:s'),
                'hours'         => $workedMinutes > 0 ? round($workedMinutes / 60, 1) . 'h' : '0h',
                'worked_minutes' => $workedMinutes,
                'late_minutes'  => $record->late_minutes,
                'status'        => $record->status,
                'source'        => $record->source,
            ];
        })->values();

        $present = $attendanceRecords->whereIn('status', ['present', 'partial'])->count();
        $late = $attendanceRecords->where('late_minutes', '>', 0)->count();
        $absent = max(0, $totalEmployees - $present);

        return $this->success([
            'date'           => $date,
            'totalEmployees' => $totalEmployees,
            'present'        => $present,
            'absent'         => $absent,
            'late'           => $late,
            'onLeave'        => 0,
            'records'        => $records,
        ], 'Daily summary retrieved.');
    }

    public function overtime(Request $request)
    {
        $startDate = $request->get('start_date', now()->startOfMonth()->toDateString());
        $endDate   = $request->get('end_date', now()->toDateString());
        $user = $request->user();

        $query = \App\Models\AttendanceLog::with(['employee' => function ($q) {
            $q->with(['user:id,name', 'workSchedule']);
        }])
            ->whereBetween(\DB::raw('DATE(timestamp)'), [$startDate, $endDate]);
            
        $query = $this->scopeService->applyScopeToQuery($query, $user);

        $logs = $query->get()
            ->groupBy(fn($l) => $l->employee_id . '_' . $l->timestamp->toDateString());

        $results = [];
        foreach ($logs as $key => $entries) {
            $checkIn  = $entries->firstWhere('check_type', 'check_in');
            $checkOut = $entries->firstWhere('check_type', 'check_out');
            if (!$checkIn || !$checkOut) continue;

            $emp = $checkIn->employee;
            $schedule = $emp?->workSchedule;
            $scheduledHours = $schedule ? (strtotime($schedule->check_out_time) - strtotime($schedule->check_in_time)) / 3600 : 8;
            $workedMinutes  = $checkOut->timestamp->diffInMinutes($checkIn->timestamp);
            $workedHours    = round($workedMinutes / 60, 2);
            $overtimeHours  = max(0, round($workedHours - $scheduledHours, 2));

            if ($overtimeHours <= 0) continue;

            $results[] = [
                'id'             => $checkIn->id,
                'employee_id'    => $emp?->id,
                'employee_name'  => $emp?->full_name ?? 'Unknown',
                'date'           => $checkIn->timestamp->toDateString(),
                'regular_hours'  => $scheduledHours,
                'overtime_hours' => $overtimeHours,
                'status'         => 'pending',
            ];
        }

        return $this->success($results, 'Overtime records retrieved.');
    }

    public function getSettings()
    {
        $user = request()->user();
        $scopeService = app(\App\Services\AttendanceScopeService::class);
        
        $canManage = $scopeService->canManageSettings($user);

        // Fetch all attendance relevant settings
        $settings = \App\Models\OrganizationSetting::where('key', 'like', 'attendance.%')->get();
        
        $data = [
            'can_manage' => $canManage,
            'settings' => $settings->mapWithKeys(function($item) {
                return [$item->key => json_decode($item->value)];
            }),
            // Keep legacy keys for frontend compatibility if needed
            'late_grace_period' => (int) json_decode($settings->firstWhere('key', 'attendance.grace_period_minutes')?->value ?? '15'),
        ];
        
        return $this->success($data, 'Attendance settings retrieved.');
    }

    public function updateSettings(Request $request)
    {
        $user = $request->user();
        $scopeService = app(\App\Services\AttendanceScopeService::class);
        
        if (!$scopeService->canManageSettings($user)) {
            return $this->error('Unauthorized to manage settings.', 403);
        }

        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*' => 'nullable' // Values can be mixed types
        ]);

        foreach ($validated['settings'] as $key => $value) {
            // Only allow updating attendance keys for security
            if (!str_starts_with($key, 'attendance.')) continue;

            \App\Models\OrganizationSetting::updateOrCreate(
                ['key' => $key],
                ['value' => json_encode($value)]
            );
        }

        return $this->success(null, 'Attendance settings updated successfully.');
    }

    public function getGeofences(Request $request)
    {
        $user = $request->user();
        $scopeService = app(\App\Services\AttendanceScopeService::class);
        
        // Return empty array for employees
        if (!$scopeService->canManageSettings($user)) {
            return $this->success([], 'Geofence zones retrieved.');
        }
        
        $query = \App\Models\GeofenceZone::query();

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        $zones = $query->with('branch')->orderBy('name')->get();

        return $this->success($zones, 'Geofence zones retrieved.');
    }

    public function storeGeofence(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'branch_id' => 'nullable|exists:branches,id',
            'geometry_type' => 'required|in:circle,polygon',
            'geometry' => 'nullable|array',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'radius' => 'required|integer|min:10|max:10000',
            'is_active' => 'boolean',
            'is_strict' => 'boolean',
            'allow_web' => 'boolean',
            'allow_app' => 'boolean',
            'description' => 'nullable|string|max:500',
        ]);

        $zone = \App\Models\GeofenceZone::create($validated);

        return $this->success($zone->load('branch'), 'Geofence zone created successfully.', 201);
    }

    public function updateGeofence(Request $request, $id)
    {
        $zone = \App\Models\GeofenceZone::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'branch_id' => 'nullable|exists:branches,id',
            'geometry_type' => 'sometimes|in:circle,polygon',
            'geometry' => 'nullable|array',
            'latitude' => 'sometimes|numeric|between:-90,90',
            'longitude' => 'sometimes|numeric|between:-180,180',
            'radius' => 'sometimes|integer|min:10|max:10000',
            'is_active' => 'boolean',
            'is_strict' => 'boolean',
            'allow_web' => 'boolean',
            'allow_app' => 'boolean',
            'description' => 'nullable|string|max:500',
        ]);

        $zone->update($validated);

        return $this->success($zone->fresh()->load('branch'), 'Geofence zone updated successfully.');
    }

    public function destroyGeofence($id)
    {
        $zone = \App\Models\GeofenceZone::findOrFail($id);
        $zone->delete();

        return $this->success(null, 'Geofence zone deleted successfully.');
    }

    public function getIPWhitelist()
    {
        $user = request()->user();
        
        // Check if user can manage settings
        if (!$this->scopeService->canManageSettings($user)) {
            return $this->success([], 'IP whitelist retrieved.');
        }
        
        return $this->success([], 'IP whitelist retrieved.');
    }

    public function getMyIP(Request $request)
    {
        return $this->success(['ip' => $request->ip()], 'IP address detected.');
    }

    private function calculateCheckoutStatus($emp, $now)
    {
        $employee = \App\Models\Employee::with('workSchedule')->find($emp->id);
        if ($employee && $employee->workSchedule) {
            $schedule = $employee->workSchedule;
            $punchTime = \Carbon\Carbon::parse($now);
            $scheduleTime = \Carbon\Carbon::createFromFormat('H:i:s', $schedule->check_out_time);
            
            // Adjust schedule time to today
            $scheduleTime->setDate($punchTime->year, $punchTime->month, $punchTime->day);
            
            if ($punchTime->lt($scheduleTime)) {
                return 'early_exit';
            }
        }
        return 'on_time';
    }

    public function auditLogs()
    {
        return $this->success([], 'Audit logs retrieved.');
    }
}
