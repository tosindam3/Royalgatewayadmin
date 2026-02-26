import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '../services/attendanceService';

// Overview/Dashboard Statistics
export function useAttendanceOverview() {
  return useQuery({
    queryKey: ['attendance', 'overview'],
    queryFn: () => attendanceService.getOverview(),
    refetchInterval: 60000,
  });
}

// Live Attendance - Real-time employee status
export function useLiveAttendance() {
  return useQuery({
    queryKey: ['attendance', 'live'],
    queryFn: () => attendanceService.getLive(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Daily Summary - Aggregated daily records
export function useDailySummary(date?: string) {
  return useQuery({
    queryKey: ['attendance', 'daily-summary', date],
    queryFn: () => attendanceService.getDailySummary(date),
    refetchInterval: 60000,
  });
}

// Overtime Records
export function useOvertimeRecords(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['attendance', 'overtime', startDate, endDate],
    queryFn: () => attendanceService.getOvertime({ start_date: startDate, end_date: endDate }),
  });
}

// Attendance Corrections/Adjustments
export function useAttendanceCorrections(status?: string) {
  return useQuery({
    queryKey: ['attendance', 'corrections', status],
    queryFn: async () => {
      // Mock data - replace with real endpoint
      return [];
    },
  });
}

// Reports Data
export function useAttendanceReports() {
  return useQuery({
    queryKey: ['attendance', 'reports'],
    queryFn: async () => {
      // Mock data - replace with real endpoint
      return {
        availableReports: [
          { id: 'monthly', name: 'Monthly Summary', description: 'Comprehensive monthly attendance report' },
          { id: 'employee', name: 'Employee Report', description: 'Individual employee attendance history' },
          { id: 'department', name: 'Department Report', description: 'Department-wise attendance analysis' },
          { id: 'late-arrivals', name: 'Late Arrivals', description: 'Track late check-ins' },
        ]
      };
    },
  });
}

// Devices & Imports
export function useDevicesImports() {
  return useQuery({
    queryKey: ['attendance', 'devices-imports'],
    queryFn: async () => {
      // Mock data - replace with real endpoint
      return {
        devices: [],
        recentImports: []
      };
    },
  });
}

// ===== SUMMARY TAB (Monthly Aggregates) =====

// Month KPIs
export function useAttendanceSummaryKpis(month: string, filters: any = {}) {
  return useQuery({
    queryKey: ['attSummaryKpis', month, filters],
    queryFn: () => attendanceService.getSummaryKpis(month, filters),
    refetchInterval: 120000, // 2 minutes
    staleTime: 60000,
  });
}

// Summary Table (Paginated)
export function useAttendanceSummaryTable(
  month: string,
  filters: any = {},
  page: number = 1,
  pageSize: number = 50,
  search: string = ''
) {
  return useQuery({
    queryKey: ['attSummaryRows', month, filters, page, pageSize, search],
    queryFn: () => attendanceService.getSummaryTable(month, { ...filters, search }, page, pageSize),
    keepPreviousData: true,
    refetchInterval: 120000,
    staleTime: 60000,
  });
}

// Employee Month Detail
export function useEmployeeMonthDetail(employeeId: number | null, month: string) {
  return useQuery({
    queryKey: ['attEmpMonth', employeeId, month],
    queryFn: () => attendanceService.getEmployeeMonthDetail(employeeId!, month),
    enabled: !!employeeId,
    staleTime: 60000,
  });
}

// Record Details
export function useRecordDetails(recordId: number | null) {
  return useQuery({
    queryKey: ['attRecordDetails', recordId],
    queryFn: () => attendanceService.getRecordDetails(recordId!),
    enabled: !!recordId,
    staleTime: 30000,
  });
}
