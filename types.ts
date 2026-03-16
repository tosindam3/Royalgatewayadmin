
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE'
}

export const mapBackendRoleToUserRole = (roles?: { name: string }[]): UserRole => {
  if (!roles || roles.length === 0) return UserRole.EMPLOYEE;

  // Handle both slug and name from backend, and normalize for matching
  const roleNames = roles.map(r => (r.name || '').toLowerCase().replace(/\s+/g, '_'));
  
  if (roleNames.includes('super_admin')) return UserRole.SUPER_ADMIN;
  if (roleNames.includes('admin') || roleNames.includes('hr_admin')) return UserRole.ADMIN;
  if (roleNames.includes('hr_manager') || roleNames.includes('branch_manager') || roleNames.includes('department_head') || roleNames.includes('team_lead') || roleNames.includes('manager')) return UserRole.MANAGER;

  return UserRole.EMPLOYEE;
};

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  department: string;
  status: 'ONLINE' | 'OFFLINE' | 'AWAY';
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  deviceBound: boolean;
}

export interface UserProfile {
  name: string;
  username: string;
  email: string;
  avatar: string;
  employee_id?: string | number;
  employee_profile?: Employee;
}

// Enterprise Attendance Types
export type AttendanceSource = 'BIOMETRIC' | 'APP' | 'USB';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'ON_LEAVE' | 'ANOMALY';

export interface RawPunch {
  id: string;
  timestamp: string;
  type: 'IN' | 'OUT' | 'BREAK_START' | 'BREAK_END';
  source: AttendanceSource;
  location?: string;
  deviceId?: string;
  isSelfieVerified?: boolean;
}

export interface GeofenceZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // meters
  isActive: boolean;
}

export interface AttendanceAggregate {
  id: string;
  date: string;
  employeeId: string;
  employeeName: string;
  avatar: string;
  department: string;
  firstIn: string | null;
  lastOut: string | null;
  totalHours: number;
  lateMins: number;
  otMins: number;
  status: AttendanceStatus;
  primarySource: AttendanceSource;
  isLocked: boolean;
  punches: RawPunch[];
}

export interface AttendancePolicy {
  graceMinutes: number;
  roundingMinutes: number;
  latePenaltyTiers: { thresholdMins: number; penaltyAmount: number }[];
  otAutoApprove: boolean;
  enforceGeofence: boolean;
  strictGeofence?: boolean; // Block punch if outside
  geofenceZones?: GeofenceZone[];
  enforceIpWhitelist?: boolean;
}

export interface IPWhitelistEntry {
  id: string;
  label: string;
  type: 'SINGLE' | 'RANGE' | 'CIDR';
  value: string;
  branchId?: string | number;
  isActive: boolean;
  appliesTo: 'WEB' | 'WEB_APP';
  createdBy?: string;
  updatedAt?: string;
}

export interface BiometricDevice {
  id: string | number;
  deviceName: string;
  model: string;
  connectionType: 'TCP_IP' | 'USB';
  ipAddress?: string;
  port?: number;
  branchId: string | number;
  status: 'ONLINE' | 'OFFLINE' | 'DISABLED';
  lastSync?: string;
  recordsImported: number;
  mappingRules?: any;
}

export interface AttendanceAuditLog {
  id: string;
  date: string;
  actor: string;
  area: 'GEOFENCE' | 'IP' | 'BIOMETRIC' | 'POLICY';
  action: string;
  summary: string;
  details?: any;
}

// --- Payroll Domain Types ---

