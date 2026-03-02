import apiClient from './apiClient';
import {
  PayrollPeriod,
  PayrollRun,
  PayrollRunEmployee,
  PayrollEmployeeBreakdown,
  PayrollItem,
  ApprovalRequest,
  PaginationMeta,
  PayrollRunStatus,
  SalaryStructure,
  EmployeeSalary
} from '../types';

/**
 * Payroll API Service
 * 
 * All endpoints are under /api/v1/payroll
 * Requires authentication (Bearer token)
 */
export const payrollApi = {
  // ==================== PERIODS ====================

  getPeriods: async (params?: {
    status?: 'open' | 'closed';
    year?: number;
  }): Promise<PayrollPeriod[]> => {
    const response = await apiClient.get('/payroll/periods', { params });
    return response.data || response;
  },

  getPeriod: async (id: number): Promise<PayrollPeriod> => {
    const response = await apiClient.get(`/payroll/periods/${id}`);
    return response.data || response;
  },

  // ==================== RUNS ====================

  getRuns: async (params?: {
    period_id?: number;
    status?: PayrollRunStatus;
    page?: number;
    per_page?: number;
  }): Promise<{ data: PayrollRun[]; meta: PaginationMeta }> => {
    return await apiClient.get('/payroll/runs', { params });
  },

  // ==================== SALARY STRUCTURES ====================

  getStructures: async (): Promise<SalaryStructure[]> => {
    const response = await apiClient.get('/payroll/structures');
    return response.data || response;
  },

  createStructure: async (data: Partial<SalaryStructure>): Promise<SalaryStructure> => {
    const response = await apiClient.post('/payroll/structures', data);
    return response.data || response;
  },

  updateStructure: async (id: number, data: Partial<SalaryStructure>): Promise<SalaryStructure> => {
    const response = await apiClient.patch(`/payroll/structures/${id}`, data);
    return response.data || response;
  },

  // ==================== EMPLOYEE SALARIES ====================

  getEmployeeSalaries: async (params?: { employee_id?: number }): Promise<EmployeeSalary[]> => {
    const response = await apiClient.get('/payroll/salaries', { params });
    return response.data || response;
  },

  // ==================== EMPLOYEE SALARIES (CONTINUED) ====================

  getEmployeeSalary: async (id: number): Promise<EmployeeSalary> => {
    const response = await apiClient.get(`/payroll/salaries/${id}`);
    return response.data?.data || response.data || response;
  },

  updateEmployeeSalaryMapping: async (id: number, data: Partial<EmployeeSalary>): Promise<EmployeeSalary> => {
    const response = await apiClient.patch(`/payroll/salaries/${id}`, data);
    return response.data?.data || response.data || response;
  },

  deleteEmployeeSalary: async (id: number): Promise<void> => {
    await apiClient.delete(`/payroll/salaries/${id}`);
  },

  assignSalaryStructure: async (data: {
    employee_id: number;
    salary_structure_id: number;
    base_salary: number;
    effective_date: string;
  }): Promise<EmployeeSalary> => {
    const response = await apiClient.post('/payroll/salaries', data);
    return response.data || response;
  },

  // ==================== RUNS (CONTINUED) ====================

  createRun: async (data: {
    period_id: number;
    scope_type: 'all' | 'department' | 'branch' | 'custom';
    scope_ref_id?: number;
    approver_user_id: number;
    note?: string;
  }): Promise<PayrollRun> => {
    const response = await apiClient.post('/payroll/runs', data);
    return response.data || response;
  },

  getRun: async (id: number): Promise<PayrollRun> => {
    const response = await apiClient.get(`/payroll/runs/${id}`);
    return response.data?.data || response.data || response;
  },

  getRunEmployees: async (
    runId: number,
    page: number = 1,
    perPage: number = 50
  ): Promise<{ data: PayrollRunEmployee[]; meta: PaginationMeta }> => {
    return await apiClient.get(`/payroll/runs/${runId}/employees`, {
      params: { page, per_page: perPage }
    });
  },

  getEmployeeBreakdown: async (
    runId: number,
    employeeId: number
  ): Promise<PayrollEmployeeBreakdown> => {
    const response = await apiClient.get(
      `/payroll/runs/${runId}/employees/${employeeId}/breakdown`
    );
    return response.data || response;
  },

  recalculate: async (runId: number): Promise<PayrollRun> => {
    const response = await apiClient.post(`/payroll/runs/${runId}/recalculate`);
    return response.data || response;
  },

  submit: async (runId: number, message?: string): Promise<{ approval_request_id: number; run_status: string }> => {
    const response = await apiClient.post(`/payroll/runs/${runId}/submit`, { message });
    return response.data || response;
  },

  // ==================== APPROVALS ====================

  getApprovalInbox: async (params?: {
    entity_type?: string;
    status?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ data: ApprovalRequest[]; meta: PaginationMeta }> => {
    return await apiClient.get('/payroll/approvals/inbox', { params });
  },

  getApproval: async (id: number): Promise<{ approval: ApprovalRequest; run: PayrollRun | null }> => {
    const response = await apiClient.get(`/payroll/approvals/${id}`);
    return response.data || response;
  },

  approve: async (approvalId: number, comment?: string): Promise<void> => {
    await apiClient.post(`/payroll/approvals/${approvalId}/approve`, { comment });
  },

  reject: async (approvalId: number, decisionNote: string): Promise<void> => {
    await apiClient.post(`/payroll/approvals/${approvalId}/reject`, { decision_note: decisionNote });
  },

  // ==================== PAY ITEMS ====================

  getPayItems: async (params?: {
    type?: 'earning' | 'deduction';
    active?: boolean;
  }): Promise<PayrollItem[]> => {
    const response = await apiClient.get('/payroll/items', { params });
    return response.data || response;
  },

  createPayItem: async (data: Partial<PayrollItem>): Promise<PayrollItem> => {
    const response = await apiClient.post('/payroll/items', data);
    return response.data || response;
  },

  updatePayItem: async (id: number, data: Partial<PayrollItem>): Promise<PayrollItem> => {
    const response = await apiClient.patch(`/payroll/items/${id}`, data);
    return response.data || response;
  },

  // ==================== GLOBAL SETTINGS ====================

  getSettings: async (prefix?: string): Promise<Record<string, any>> => {
    const response = await apiClient.get('/payroll/settings', { params: { prefix } });
    return response.data?.data || response.data || {};
  },

  updateSettings: async (settings: Record<string, any>): Promise<void> => {
    await apiClient.post('/payroll/settings', { settings });
  },
};
