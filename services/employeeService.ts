import apiClient from './apiClient';
import { Employee, EmployeeMetrics, EmployeeStatus } from '../types';

export const employeeService = {
    getMetrics: async (): Promise<EmployeeMetrics> => {
        return apiClient.get('/hr-core/employees/metrics');
    },

    getDirectory: async (params: any = {}): Promise<{ data: Employee[], meta: any }> => {
        return apiClient.get('/hr-core/employees', { params });
    },

    getById: async (id: string): Promise<Employee> => {
        return apiClient.get(`/hr-core/employees/${id}`);
    },

    hire: async (data: any): Promise<Employee> => {
        return apiClient.post('/hr-core/employees', data);
    },

    update: async (id: string | number, data: any): Promise<Employee> => {
        return apiClient.put(`/hr-core/employees/${id}`, data);
    },

    updateStatus: async (id: string, status: EmployeeStatus): Promise<Employee> => {
        return apiClient.patch(`/hr-core/employees/${id}/status`, { status });
    },

    delete: async (id: string): Promise<void> => {
        return apiClient.delete(`/hr-core/employees/${id}`);
    },

    getByDepartment: async (departmentId: string): Promise<Employee[]> => {
        return apiClient.get(`/hr-core/employees/department/${departmentId}`);
    },

    getByBranch: async (branchId: string): Promise<Employee[]> => {
        return apiClient.get(`/hr-core/employees/branch/${branchId}`);
    },

    getSubordinates: async (managerId: string): Promise<Employee[]> => {
        return apiClient.get(`/hr-core/employees/${managerId}/subordinates`);
    },
    uploadAvatar: async (id: string | number, file: File): Promise<Employee> => {
        const formData = new FormData();
        formData.append('avatar', file);
        return apiClient.post(`/hr-core/employees/${id}/avatar`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    updateSelf: async (id: string | number, data: {
        phone?: string;
        dob?: string;
        blood_group?: string;
        genotype?: string;
        academics?: string;
    }): Promise<Employee> => {
        return apiClient.put(`/hr-core/employees/${id}`, data);
    },
};
