
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE'
}

export const mapBackendRoleToUserRole = (roles?: { name: string }[]): UserRole => {
  if (!roles || roles.length === 0) return UserRole.EMPLOYEE;

  const roleNames = roles.map(r => r.name);
  if (roleNames.includes('super_admin')) return UserRole.SUPER_ADMIN;
  if (roleNames.includes('admin')) return UserRole.ADMIN;
  if (roleNames.includes('hr_manager') || roleNames.includes('branch_manager') || roleNames.includes('department_head') || roleNames.includes('team_lead')) return UserRole.MANAGER;

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
  avatar: string;
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

export type PayrollRunStatus = 'DRAFT' | 'COMPUTED' | 'UNDER_REVIEW' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'LOCKED' | 'PAID';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';

export interface PayrollPeriod {
  id: string;
  name: string; // e.g. "April 2024"
  startDate: string;
  endDate: string;
  status: 'OPEN' | 'CLOSED' | 'PROCESSING';
}

export interface PayrollRun {
  id: string;
  periodId: string;
  periodName: string;
  status: PayrollRunStatus;
  branchScope: string;
  deptScope: string;
  totalGross: number;
  totalNet: number;
  anomalyCount: number;
  submittedBy?: string;
  submittedAt?: string;
  approvalChain: ApprovalStep[];
}

export interface ApprovalStep {
  id: string;
  role: string;
  approverName?: string;
  status: ApprovalStatus;
  updatedAt?: string;
  comment?: string;
}

export interface PayrollLine {
  id: string;
  employeeId: string;
  employeeName: string;
  avatar: string;
  department: string;
  branch: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  latePenalty: number;
  overtimePay: number;
  performanceBonus: number;
  grossPay: number;
  netPay: number;
  variance: number; // vs previous period
  hasAnomalies: boolean;
  isOnHold: boolean;
}

export interface PayItem {
  id: string;
  type: 'ALLOWANCE' | 'DEDUCTION' | 'BONUS' | 'REIMBURSEMENT';
  name: string;
  amount: number;
  isTaxable: boolean;
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
  email: string;
  phone?: string;
  branch_id: string;
  department_id: string;
  designation_id: string;
  manager_id?: string;
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
