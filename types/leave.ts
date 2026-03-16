// Leave Management Type Definitions

export interface LeaveType {
  id: number;
  name: string;
  code: string;
  description?: string;
  default_days_per_year: number;
  accrual_method: 'upfront' | 'monthly' | 'pro_rata' | 'per_incident';
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

export type LeaveRequestStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';

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
  type: 'global' | 'branch_specific';
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
  // Management stats
  on_leave_today?: number;
  pending_requests?: number;
  approved_this_month?: number;
  rejected_this_month?: number;
  upcoming_leaves?: number;
  
  // Employee stats
  used_this_month?: number;
  pending_mine?: number;
  sick_used?: number;
  upcoming_mine?: number;
  total_remaining?: number;
}

export interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  per_page: number;
  to: number;
  total: number;
}

export interface LeaveRequestFilters {
  status?: LeaveRequestStatus;
  employee_id?: number;
  leave_type_id?: number;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}

export interface CreateLeaveRequestData {
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  reason: string;
  contact_during_leave?: string;
  document?: File;
}

export interface ApproveLeaveRequestData {
  notes?: string;
}

export interface RejectLeaveRequestData {
  reason: string;
}

export interface CancelLeaveRequestData {
  reason: string;
}
