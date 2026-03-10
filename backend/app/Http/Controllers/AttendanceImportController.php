<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use App\Models\Employee;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class AttendanceImportController extends Controller
{
    use ApiResponse;

    /**
     * Import attendance records from CSV/Excel file
     * POST /api/v1/attendance/import
     */
    public function import(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:csv,txt,xlsx,xls,dat|max:10240', // 10MB max
            'source' => 'nullable|string|in:usb,device,manual',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        try {
            $file = $request->file('file');
            $source = $request->input('source', 'import');
            
            // Parse file based on extension
            $extension = $file->getClientOriginalExtension();
            $records = $this->parseFile($file, $extension);

            if (empty($records)) {
                return $this->error('No valid records found in file', 422);
            }

            // Validate and import records
            $result = $this->importRecords($records, $source);

            return $this->success('Import completed successfully', $result);

        } catch (\Exception $e) {
            Log::error('Attendance import failed: ' . $e->getMessage(), [
                'file' => $file->getClientOriginalName() ?? 'unknown',
                'trace' => $e->getTraceAsString()
            ]);

            return $this->error('Import failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Parse file based on extension
     */
    private function parseFile($file, string $extension): array
    {
        $path = $file->getRealPath();

        switch (strtolower($extension)) {
            case 'csv':
            case 'txt':
            case 'dat':
                return $this->parseCSV($path);
            
            case 'xlsx':
            case 'xls':
                return $this->parseExcel($path);
            
            default:
                throw new \Exception('Unsupported file format');
        }
    }

    /**
     * Parse CSV file
     */
    private function parseCSV(string $path): array
    {
        $records = [];
        $handle = fopen($path, 'r');
        
        if ($handle === false) {
            throw new \Exception('Could not open file');
        }

        // Read header row
        $header = fgetcsv($handle);
        if ($header === false) {
            fclose($handle);
            throw new \Exception('Empty file or invalid format');
        }

        // Normalize header names
        $header = array_map(function($col) {
            return strtolower(trim($col));
        }, $header);

        // Map common column names
        $columnMap = $this->getColumnMapping($header);

        // Read data rows
        $rowNumber = 1;
        while (($row = fgetcsv($handle)) !== false) {
            $rowNumber++;
            
            if (count($row) !== count($header)) {
                Log::warning("Row {$rowNumber}: Column count mismatch");
                continue;
            }

            $data = array_combine($header, $row);
            $record = $this->mapRowToRecord($data, $columnMap, $rowNumber);
            
            if ($record) {
                $records[] = $record;
            }
        }

        fclose($handle);
        return $records;
    }

    /**
     * Parse Excel file (basic implementation)
     * For production, use PhpSpreadsheet library
     */
    private function parseExcel(string $path): array
    {
        // TODO: Implement Excel parsing with PhpSpreadsheet
        // For now, return error message
        throw new \Exception('Excel import requires PhpSpreadsheet library. Please convert to CSV format.');
    }

    /**
     * Get column mapping from header
     */
    private function getColumnMapping(array $header): array
    {
        $map = [
            'employee_id' => null,
            'employee_code' => null,
            'staff_id' => null,
            'date' => null,
            'check_in' => null,
            'check_out' => null,
        ];

        foreach ($header as $index => $col) {
            // Employee ID variations
            if (in_array($col, ['employee_id', 'emp_id', 'employeeid', 'employee id'])) {
                $map['employee_id'] = $index;
            }
            // Employee Code variations
            if (in_array($col, ['employee_code', 'emp_code', 'staff_id', 'staff id', 'code'])) {
                $map['employee_code'] = $index;
            }
            // Date variations
            if (in_array($col, ['date', 'attendance_date', 'work_date', 'day'])) {
                $map['date'] = $index;
            }
            // Check-in variations
            if (in_array($col, ['check_in', 'checkin', 'check_in_time', 'in_time', 'clock_in'])) {
                $map['check_in'] = $index;
            }
            // Check-out variations
            if (in_array($col, ['check_out', 'checkout', 'check_out_time', 'out_time', 'clock_out'])) {
                $map['check_out'] = $index;
            }
        }

        return $map;
    }

    /**
     * Map CSV row to attendance record
     */
    private function mapRowToRecord(array $data, array $columnMap, int $rowNumber): ?array
    {
        try {
            $values = array_values($data);

            // Get employee identifier
            $employeeCode = null;
            if ($columnMap['employee_code'] !== null) {
                $employeeCode = trim($values[$columnMap['employee_code']] ?? '');
            } elseif ($columnMap['employee_id'] !== null) {
                $employeeCode = trim($values[$columnMap['employee_id']] ?? '');
            }

            if (empty($employeeCode)) {
                Log::warning("Row {$rowNumber}: Missing employee identifier");
                return null;
            }

            // Get date
            $dateValue = $columnMap['date'] !== null ? trim($values[$columnMap['date']] ?? '') : '';
            if (empty($dateValue)) {
                Log::warning("Row {$rowNumber}: Missing date");
                return null;
            }

            // Parse date
            $date = $this->parseDate($dateValue);
            if (!$date) {
                Log::warning("Row {$rowNumber}: Invalid date format: {$dateValue}");
                return null;
            }

            // Get times
            $checkIn = $columnMap['check_in'] !== null ? trim($values[$columnMap['check_in']] ?? '') : null;
            $checkOut = $columnMap['check_out'] !== null ? trim($values[$columnMap['check_out']] ?? '') : null;

            return [
                'employee_code' => $employeeCode,
                'date' => $date,
                'check_in' => $checkIn,
                'check_out' => $checkOut,
                'row_number' => $rowNumber,
            ];

        } catch (\Exception $e) {
            Log::warning("Row {$rowNumber}: Error mapping record - " . $e->getMessage());
            return null;
        }
    }

    /**
     * Parse date from various formats
     */
    private function parseDate(string $dateValue): ?string
    {
        $formats = [
            'Y-m-d',
            'd/m/Y',
            'm/d/Y',
            'd-m-Y',
            'm-d-Y',
            'Y/m/d',
            'd.m.Y',
        ];

        foreach ($formats as $format) {
            try {
                $date = Carbon::createFromFormat($format, $dateValue);
                if ($date) {
                    return $date->format('Y-m-d');
                }
            } catch (\Exception $e) {
                continue;
            }
        }

        return null;
    }

    /**
     * Import records into database
     */
    private function importRecords(array $records, string $source): array
    {
        $stats = [
            'total' => count($records),
            'imported' => 0,
            'updated' => 0,
            'skipped' => 0,
            'errors' => [],
        ];

        // Get all employees for mapping
        $employees = Employee::pluck('id', 'employee_code')->toArray();

        DB::beginTransaction();
        try {
            foreach ($records as $record) {
                $employeeId = $employees[$record['employee_code']] ?? null;

                if (!$employeeId) {
                    $stats['skipped']++;
                    $stats['errors'][] = "Row {$record['row_number']}: Employee '{$record['employee_code']}' not found";
                    continue;
                }

                // Get employee details for branch/department
                $employee = Employee::find($employeeId);

                // Parse times
                $checkInTime = $this->parseDateTime($record['date'], $record['check_in']);
                $checkOutTime = $this->parseDateTime($record['date'], $record['check_out']);

                // Calculate work minutes
                $workMinutes = 0;
                $lateMinutes = 0;
                $overtimeMinutes = 0;

                if ($checkInTime && $checkOutTime) {
                    $workMinutes = $checkInTime->diffInMinutes($checkOutTime);
                    
                    // Calculate late (assuming 9:00 AM start)
                    $expectedStart = Carbon::parse($record['date'] . ' 09:00:00');
                    if ($checkInTime->gt($expectedStart)) {
                        $lateMinutes = $expectedStart->diffInMinutes($checkInTime);
                    }

                    // Calculate overtime (assuming 5:00 PM end)
                    $expectedEnd = Carbon::parse($record['date'] . ' 17:00:00');
                    if ($checkOutTime->gt($expectedEnd)) {
                        $overtimeMinutes = $expectedEnd->diffInMinutes($checkOutTime);
                    }
                }

                // Determine status
                $status = 'present';
                if (!$checkInTime && !$checkOutTime) {
                    $status = 'absent';
                } elseif (!$checkInTime || !$checkOutTime) {
                    $status = 'incomplete';
                }

                // Create or update record
                $attendanceData = [
                    'employee_id' => $employeeId,
                    'attendance_date' => $record['date'],
                    'check_in_time' => $checkInTime,
                    'check_out_time' => $checkOutTime,
                    'work_minutes' => $workMinutes,
                    'late_minutes' => $lateMinutes,
                    'overtime_minutes' => $overtimeMinutes,
                    'status' => $status,
                    'source' => $source,
                    'branch_id' => $employee->branch_id,
                    'department_id' => $employee->department_id,
                    'approval_status' => 'approved',
                ];

                $existing = AttendanceRecord::where('employee_id', $employeeId)
                    ->where('attendance_date', $record['date'])
                    ->first();

                if ($existing) {
                    $existing->update($attendanceData);
                    $stats['updated']++;
                } else {
                    AttendanceRecord::create($attendanceData);
                    $stats['imported']++;
                }
            }

            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return $stats;
    }

    /**
     * Parse date and time into Carbon instance
     */
    private function parseDateTime(string $date, ?string $time): ?Carbon
    {
        if (empty($time)) {
            return null;
        }

        try {
            return Carbon::parse($date . ' ' . $time);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Get import history
     * GET /api/v1/attendance/import/history
     */
    public function history(Request $request)
    {
        // This would typically come from an imports log table
        // For now, return recent imports from attendance records
        $recentImports = AttendanceRecord::select(
                DB::raw('DATE(created_at) as import_date'),
                'source',
                DB::raw('COUNT(*) as records_count'),
                DB::raw('MAX(created_at) as timestamp')
            )
            ->where('source', '!=', 'mobile')
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('import_date', 'source')
            ->orderBy('timestamp', 'desc')
            ->limit(20)
            ->get()
            ->map(function($item) {
                return [
                    'id' => md5($item->import_date . $item->source),
                    'timestamp' => Carbon::parse($item->timestamp)->format('Y-m-d H:i:s'),
                    'source' => ucfirst($item->source) . ' Import',
                    'records_count' => $item->records_count,
                    'status' => 'success',
                ];
            });

        return $this->success('Import history retrieved successfully', $recentImports);
    }
}
