// Performance Management Type Definitions

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

export interface EvaluationTemplate {
  id: number;
  title: string;
  description?: string;
  fields: FormField[];
  created_by: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  weight: number;
  placeholder?: string;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
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

export interface ReviewCycle {
  id: number;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'closed';
  template_id?: number;
  created_at: string;
  updated_at: string;
  template?: {
    id: number;
    title: string;
    description?: string;
  };
  participants?: CycleParticipant[];
  completion_rate?: number;
  total_participants?: number;
  completed_count?: number;
}

export interface CycleParticipant {
  id: number;
  cycle_id: number;
  employee_id: number;
  evaluator_id?: number;
  status: 'pending' | 'in_progress' | 'completed';
  completed_at?: string;
  created_at: string;
  updated_at: string;
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
}

export interface EvaluationResponse {
  id: number;
  template_id: number;
  employee_id: number;
  evaluator_id: number;
  cycle_id?: number;
  answers: Record<string, any>;
  status: 'draft' | 'submitted' | 'submitted_to_manager' | 'submitted_to_admin' | 'approved' | 'rejected';
  submitted_at?: string;
  approved_at?: string;
  approved_by?: number;
  feedback?: string;
  created_at: string;
  updated_at: string;
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
  approver?: {
    id: number;
    name: string;
  };
  calculated_score?: number;
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
  progress: number; // 0-100
  created_at: string;
  updated_at: string;
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
  updates?: GoalUpdate[];
  health_status?: 'on_track' | 'at_risk' | 'behind';
}

export interface PerformanceKeyResult {
  id: number;
  goal_id: number;
  description: string;
  target_value: number;
  current_value: number;
  unit: string;
  weight: number;
  created_at: string;
  updated_at: string;
  progress_percentage?: number;
  updates?: GoalUpdate[];
}

export interface GoalUpdate {
  id: number;
  goal_id: number;
  key_result_id?: number;
  updated_by: number;
  previous_value?: number;
  new_value: number;
  notes?: string;
  created_at: string;
  updater?: {
    id: number;
    name: string;
  };
}

export interface PendingEvaluation {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_code: string;
  department: string;
  status: string;
  cycle_id: number;
}

export interface SubmissionTarget {
  id: number;
  name: string;
  designation: string;
  type: 'manager' | 'department_head' | 'branch_manager' | 'hr_admin';
  priority: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// Form Builder Types
export interface FormTemplate {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  createdAt: string;
}

// Performance Metrics
export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  period: string;
}

// Dashboard Types
export interface DashboardInsight {
  title: string;
  description: string;
  type: 'success' | 'warning' | 'info' | 'error';
  action?: {
    label: string;
    url: string;
  };
}

// User Permissions
export interface UserPermissions {
  is_hr_admin: boolean;
  is_manager: boolean;
  is_employee: boolean;
  employee_id: number;
  department_id?: number;
  branch_id?: number;
}

// Filter Types
export interface EvaluationFilters {
  status?: string;
  employee_id?: number;
  cycle_id?: number;
  evaluator_id?: number;
}

export interface GoalFilters {
  type?: string;
  owner_id?: number;
  status?: string;
  parent_goal_id?: number;
}

export interface CycleFilters {
  status?: string;
  template_id?: number;
}