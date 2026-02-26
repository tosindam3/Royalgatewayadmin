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
        protected GeofenceService $geo
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
        
        return $this->success(
            $this->attendance->todayStatus($user->employeeProfile->id),
            'Today\'s attendance status.'
        );
    }

    /**
     * Get user's attendance access scope
     */
    public function getScope(Request $request)
    {
        $user = $request->user();
        $scope = app(\App\Services\AttendanceScopeService::class)->getAccessScope($user);
        
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

        $logs = isset($data['start_date']) && isset($data['end_date'])
            ? $this->attendance->getDateRangeLogs($employeeId, $data['start_date'], $data['end_date'])
            : $this->attendance->getRecentLogs($employeeId, $data['limit'] ?? 30);

        return $this->success($logs, 'Attendance history retrieved.');
    }

    public function liveAttendance()
    {
        $today = now()->toDateString();

        $logs = \App\Models\AttendanceLog::with(['employee' => function ($q) {
            $q->with('user:id,name');
        }])
            ->whereDate('timestamp', $today)
            ->get()
            ->groupBy('employee_id')
            ->map(function ($entries) {
                $checkIn  = $entries->firstWhere('check_type', 'check_in');
                $checkOut = $entries->firstWhere('check_type', 'check_out');
                $emp = $checkIn?->employee ?? $checkOut?->employee;

                return [
                    'id'            => $checkIn?->id ?? $checkOut?->id,
                    'employee_id'   => $emp?->id,
                    'employee_name' => $emp?->user?->name ?? 'Unknown',
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

    public function overview()
    {
        $today = now()->toDateString();
        $totalEmployees = \App\Models\Employee::where('status', 'active')->count();

        $todayLogs = \App\Models\AttendanceLog::whereDate('timestamp', $today)->get();
        $presentIds = $todayLogs->where('check_type', 'check_in')->pluck('employee_id')->unique();
        $lateIds    = $todayLogs->where('check_type', 'check_in')->where('status', 'late')->pluck('employee_id')->unique();

        $present  = $presentIds->count();
        $late     = $lateIds->count();
        $absent   = max(0, $totalEmployees - $present);
        $onLeave  = 0; // extend when leave module is wired

        // 7-day trend
        $weeklyTrend = collect(range(6, 0))->map(function ($daysAgo) {
            $date = now()->subDays($daysAgo)->toDateString();
            $checkIns = \App\Models\AttendanceLog::whereDate('timestamp', $date)
                ->where('check_type', 'check_in')
                ->count();
            return ['date' => $date, 'present' => $checkIns];
        });

        return $this->success([
            'todayPresent'  => $present,
            'todayAbsent'   => $absent,
            'todayLate'     => $late,
            'todayOnLeave'  => $onLeave,
            'totalEmployees' => $totalEmployees,
            'weeklyTrend'   => $weeklyTrend,
        ], 'Attendance overview retrieved.');
    }

    public function dailySummary(Request $request)
    {
        $date = $request->get('date', now()->toDateString());
        $totalEmployees = \App\Models\Employee::where('status', 'active')->count();

        $logs = \App\Models\AttendanceLog::with(['employee' => function ($q) {
            $q->with(['user:id,name', 'department:id,name']);
        }])
            ->whereDate('timestamp', $date)
            ->get()
            ->groupBy('employee_id');

        $records = $logs->map(function ($entries) {
            $checkIn  = $entries->firstWhere('check_type', 'check_in');
            $checkOut = $entries->firstWhere('check_type', 'check_out');
            $emp = $checkIn?->employee ?? $checkOut?->employee;

            $durationMinutes = ($checkIn && $checkOut)
                ? $checkOut->timestamp->diffInMinutes($checkIn->timestamp)
                : null;

            // Determine status based on check-in/out
            $status = 'absent';
            if ($checkIn && $checkOut) {
                $status = 'present';
            } elseif ($checkIn) {
                $status = 'partial'; // Checked in but not out
            }

            return [
                'id'            => $checkIn?->id ?? $checkOut?->id,
                'employee_id'   => $emp?->id,
                'employee_name' => $emp?->user?->name ?? 'Unknown',
                'department'    => $emp?->department?->name ?? '—',
                'check_in'      => $checkIn?->timestamp?->format('H:i:s'),
                'check_out'     => $checkOut?->timestamp?->format('H:i:s'),
                'hours'         => $durationMinutes !== null
                    ? round($durationMinutes / 60, 1) . 'h'
                    : null,
                'status'        => $status,
                'source'        => $checkIn?->source ?? $checkOut?->source,
            ];
        })->values();

        // Count present (includes partial - checked in but not out)
        $present = $records->whereIn('status', ['present', 'partial'])->count();
        $late = 0; // Late calculation would need time comparison

        return $this->success([
            'date'           => $date,
            'totalEmployees' => $totalEmployees,
            'present'        => $present,
            'absent'         => max(0, $totalEmployees - $present),
            'late'           => $late,
            'onLeave'        => 0,
            'records'        => $records,
        ], 'Daily summary retrieved.');
    }

    public function overtime(Request $request)
    {
        $startDate = $request->get('start_date', now()->startOfMonth()->toDateString());
        $endDate   = $request->get('end_date', now()->toDateString());

        $logs = \App\Models\AttendanceLog::with(['employee' => function ($q) {
            $q->with(['user:id,name', 'workSchedule']);
        }])
            ->whereBetween(\DB::raw('DATE(timestamp)'), [$startDate, $endDate])
            ->get()
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
                'employee_name'  => $emp?->user?->name ?? 'Unknown',
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
        return $this->success([
            'geofencing_enabled' => true,
            'ip_restriction_enabled' => true,
            'biometric_sync_enabled' => true,
            'late_grace_period' => 15,
        ], 'Attendance settings retrieved.');
    }

    public function getGeofences(Request $request)
    {
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
