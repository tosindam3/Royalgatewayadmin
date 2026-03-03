<?php

namespace App\Services;

use App\Models\AttendanceRecord;
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class AttendanceSummaryService
{
    public function __construct(
        private ?AttendanceScopeService $scopeService = null
    ) {
        $this->scopeService = $this->scopeService ?? app(AttendanceScopeService::class);
    }

    public function getMonthKpis(string $month, array $filters = [], ?\App\Models\User $user = null): array
    {
        $cacheKey = $this->getCacheKey('kpis', $month, $filters, $user?->id);
        
        return Cache::remember($cacheKey, 180, function () use ($month, $filters, $user) {
            $query = AttendanceRecord::forMonth($month);
            $query = $this->applyFilters($query, $filters);
            
            // Apply scope filtering
            if ($user) {
                $query = $this->scopeService->applyScopeToQuery($query, $user);
            }
            
            $records = $query->get();
            
            $employeeQuery = Employee::operational();
            if (!empty($filters['department_id'])) {
                $employeeQuery->where('department_id', $filters['department_id']);
            }
            if (!empty($filters['branch_id'])) {
                $employeeQuery->where('branch_id', $filters['branch_id']);
            }
            
            // Apply scope to employee count
            if ($user) {
                $scope = $this->scopeService->getAccessScope($user);
                if ($scope['scope'] !== 'all') {
                    $employeeQuery->whereIn('id', $scope['employee_ids']);
                }
            }
            
            $totalEmployees = $employeeQuery->count();
            
            $presentDaysTotal = $records->whereIn('status', ['present', 'on_time', 'partial'])->count();
            $absentDaysTotal = $records->where('status', 'absent')->count();
            $lateMinutesTotal = $records->sum('late_minutes');
            $overtimeMinutesTotal = $records->sum('overtime_minutes');
            $workedMinutesTotal = $records->sum(function($r) { return abs($r->work_minutes); });
            
            $sourcesTotal = [
                'app' => $records->where('source', 'mobile')->count() + $records->where('source', 'mobile_app')->count(),
                'device' => $records->where('source', 'biometric')->count() + $records->where('source', 'device')->count(),
                'import' => $records->where('source', 'import')->count() + $records->where('source', 'usb')->count(),
            ];
            
            return [
                'total_employees' => $totalEmployees,
                'present_days_total' => $presentDaysTotal,
                'absent_days_total' => $absentDaysTotal,
                'late_minutes_total' => $lateMinutesTotal,
                'overtime_minutes_total' => $overtimeMinutesTotal,
                'worked_minutes_total' => $workedMinutesTotal,
                'sources_total' => $sourcesTotal,
            ];
        });
    }

    public function getSummaryTable(string $month, array $filters = [], int $page = 1, int $pageSize = 50, ?\App\Models\User $user = null): array
    {
        $cacheKey = $this->getCacheKey('page', $month, $filters, $page, $pageSize, $user?->id);
        
        return Cache::remember($cacheKey, 180, function () use ($month, $filters, $page, $pageSize, $user) {
            $startDate = Carbon::parse($month . '-01');
            $endDate = $startDate->copy()->endOfMonth();
            $workingDays = $startDate->diffInDaysFiltered(function (Carbon $date) {
                return $date->isWeekday();
            }, $endDate) + 1;
            
            $employeeQuery = Employee::operational()
                ->with(['user:id,name', 'department:id,name', 'branch:id,name']);
            
            if (!empty($filters['department_id'])) {
                $employeeQuery->where('department_id', $filters['department_id']);
            }
            if (!empty($filters['branch_id'])) {
                $employeeQuery->where('branch_id', $filters['branch_id']);
            }
            if (!empty($filters['search'])) {
                $search = $filters['search'];
                $employeeQuery->where(function ($q) use ($search) {
                    $q->where('employee_code', 'like', "%{$search}%")
                      ->orWhereHas('user', function ($uq) use ($search) {
                          $uq->where('name', 'like', "%{$search}%");
                      });
                });
            }
            
            // Apply scope filtering
            if ($user) {
                $scope = $this->scopeService->getAccessScope($user);
                if ($scope['scope'] !== 'all') {
                    $employeeQuery->whereIn('id', $scope['employee_ids']);
                }
            }
            
            $employees = $employeeQuery->paginate($pageSize, ['*'], 'page', $page);
            $employeeIds = $employees->pluck('id');
            $records = AttendanceRecord::forMonth($month)
                ->whereIn('employee_id', $employeeIds)
                ->get()
                ->groupBy('employee_id');
            
            $data = $employees->map(function ($employee) use ($records, $workingDays) {
                $empRecords = $records->get($employee->id, collect());
                
                $presentDays = $empRecords->whereIn('status', ['present', 'on_time', 'partial'])->count();
                $absentDays = $empRecords->where('status', 'absent')->count();
                $lateMinutes = $empRecords->sum('late_minutes');
                $overtimeMinutes = $empRecords->sum('overtime_minutes');
                $workedMinutes = $empRecords->sum(function($r) { return abs($r->work_minutes); });
                
                $sources = [
                    'app' => $empRecords->where('source', 'mobile')->count() + $empRecords->where('source', 'mobile_app')->count(),
                    'device' => $empRecords->where('source', 'biometric')->count() + $empRecords->where('source', 'device')->count(),
                    'import' => $empRecords->where('source', 'import')->count() + $empRecords->where('source', 'usb')->count(),
                ];
                
                return [
                    'employee' => [
                        'id' => $employee->id,
                        'name' => $employee->full_name,
                        'staff_id' => $employee->staff_id,
                        'department' => $employee->department->name ?? '—',
                        'branch' => $employee->branch->name ?? '—',
                    ],
                    'working_days' => $workingDays,
                    'present_days' => $presentDays,
                    'absent_days' => $absentDays,
                    'late_minutes' => $lateMinutes,
                    'overtime_minutes' => $overtimeMinutes,
                    'worked_minutes' => $workedMinutes,
                    'sources' => $sources,
                ];
            });
            
            return [
                'data' => $data->values()->all(),
                'meta' => [
                    'page' => $employees->currentPage(),
                    'pageSize' => $employees->perPage(),
                    'total' => $employees->total(),
                    'lastPage' => $employees->lastPage(),
                ],
            ];
        });
    }

    public function getEmployeeMonthDetail(int $employeeId, string $month): array
    {
        $cacheKey = "att:summary:emp:{$employeeId}:{$month}";
        
        return Cache::remember($cacheKey, 180, function () use ($employeeId, $month) {
            $employee = Employee::with(['user', 'department', 'branch'])->findOrFail($employeeId);
            
            $records = AttendanceRecord::forEmployee($employeeId)
                ->forMonth($month)
                ->orderBy('attendance_date')
                ->get();
            
            $workingDays = $records->count();
            $presentDays = $records->whereIn('status', ['present', 'on_time', 'partial'])->count();
            $absentDays = $records->where('status', 'absent')->count();
            $lateMinutes = $records->sum('late_minutes');
            $overtimeMinutes = $records->sum('overtime_minutes');
            $workedMinutes = $records->sum(function($r) { return abs($r->work_minutes); });
            
            $sources = [
                'app' => $records->where('source', 'mobile')->count() + $records->where('source', 'mobile_app')->count(),
                'device' => $records->where('source', 'biometric')->count() + $records->where('source', 'device')->count(),
                'import' => $records->where('source', 'import')->count() + $records->where('source', 'usb')->count(),
            ];
            
            $anomalies = [
                'missing_punches' => $records->filter(function($r) { return $r->check_in_time && !$r->check_out_time; })->count(),
                'geofence_fails' => $records->where('geofence_status', 'outside')->count(),
                'duplicates' => 0,
                'edited' => 0,
            ];
            
            $days = $records->map(function ($record) {
                return [
                    'id' => $record->id,
                    'work_date' => $record->attendance_date->format('Y-m-d'),
                    'status' => $record->status,
                    'shift_name' => 'Default',
                    'clock_in_at' => $record->check_in_time?->toIso8601String(),
                    'clock_out_at' => $record->check_out_time?->toIso8601String(),
                    'worked_minutes' => abs($record->work_minutes),
                    'late_minutes' => $record->late_minutes,
                    'overtime_minutes' => $record->overtime_minutes,
                    'geofence' => [
                        'in' => $record->geofence_status === 'within' ? 'pass' : ($record->geofence_status === 'outside' ? 'fail' : 'na'),
                        'out' => $record->geofence_status === 'within' ? 'pass' : ($record->geofence_status === 'outside' ? 'fail' : 'na'),
                        'zone_in' => null,
                        'zone_out' => null,
                    ],
                    'source' => [
                        'in' => $this->mapSource($record->source),
                        'out' => $this->mapSource($record->source),
                    ],
                    'flags' => [
                        'missing_punch' => $record->check_in_time && !$record->check_out_time,
                        'edited' => false,
                        'duplicate' => false,
                    ],
                    'correction' => [
                        'status' => 'none',
                    ],
                ];
            });
            
            return [
                'employee' => [
                    'id' => $employee->id,
                    'name' => $employee->full_name,
                    'staff_id' => $employee->staff_id,
                    'department' => $employee->department->name ?? '—',
                    'branch' => $employee->branch->name ?? '—',
                ],
                'month' => $month,
                'kpis' => [
                    'working_days' => $workingDays,
                    'present_days' => $presentDays,
                    'absent_days' => $absentDays,
                    'late_minutes' => $lateMinutes,
                    'overtime_minutes' => $overtimeMinutes,
                    'worked_minutes' => $workedMinutes,
                    'sources' => $sources,
                ],
                'anomalies' => $anomalies,
                'days' => $days->values()->all(),
            ];
        });
    }
    
    private function mapSource($source)
    {
        return match($source) {
            'mobile', 'mobile_app' => 'app',
            'biometric', 'device' => 'device',
            'import', 'usb' => 'import',
            default => 'app',
        };
    }

    public function getRecordDetails(int $recordId): array
    {
        $record = AttendanceRecord::with([
            'employee.user',
            'employee.department',
        ])->findOrFail($recordId);
        
        $logs = \App\Models\AttendanceLog::with('geofenceZone')
            ->where('employee_id', $record->employee_id)
            ->whereDate('timestamp', $record->attendance_date)
            ->orderBy('timestamp')
            ->get();
        
        $checkInLog = $logs->where('check_type', 'check_in')->first();
        $checkOutLog = $logs->where('check_type', 'check_out')->first();
        
        $timeline = $logs->map(function ($log) {
            return [
                'type' => $log->check_type,
                'timestamp' => $log->timestamp->toIso8601String(),
                'source' => $log->source,
                'location' => $log->location_lat && $log->location_lng ? [
                    'lat' => (float) $log->location_lat,
                    'lng' => (float) $log->location_lng,
                ] : null,
                'device_id' => $log->device_id,
                'verified' => $log->verified,
            ];
        });
        
        $corrections = collect(); // No corrections in current schema
        
        // Determine geofence status
        $geofenceInStatus = 'na';
        $geofenceInZone = null;
        if ($checkInLog && $checkInLog->geofence_zone_id) {
            $geofenceInStatus = 'pass';
            $geofenceInZone = $checkInLog->geofenceZone ? [
                'id' => $checkInLog->geofenceZone->id,
                'name' => $checkInLog->geofenceZone->name,
            ] : null;
        }
        
        $geofenceOutStatus = 'na';
        $geofenceOutZone = null;
        if ($checkOutLog && $checkOutLog->geofence_zone_id) {
            $geofenceOutStatus = 'pass';
            $geofenceOutZone = $checkOutLog->geofenceZone ? [
                'id' => $checkOutLog->geofenceZone->id,
                'name' => $checkOutLog->geofenceZone->name,
            ] : null;
        }
        
        return [
            'record' => [
                'id' => $record->id,
                'employee' => [
                    'id' => $record->employee->id,
                    'name' => $record->employee->full_name,
                    'staff_id' => $record->employee->staff_id,
                ],
                'work_date' => $record->attendance_date->format('Y-m-d'),
                'status' => $record->status,
                'clock_in_at' => $record->check_in_time?->toIso8601String(),
                'clock_out_at' => $record->check_out_time?->toIso8601String(),
                'worked_minutes' => abs($record->work_minutes),
                'late_minutes' => $record->late_minutes,
                'overtime_minutes' => $record->overtime_minutes,
            ],
            'timeline' => $timeline->values()->all(),
            'geofence' => [
                'in' => [
                    'status' => $geofenceInStatus,
                    'zone' => $geofenceInZone,
                    'reason' => null,
                ],
                'out' => [
                    'status' => $geofenceOutStatus,
                    'zone' => $geofenceOutZone,
                    'reason' => null,
                ],
            ],
            'metadata' => [
                'shift' => 'Default',
                'flags' => [
                    'missing_punch' => $record->check_in_time && !$record->check_out_time,
                    'edited' => false,
                    'duplicate' => false,
                ],
            ],
            'corrections' => $corrections->values()->all(),
        ];
    }
    
    private function applyFilters($query, array $filters)
    {
        if (!empty($filters['department_id'])) {
            $query->whereHas('employee', function ($q) use ($filters) {
                $q->where('department_id', $filters['department_id']);
            });
        }
        
        if (!empty($filters['branch_id'])) {
            $query->whereHas('employee', function ($q) use ($filters) {
                $q->where('branch_id', $filters['branch_id']);
            });
        }
        
        return $query;
    }
    
    private function getCacheKey(string $type, string $month, array $filters = [], ...$extra): string
    {
        $filtersHash = md5(json_encode($filters));
        $extraStr = implode(':', array_filter($extra, fn($v) => $v !== null));
        return "att:summary:{$type}:{$month}:{$filtersHash}" . ($extraStr ? ":{$extraStr}" : '');
    }
    
    public function clearCacheForMonth(string $month): void
    {
        Cache::tags(['attendance_summary', "month:{$month}"])->flush();
    }
}