export type PayrollRunStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface PayrollPeriod {
  id: number;
  name: string; // e.g. "April 2024"
  year: number;
  month: number;
  start_date: string;
  end_date: string;
  working_days: number;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface PayrollRun {
  id: number;
  period_id: number;
  period_name: string;
  scope_type: 'all' | 'department' | 'branch' | 'custom';
  scope_ref_id?: number;
  status: PayrollRunStatus;
  prepared_by: string;
  prepared_by_user_id: number;
  approver: string;
  approver_user_id: number;
  submitted_at?: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_comment?: string; // NEW - shown when rejected
  total_gross: number;
  total_deductions: number;
  total_net: number;
  employee_count: number;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollRunEmployee {
  id: number;
  employee: {
    id: number;
    name: string;
    staff_id: string;
    department?: string;
    branch?: string;
  };
  base_salary_snapshot: number;
  absent_days: number;
  late_minutes: number;
  overtime_hours: number;
  performance_score: number;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
}

export interface SalaryStructure {
  id: number;
  name: string;
  description: string;
  earnings_components: any[];
  deductions_components: any[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeSalary {
  id: number;
  employee_id: number;
  salary_structure_id: number;
  base_salary: number;
  effective_date: string;
  is_active: boolean;
  employee?: any;
  salary_structure?: SalaryStructure;
  created_at: string;
  updated_at: string;
}

export interface PayrollEmployeeBreakdown {
  earnings: Array<{ code: string; label: string; amount: number }>;
  deductions: Array<{ code: string; label: string; amount: number }>;
  snapshot: {
    base_salary: number;
    absent_days: number;
    late_minutes: number;
    overtime_hours: number;
    performance_score: number;
  };
}

export interface PayrollItem {
  id: number;
  name: string;
  code: string;
  type: 'earning' | 'deduction';
  method: 'fixed' | 'percent_of_base';
  default_value: number;
  active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovalRequest {
  id: number;
  request_number: string;
  entity_type: string;
  entity_id: number;
  requester: string;
  requester_id: number;
  status: ApprovalStatus;
  current_step: number;
  requester_comment?: string;
  rejection_comment?: string;
  submitted_at: string;
  completed_at?: string;
  entity_summary?: {
    total_net: number;
    employee_count: number;
    period_name: string;
  };
  created_at: string;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface AttendanceSummary {
  employeeId: string;
  totalDays: number;
  lateMins: number;
  overtimeMins: number;
  absences: number;
  anomalies: number;
}

export interface PerformanceSummary {
  employeeId: string;
  kpiScore: number;
  okrCompletion: number;
  bonusEligibility: boolean;
  recommendedIncentive: number;
}

// --- Standard UI types ---

export interface Branch {
  id: string | number;
  code: string;
  name: string;
  type: 'HQ' | 'Regional' | 'Satellite' | 'Virtual';
  status: 'active' | 'inactive' | 'Active' | 'Inactive' | 'Archived';
  address?: string;
  city?: string;
  country?: string;
  location?: string;
  timezone: string;
  is_hq: boolean;
  manager_id?: number;
  manager_name?: string;
  employee_count: number;
  device_count: number;
  latitude?: number;
  longitude?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  manager?: {
    id: number;
    full_name: string;
  };
  departments?: any[];
  attendance_today?: {
    present: number;
    late: number;
    absent: number;
  };
}

export interface BranchDevice {
  id: string;
  name: string;
  serial: string;
  type: 'Face' | 'Fingerprint' | 'Hybrid';
  status: 'ONLINE' | 'OFFLINE';
  lastSync: string;
}

export type OKRStatus = 'ON_TRACK' | 'AT_RISK' | 'COMPLETED' | 'BEHIND';
export type OKRCategory = 'Strategic' | 'Operational' | 'Growth' | 'Cultural';

export interface KeyResult {
  id: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string; // e.g., '%', 'USD', 'Points'
  weight: number; // 0-100
}

export interface Objective {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  category: OKRCategory;
  status: OKRStatus;
  startDate: string;
  endDate: string;
  keyResults: KeyResult[];
  alignmentId?: string; // ID of parent company goal
}

export type FormFieldType =
  | 'SHORT_TEXT'
  | 'PARAGRAPH'
  | 'MULTIPLE_CHOICE'
  | 'CHECKBOXES'
  | 'DROPDOWN'
  | 'RATING'
  | 'DATE'
  | 'FILE'
  | 'KPI';

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  weight: number;
  options?: string[];
}

export interface FormTemplate {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  createdAt: string;
  isGlobal?: boolean;
}

export interface BrandSettings {
  companyName: string;
  logoUrl: string;
  primaryColor: string;
}

export interface SecurityAlert {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  timestamp: string;
}

export type NotificationType = 'CYCLE_EVENT' | 'PENDING_REVIEW' | 'EVALUATION_COMPLETE' | 'SYSTEM';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

// --- Employee & Organization Types ---

export type EmploymentType = 'full-time' | 'part-time' | 'contract';
export type WorkMode = 'onsite' | 'remote' | 'hybrid';
export type EmployeeStatus = 'active' | 'probation' | 'suspended' | 'terminated';

export interface Designation {
  id: string;
  name: string;
  code: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  branch_id?: string;
}

export interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  phone?: string;
  branch_id: string;
  department_id: string;
  designation_id: string;
  manager_id?: string;
  user_id?: number;
  employment_type: EmploymentType;
  work_mode: WorkMode;
  status: EmployeeStatus;
  hire_date: string;
  dob?: string;
  avatar?: string;
  blood_group?: string;
  genotype?: string;
  academics?: string;
  branch?: { id: string, name: string };
  department?: { id: string, name: string };
  designation?: { id: string, name: string };
  manager?: { id: string, full_name: string };
  subordinates?: Employee[];
}

export interface EmployeeMetrics {
  total_employees: number;
  active_employees: number;
  on_leave_today: number;
  new_hires_this_month: number;
  probation_count: number;
  by_employment_type?: Record<string, number>;
  by_work_mode?: Record<string, number>;
}

// --- Onboarding Types ---

export type OnboardingStatus = 'ongoing' | 'completed' | 'cancelled';
export type OnboardingTaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
export type OnboardingPriority = 'low' | 'medium' | 'high';

export interface OnboardingTemplate {
  id: string;
  name: string;
  department_id?: string;
  designation_id?: string;
  is_active: boolean;
  tasks?: OnboardingTemplateTask[];
}

export interface OnboardingTemplateTask {
  id: string;
  template_id: string;
  title: string;
  description?: string;
  default_owner_role?: string;
  offset_days: number;
  required: boolean;
}

export interface OnboardingCase {
  id: string;
  employee_id: string;
  template_id?: string;
  start_date: string;
  status: OnboardingStatus;
  completion_percent: number;
  created_by: string;
  employee?: Employee;
  tasks?: OnboardingTask[];
}

export interface OnboardingTask {
  id: string;
  case_id: string;
  title: string;
  description?: string;
  owner_user_id?: string;
  owner_role?: string;
  due_date: string;
  status: OnboardingTaskStatus;
  priority: OnboardingPriority;
}

// --- Leave Management Types ---

export type LeaveRequestStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';
export type LeaveAccrualMethod = 'upfront' | 'monthly' | 'pro_rata' | 'per_incident';
export type HolidayType = 'global' | 'branch_specific';

export interface LeaveType {
  id: number;
  name: string;
  code: string;
  description?: string;
  default_days_per_year: number;
  accrual_method: LeaveAccrualMethod;
  accrual_rate?: number;
  is_carry_forward: boolean;
  max_carry_forward_days?: number;
  requires_approval: boolean;
  requires_document: boolean;
  min_notice_days: number;
  max_consecutive_days?: number;
  is_paid: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface LeaveBalance {
  id: number;
  employee_id: number;
  leave_type_id: number;
  year: number;
  total_allocated: number;
  used: number;
  pending: number;
  available: number;
  carried_forward: number;
  expiry_date?: string;
  employee?: {
    id: number;
    full_name: string;
    employee_code: string;
    department?: { name: string };
    branch?: { name: string };
  };
  leave_type?: LeaveType;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: number;
  request_number: string;
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  contact_during_leave?: string;
  document_path?: string;
  status: LeaveRequestStatus;
  approved_by?: number;
  approved_at?: string;
  approval_notes?: string;
  rejection_reason?: string;
  cancelled_by?: number;
  cancelled_at?: string;
  cancellation_reason?: string;
  employee?: {
    id: number;
    full_name: string;
    employee_code: string;
    department?: { name: string };
    branch?: { name: string };
    avatar?: string;
  };
  leave_type?: LeaveType;
  approver?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Holiday {
  id: number;
  name: string;
  date: string;
  year: number;
  type: HolidayType;
  branch_id?: number;
  description?: string;
  is_mandatory: boolean;
  is_recurring: boolean;
  branch?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface LeaveDashboardStats {
  on_leave_today: number;
  pending_requests: number;
  approved_this_month: number;
  rejected_this_month: number;
  upcoming_leaves: number;
}

// --- Performance Management Types ---

export interface EvaluationSession {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  order: number;
}

export interface EvaluationTemplate {
  id: string;
  title: string;
  description?: string;
  sessions: EvaluationSession[];
  metadata?: Record<string, any>;
  created_by: number;
  cloned_from?: number;
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  version: number;
  total_questions?: number;
  is_editable?: boolean;
  can_be_cloned?: boolean;
  is_global?: boolean;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export interface EvaluationResponse {
  id: number;
  template_id: number;
  employee_id: number;
  evaluator_id: number;
  cycle_id?: number;
  answers: Record<string, any>;
  status: 'draft' | 'submitted_to_manager' | 'submitted_to_admin' | 'approved' | 'rejected' | 'returned';
  submitted_to?: number;
  submitted_at?: string;
  approved_at?: string;
  approved_by?: number;
  feedback?: string;
  approval_chain?: ApprovalChainItem[];
  calculated_score?: number;
  status_label?: string;
  can_edit?: boolean;
  can_submit?: boolean;
  template?: EvaluationTemplate;
  employee?: {
    id: number;
    first_name: string;
    last_name: string;
    employee_code: string;
    department?: {
      id: number;
      name: string;
    };
  };
  evaluator?: {
    id: number;
    name: string;
  };
  submitted_to_user?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ApprovalChainItem {
  submitted_to?: number;
  submitted_at?: string;
  approved_by?: number;
  approved_at?: string;
  rejected_by?: number;
  rejected_at?: string;
  returned_by?: number;
  returned_at?: string;
  status: string;
  feedback?: string;
}

export interface SubmissionTarget {
  id: number;
  name: string;
  designation: string;
  type: 'manager' | 'department_head' | 'branch_manager' | 'hr_admin';
  priority: number;
}

export interface PendingEvaluation {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_code: string;
  department: string;
  status: string;
  cycle_id?: number;
}

export interface UserPermissions {
  is_hr_admin: boolean;
  is_manager: boolean;
  is_employee: boolean;
  employee_id: number;
  department_id?: number;
  branch_id?: number;
}

export interface PerformanceDashboardKPIs {
  org_health_score: number;
  completion_rate: number;
  top_performers: number;
  top_performers_percentage: number;
  turnover_risk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface TeamPerformanceData {
  name: string;
  kpi: number;
  behavioral: number;
  attendance: number;
  avg: number;
}

export interface ReviewCycle {
  id: number;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'closed';
  template_id?: number;
  completion_rate?: number;
  total_participants?: number;
  completed_count?: number;
  template?: {
    id: number;
    title: string;
    description?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CycleParticipant {
  id: number;
  cycle_id: number;
  employee_id: number;
  evaluator_id?: number;
  status: 'pending' | 'in_progress' | 'completed';
  completed_at?: string;
  employee?: {
    id: number;
    first_name: string;
    last_name: string;
    employee_code: string;
    department?: {
      id: number;
      name: string;
    };
  };
  evaluator?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: number;
  title: string;
  description?: string;
  owner_id: number;
  parent_goal_id?: number;
  type: 'company' | 'department' | 'team' | 'individual';
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  progress: number;
  owner?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  parent?: {
    id: number;
    title: string;
  };
  children?: Goal[];
  key_results?: PerformanceKeyResult[];
  created_at: string;
  updated_at: string;
}

export interface PerformanceKeyResult {
  id: number;
  goal_id: number;
  description: string;
  target_value: number;
  current_value: number;
  unit: string;
  weight: number;
  progress_percentage?: number;
  created_at: string;
  updated_at: string;
}

export interface GoalUpdate {
  id: number;
  goal_id: number;
  key_result_id?: number;
  updated_by: number;
  previous_value?: number;
  new_value: number;
  notes?: string;
  updater?: {
    id: number;
    name: string;
  };
  created_at: string;
}
