import apiClient from './apiClient';
import {
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  Holiday,
  LeaveDashboardStats,
  PaginationMeta,
  LeaveRequestFilters,
  CreateLeaveRequestData,
  ApproveLeaveRequestData,
  RejectLeaveRequestData,
  CancelLeaveRequestData,
} from '../types/leave';

/**
 * Leave Management API Service
 * 
 * All endpoints are under /api/v1/leave
 * Requires authentication (Bearer token)
 */
export const leaveApi = {
  // ==================== DASHBOARD ====================
  
  getDashboardStats: async (): Promise<LeaveDashboardStats> => {
    const response = await apiClient.get('/leave/dashboard');
    return response.data || response;
  },

  // ==================== LEAVE TYPES ====================
  
  getLeaveTypes: async (): Promise<LeaveType[]> => {
    const response = await apiClient.get('/leave/types');
    return response.data || response;
  },

  // ==================== LEAVE BALANCES ====================
  
  getLeaveBalances: async (params?: {
    year?: number;
    employee_id?: number;
  }): Promise<LeaveBalance[]> => {
    const response = await apiClient.get('/leave/balances', { params });
    return response.data || response;
  },

  // ==================== LEAVE REQUESTS ====================
  
  getLeaveRequests: async (
    filters?: LeaveRequestFilters
  ): Promise<{ data: LeaveRequest[]; meta: PaginationMeta }> => {
    return await apiClient.get('/leave/requests', { params: filters });
  },

  getLeaveRequest: async (id: number): Promise<LeaveRequest> => {
    const response = await apiClient.get(`/leave/requests/${id}`);
    return response.data || response;
  },

  createLeaveRequest: async (data: CreateLeaveRequestData): Promise<LeaveRequest> => {
    const response = await apiClient.post('/leave/requests', data);
    return response.data || response;
  },

  approveLeaveRequest: async (
    id: number,
    data?: ApproveLeaveRequestData
  ): Promise<LeaveRequest> => {
    const response = await apiClient.post(`/leave/requests/${id}/approve`, data);
    return response.data || response;
  },

  rejectLeaveRequest: async (
    id: number,
    data: RejectLeaveRequestData
  ): Promise<LeaveRequest> => {
    const response = await apiClient.post(`/leave/requests/${id}/reject`, data);
    return response.data || response;
  },

  cancelLeaveRequest: async (
    id: number,
    data: CancelLeaveRequestData
  ): Promise<LeaveRequest> => {
    const response = await apiClient.post(`/leave/requests/${id}/cancel`, data);
    return response.data || response;
  },

  // ==================== HOLIDAYS ====================
  
  getHolidays: async (params?: {
    year?: number;
    branch_id?: number;
  }): Promise<Holiday[]> => {
    // Note: This endpoint might need to be added to the backend
    // For now, we'll use a placeholder
    const response = await apiClient.get('/leave/holidays', { params });
    return response.data || response;
  },
};
