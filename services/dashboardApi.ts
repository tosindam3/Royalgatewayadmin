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
    api.get('/payroll/metrics').then((res: any) => {
      // Backend returns { stats: {...}, history: [...] }
      const stats = res?.stats ?? res;
      return {
        monthly_payroll: stats?.monthly_payroll ?? 0,
        total_employees: stats?.total_employees ?? 0,
        average_pay: stats?.average_pay ?? 0,
        active_runs: stats?.active_runs ?? 0,
        history: res?.history ?? [],
      };
    }),

  mySummary: (): Promise<PersonalSummaryResponse> =>
    api.get('/dashboard/metrics/my-summary') as any,

  personalPerformance: (): Promise<PersonalPerformanceResponse> =>
    api.get('/performance/analytics/personal') as any,

  pendingApprovals: (): Promise<PendingApprovalItem[]> =>
    api.get('/approvals/pending').then((res: any) => {
      const raw: any[] = Array.isArray(res) ? res : res?.data ?? [];
      return raw.map((item: any) => ({
        id: item.id,
        request_number: item.request_number ?? `#${item.id}`,
        // requester may be a User object or a plain string
        requester: typeof item.requester === 'string'
          ? item.requester
          : item.requester?.display_name ?? item.requester?.name ?? 'Unknown',
        type: item.workflow?.module ?? item.type ?? 'Request',
        submitted_at: item.submitted_at ?? item.created_at,
      }));
    }),

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
