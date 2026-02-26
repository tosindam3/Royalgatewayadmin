import apiClient from './apiClient';
import { Department, Designation } from '../types';

export interface Branch {
    id: string;
    name: string;
    code: string;
    type: 'HQ' | 'Regional' | 'Satellite' | 'Virtual';
    is_hq: boolean;
    location: string;
    address?: string;
    city?: string;
    country?: string;
    timezone: string;
    status: 'active' | 'inactive';
    manager_id?: number;
    manager_name?: string;
    employee_count: number;
    device_count: number;
    created_at?: string;
    updated_at?: string;
}

export interface BranchFormData {
    name: string;
    code: string;
    type: 'HQ' | 'Regional' | 'Satellite' | 'Virtual';
    is_hq?: boolean;
    location?: string;
    address?: string;
    city?: string;
    country?: string;
    timezone: string;
    status: 'active' | 'inactive';
    manager_id?: number;
}

export interface DepartmentFormData {
    name: string;
    code: string;
    branch_id: number;
}

export interface DesignationFormData {
    name: string;
    code: string;
}

export const organizationService = {
    // Branches
    getBranches: async (params?: {
        search?: string;
        type?: string;
        status?: string;
        per_page?: number | 'all';
    }): Promise<Branch[]> => {
        return apiClient.get('/hr-core/branches', { params });
    },

    getBranch: async (id: string): Promise<Branch> => {
        return apiClient.get(`/hr-core/branches/${id}`);
    },

    createBranch: async (data: BranchFormData): Promise<Branch> => {
        return apiClient.post('/hr-core/branches', data);
    },

    updateBranch: async (id: string, data: Partial<BranchFormData>): Promise<Branch> => {
        return apiClient.put(`/hr-core/branches/${id}`, data);
    },

    deleteBranch: async (id: string): Promise<void> => {
        return apiClient.delete(`/hr-core/branches/${id}`);
    },

    restoreBranch: async (id: string): Promise<Branch> => {
        return apiClient.post(`/hr-core/branches/${id}/restore`);
    },

    getBranchEmployees: async (id: string): Promise<any> => {
        return apiClient.get(`/hr-core/branches/${id}/employees`);
    },

    getBranchStatistics: async (id: string): Promise<any> => {
        return apiClient.get(`/hr-core/branches/${id}/statistics`);
    },

    // Departments
    getDepartments: async (params?: {
        branch_id?: string;
        search?: string;
        per_page?: number | 'all';
    }): Promise<Department[]> => {
        return apiClient.get('/hr-core/departments', { params });
    },

    getDepartment: async (id: string): Promise<Department> => {
        return apiClient.get(`/hr-core/departments/${id}`);
    },

    createDepartment: async (data: DepartmentFormData): Promise<Department> => {
        return apiClient.post('/hr-core/departments', data);
    },

    updateDepartment: async (id: string, data: Partial<DepartmentFormData>): Promise<Department> => {
        return apiClient.put(`/hr-core/departments/${id}`, data);
    },

    deleteDepartment: async (id: string): Promise<void> => {
        return apiClient.delete(`/hr-core/departments/${id}`);
    },

    getDepartmentEmployees: async (id: string): Promise<any> => {
        return apiClient.get(`/hr-core/departments/${id}/employees`);
    },

    // Designations
    getDesignations: async (params?: {
        search?: string;
        per_page?: number | 'all';
    }): Promise<Designation[]> => {
        return apiClient.get('/hr-core/designations', { params });
    },

    getDesignation: async (id: string): Promise<Designation> => {
        return apiClient.get(`/hr-core/designations/${id}`);
    },

    createDesignation: async (data: DesignationFormData): Promise<Designation> => {
        return apiClient.post('/hr-core/designations', data);
    },

    updateDesignation: async (id: string, data: Partial<DesignationFormData>): Promise<Designation> => {
        return apiClient.put(`/hr-core/designations/${id}`, data);
    },

    deleteDesignation: async (id: string): Promise<void> => {
        return apiClient.delete(`/hr-core/designations/${id}`);
    },

    getDesignationEmployees: async (id: string): Promise<any> => {
        return apiClient.get(`/hr-core/designations/${id}/employees`);
    },
};
