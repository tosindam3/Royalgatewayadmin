import api from './apiClient';
import type {
  QuickStatsResponse,
  AttendancePulseResponse,
  TalentTrendsResponse,
  DemographicsResponse,
  PayrollSummaryResponse,
  PersonalSummaryResponse,
  PersonalPerformanceResponse,
  PendingApprovalItem,
  TeamMemberAttendance,
  TopPerformer,
  LeaveBalanceItem,
} from '../types/dashboard';

// apiClient interceptor already unwraps {status, message, data} → returns data directly
export const dashboardApi = {
  quickStats: (): Promise<QuickStatsResponse> =>
    api.get('/dashboard/metrics/quick-stats') as any,

  attendancePulse: (): Promise<AttendancePulseResponse> =>
    api.get('/dashboard/metrics/attendance-pulse') as any,

  talentTrends: (): Promise<TalentTrendsResponse> =>
    api.get('/dashboard/metrics/talent-trends') as any,

  demographics: (): Promise<DemographicsResponse> =>
    api.get('/dashboard/metrics/demographics') as any,

  payrollSummary: (): Promise<PayrollSummaryResponse> =>
    api.get('/payroll/metrics') as any,

  mySummary: (): Promise<PersonalSummaryResponse> =>
    api.get('/dashboard/metrics/my-summary') as any,

  personalPerformance: (): Promise<PersonalPerformanceResponse> =>
    api.get('/performance/analytics/personal') as any,

  pendingApprovals: (): Promise<PendingApprovalItem[]> =>
    api.get('/approvals/pending').then((res: any) =>
      Array.isArray(res) ? res : res?.data ?? []
    ),

  teamAttendance: (): Promise<TeamMemberAttendance[]> =>
    api.get('/hr-core/attendance/live').then((res: any) =>
      Array.isArray(res) ? res : res?.data ?? []
    ),

  topPerformers: (): Promise<TopPerformer[]> =>
    api.get('/performance/leaderboard').then((res: any) =>
      Array.isArray(res) ? res : res?.data ?? []
    ),

  leaveBalances: (): Promise<LeaveBalanceItem[]> =>
    api.get('/leave/balances').then((res: any) =>
      Array.isArray(res) ? res : res?.data ?? []
    ),
};
