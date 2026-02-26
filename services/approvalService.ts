import apiClient from './apiClient';

export interface ApprovalWorkflow {
    id: number;
    name: string;
    code: string;
    module: string;
    trigger_event: string;
    description?: string;
    conditions?: any;
    is_active: boolean;
    is_system: boolean;
    priority: number;
    steps?: ApprovalStep[];
}

export interface ApprovalStep {
    id?: number;
    workflow_id?: number;
    step_order: number;
    name: string;
    approver_type: 'role' | 'user' | 'manager' | 'department_head' | 'branch_head';
    approver_role_id?: number;
    approver_user_id?: number;
    scope_level: 'all' | 'branch' | 'department' | 'team' | 'self';
    is_required: boolean;
    allow_parallel: boolean;
    timeout_hours?: number;
    conditions?: any;
}

export interface ApprovalRequest {
    id: number;
    request_number: string;
    workflow_id: number;
    workflow?: ApprovalWorkflow;
    requestable_type: string;
    requestable_id: number;
    requestable?: any;
    requester_id: number;
    requester?: any;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';
    current_step: number;
    current_approver_id?: number;
    current_approver?: any;
    requester_comment?: string;
    submitted_at: string;
    completed_at?: string;
    actions?: ApprovalAction[];
}

export interface ApprovalAction {
    id: number;
    request_id: number;
    step_id: number;
    step?: ApprovalStep;
    approver_id: number;
    approver?: any;
    action: 'approved' | 'rejected' | 'delegated' | 'escalated';
    comment?: string;
    acted_at: string;
}

export interface ApprovalStatistics {
    pending_approvals: number;
    my_pending_requests: number;
    approved_by_me: number;
    rejected_by_me: number;
}

export const approvalService = {
    // Workflows
    getWorkflows: async (params?: any): Promise<{ data: ApprovalWorkflow[], meta?: any }> => {
        return apiClient.get('/workflows', { params });
    },

    getWorkflow: async (id: number): Promise<ApprovalWorkflow> => {
        return apiClient.get(`/workflows/${id}`);
    },

    createWorkflow: async (data: Partial<ApprovalWorkflow> & { steps: ApprovalStep[] }): Promise<ApprovalWorkflow> => {
        return apiClient.post('/workflows', data);
    },

    updateWorkflow: async (id: number, data: Partial<ApprovalWorkflow>): Promise<ApprovalWorkflow> => {
        return apiClient.put(`/workflows/${id}`, data);
    },

    deleteWorkflow: async (id: number): Promise<void> => {
        return apiClient.delete(`/workflows/${id}`);
    },

    updateWorkflowSteps: async (id: number, steps: ApprovalStep[]): Promise<ApprovalWorkflow> => {
        return apiClient.put(`/workflows/${id}/steps`, { steps });
    },

    toggleWorkflowActive: async (id: number): Promise<ApprovalWorkflow> => {
        return apiClient.patch(`/workflows/${id}/toggle-active`);
    },

    // Approvals
    getPendingApprovals: async (params?: any): Promise<ApprovalRequest[]> => {
        return apiClient.get('/approvals/pending', { params });
    },

    getApprovals: async (params?: any): Promise<{ data: ApprovalRequest[], meta?: any }> => {
        return apiClient.get('/approvals', { params });
    },

    getApproval: async (id: number): Promise<ApprovalRequest> => {
        return apiClient.get(`/approvals/${id}`);
    },

    approve: async (id: number, comment?: string): Promise<ApprovalRequest> => {
        return apiClient.post(`/approvals/${id}/approve`, { comment });
    },

    reject: async (id: number, comment: string): Promise<ApprovalRequest> => {
        return apiClient.post(`/approvals/${id}/reject`, { comment });
    },

    cancel: async (id: number, reason: string): Promise<ApprovalRequest> => {
        return apiClient.post(`/approvals/${id}/cancel`, { reason });
    },

    getHistory: async (params?: any): Promise<{ data: ApprovalRequest[], meta?: any }> => {
        return apiClient.get('/approvals/history', { params });
    },

    getStatistics: async (): Promise<ApprovalStatistics> => {
        return apiClient.get('/approvals/statistics');
    },
};
