// Dashboard typed interfaces — all numeric fields default to 0, arrays to []
// Backend never returns null for numeric/array fields

export interface QuickStatsResponse {
  total_employees: number;
  present_today: number;
  on_leave: number;
  pending_approvals: number;
  turnover_rate: number;
  avg_tenure_years: number;
  active_openings: number;
  delta: {
    employees: number;
    present: number;
    turnover: number;
  };
}

export interface AttendancePulseResponse {
  present: number;
  absent: number;
  late: number;
  on_leave: number;
  total: number;
  percentage_present: number;
}

export interface TalentTrendsResponse {
  headcount: { month: string; count: number }[];
  turnover: { category: string; count: number }[];
  hiring_funnel: { stage: string; count: number }[];
}

export interface DemographicsResponse {
  gender: { label: string; value: number }[];
  employment_type: { label: string; value: number }[];
  absenteeism_rate: number;
  avg_days_absent: number;
  absenteeism_trend: { month: string; rate: number }[];
}

export interface PayrollSummaryResponse {
  monthly_payroll: number;
  total_employees: number;
  average_pay: number;
  active_runs: number;
  history: { period: string; amount: number }[];
}

export interface PersonalSummaryResponse {
  days_present: number;
  days_absent: number;
  late_days: number;
  leave_balance_total: number;
  clock_status: 'clocked_in' | 'clocked_out' | 'not_started';
  clock_in_time: string | null;
  attendance_by_week: { week: string; present: number; late: number; absent: number }[];
}

export interface PersonalPerformanceResponse {
  current_score: number;
  rating: { label: string; color: string; bgColor: string; borderColor: string } | null;
  department_average: number;
  organization_average: number;
  history: { period: string; score: number; dept_avg: number }[];
  latest_breakdown: { field_label: string; score: number; weight: number; weighted_score: number }[];
  has_submission: boolean;
}

export interface PendingApprovalItem {
  id: number;
  request_number: string;
  requester: string;
  type: string;
  submitted_at: string;
}

export interface TeamMemberAttendance {
  id: number;
  name: string;
  avatar?: string;
  status: 'present' | 'late' | 'absent' | 'on_leave';
}

export interface TopPerformer {
  rank: number;
  name: string;
  department: string;
  score: number;
}

export interface LeaveBalanceItem {
  type: string;
  used: number;
  available: number;
  total: number;
}

// Dashboard view types derived from role
export type DashboardView = 'executive' | 'hr_admin' | 'manager' | 'employee';

// Safe empty defaults — used as initialData in React Query
export const EMPTY_QUICK_STATS: QuickStatsResponse = {
  total_employees: 0,
  present_today: 0,
  on_leave: 0,
  pending_approvals: 0,
  turnover_rate: 0,
  avg_tenure_years: 0,
  active_openings: 0,
  delta: { employees: 0, present: 0, turnover: 0 },
};

export const EMPTY_ATTENDANCE_PULSE: AttendancePulseResponse = {
  present: 0,
  absent: 0,
  late: 0,
  on_leave: 0,
  total: 0,
  percentage_present: 0,
};

export const EMPTY_TALENT_TRENDS: TalentTrendsResponse = {
  headcount: [],
  turnover: [],
  hiring_funnel: [],
};

export const EMPTY_DEMOGRAPHICS: DemographicsResponse = {
  gender: [],
  employment_type: [],
  absenteeism_rate: 0,
  avg_days_absent: 0,
  absenteeism_trend: [],
};

export const EMPTY_PAYROLL_SUMMARY: PayrollSummaryResponse = {
  monthly_payroll: 0,
  total_employees: 0,
  average_pay: 0,
  active_runs: 0,
  history: [],
};

export const EMPTY_PERSONAL_SUMMARY: PersonalSummaryResponse = {
  days_present: 0,
  days_absent: 0,
  late_days: 0,
  leave_balance_total: 0,
  clock_status: 'not_started',
  clock_in_time: null,
  attendance_by_week: [],
};

export const EMPTY_PERSONAL_PERFORMANCE: PersonalPerformanceResponse = {
  current_score: 0,
  rating: null,
  department_average: 0,
  organization_average: 0,
  history: [],
  latest_breakdown: [],
  has_submission: false,
};
