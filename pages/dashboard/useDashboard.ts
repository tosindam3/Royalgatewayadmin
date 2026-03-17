import { useQueries } from '@tanstack/react-query';
import { dashboardApi } from '../../services/dashboardApi';
import {
  EMPTY_QUICK_STATS,
  EMPTY_ATTENDANCE_PULSE,
  EMPTY_TALENT_TRENDS,
  EMPTY_DEMOGRAPHICS,
  EMPTY_PAYROLL_SUMMARY,
  EMPTY_PERSONAL_SUMMARY,
  EMPTY_PERSONAL_PERFORMANCE,
  type DashboardView,
} from '../../types/dashboard';
import { UserRole, type UserPermissions } from '../../types';

function deriveView(role: UserRole): DashboardView {
  switch (role) {
    case UserRole.SUPER_ADMIN: return 'executive';
    case UserRole.ADMIN:       return 'hr_admin';
    case UserRole.MANAGER:     return 'manager';
    default:                   return 'employee';
  }
}

const Q = {
  staleTime: 5 * 60 * 1000,
  gcTime:    10 * 60 * 1000,
  retry: 2,
  retryDelay: 1000,
};

export function useDashboard(role: UserRole, permissions: UserPermissions | null) {
  const view = deriveView(role);

  const isAdmin    = view === 'executive' || view === 'hr_admin';
  const isManager  = view === 'manager';
  const isEmployee = view === 'employee';

  const results = useQueries({
    queries: [
      // 0 — quick stats (admin + manager)
      {
        queryKey: ['dashboard', 'quick-stats', view],
        queryFn: dashboardApi.quickStats,
        enabled: isAdmin || isManager,
        placeholderData: EMPTY_QUICK_STATS,
        ...Q,
      },
      // 1 — attendance pulse (admin + manager)
      {
        queryKey: ['dashboard', 'attendance-pulse', view],
        queryFn: dashboardApi.attendancePulse,
        enabled: isAdmin || isManager,
        placeholderData: EMPTY_ATTENDANCE_PULSE,
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 2,
        retryDelay: 1000,
      },
      // 2 — talent trends (admin only)
      {
        queryKey: ['dashboard', 'talent-trends', view],
        queryFn: dashboardApi.talentTrends,
        enabled: isAdmin,
        placeholderData: EMPTY_TALENT_TRENDS,
        staleTime: 15 * 60 * 1000,
        gcTime: 20 * 60 * 1000,
        retry: 2,
        retryDelay: 1000,
      },
      // 3 — demographics (admin only)
      {
        queryKey: ['dashboard', 'demographics', view],
        queryFn: dashboardApi.demographics,
        enabled: isAdmin,
        placeholderData: EMPTY_DEMOGRAPHICS,
        staleTime: 60 * 60 * 1000,
        gcTime: 70 * 60 * 1000,
        retry: 2,
        retryDelay: 1000,
      },
      // 4 — payroll summary (admin only)
      {
        queryKey: ['dashboard', 'payroll-summary', view],
        queryFn: dashboardApi.payrollSummary,
        enabled: isAdmin,
        placeholderData: EMPTY_PAYROLL_SUMMARY,
        ...Q,
      },
      // 5 — pending approvals (admin + manager)
      {
        queryKey: ['dashboard', 'pending-approvals', view],
        queryFn: dashboardApi.pendingApprovals,
        enabled: isAdmin || isManager,
        placeholderData: [] as any[],
        ...Q,
      },
      // 6 — team attendance (manager only)
      {
        queryKey: ['dashboard', 'team-attendance', view],
        queryFn: dashboardApi.teamAttendance,
        enabled: isManager,
        placeholderData: [] as any[],
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 2,
        retryDelay: 1000,
      },
      // 7 — top performers (admin + manager)
      {
        queryKey: ['dashboard', 'top-performers', view],
        queryFn: dashboardApi.topPerformers,
        enabled: isAdmin || isManager,
        placeholderData: [] as any[],
        staleTime: 10 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
        retry: 2,
        retryDelay: 1000,
      },
      // 8 — my summary (employee only)
      {
        queryKey: ['dashboard', 'my-summary', view],
        queryFn: dashboardApi.mySummary,
        enabled: isEmployee,
        placeholderData: EMPTY_PERSONAL_SUMMARY,
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 2,
        retryDelay: 1000,
      },
      // 9 — personal performance (employee only)
      {
        queryKey: ['dashboard', 'personal-performance', view],
        queryFn: dashboardApi.personalPerformance,
        enabled: isEmployee,
        placeholderData: EMPTY_PERSONAL_PERFORMANCE,
        staleTime: 10 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
        retry: 2,
        retryDelay: 1000,
      },
      // 10 — leave balances (employee only)
      {
        queryKey: ['dashboard', 'leave-balances', view],
        queryFn: dashboardApi.leaveBalances,
        enabled: isEmployee,
        placeholderData: [] as any[],
        ...Q,
      },
    ],
  });

  const [
    quickStats,
    attendancePulse,
    talentTrends,
    demographics,
    payrollSummary,
    pendingApprovals,
    teamAttendance,
    topPerformers,
    mySummary,
    personalPerformance,
    leaveBalances,
  ] = results;

  const isLoading = results.some(r => r.isFetching && r.isPlaceholderData);

  return {
    view,
    isLoading,
    quickStats:          quickStats.data          ?? EMPTY_QUICK_STATS,
    attendancePulse:     attendancePulse.data      ?? EMPTY_ATTENDANCE_PULSE,
    talentTrends:        talentTrends.data         ?? EMPTY_TALENT_TRENDS,
    demographics:        demographics.data         ?? EMPTY_DEMOGRAPHICS,
    payrollSummary:      payrollSummary.data        ?? EMPTY_PAYROLL_SUMMARY,
    pendingApprovals:    pendingApprovals.data      ?? [],
    teamAttendance:      teamAttendance.data        ?? [],
    topPerformers:       topPerformers.data         ?? [],
    mySummary:           mySummary.data             ?? EMPTY_PERSONAL_SUMMARY,
    personalPerformance: personalPerformance.data   ?? EMPTY_PERSONAL_PERFORMANCE,
    leaveBalances:       leaveBalances.data         ?? [],
    // Per-widget loading states
    loadingStates: {
      quickStats:          quickStats.isFetching,
      attendancePulse:     attendancePulse.isFetching,
      talentTrends:        talentTrends.isFetching,
      demographics:        demographics.isFetching,
      payrollSummary:      payrollSummary.isFetching,
      pendingApprovals:    pendingApprovals.isFetching,
      teamAttendance:      teamAttendance.isFetching,
      topPerformers:       topPerformers.isFetching,
      mySummary:           mySummary.isFetching,
      personalPerformance: personalPerformance.isFetching,
      leaveBalances:       leaveBalances.isFetching,
    },
    // Per-widget refetch functions
    refetch: {
      quickStats:          quickStats.refetch,
      attendancePulse:     attendancePulse.refetch,
      talentTrends:        talentTrends.refetch,
      demographics:        demographics.refetch,
      payrollSummary:      payrollSummary.refetch,
      pendingApprovals:    pendingApprovals.refetch,
      teamAttendance:      teamAttendance.refetch,
      topPerformers:       topPerformers.refetch,
      mySummary:           mySummary.refetch,
      personalPerformance: personalPerformance.refetch,
      leaveBalances:       leaveBalances.refetch,
    },
  };
}
