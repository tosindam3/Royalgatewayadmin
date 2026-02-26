import apiClient from './apiClient';
import { OnboardingCase, OnboardingTaskStatus } from '../types';

export const onboardingService = {
    getCases: async (params: any = {}): Promise<{ data: OnboardingCase[], meta: any }> => {
        return apiClient.get('/hr-core/onboarding/cases', { params });
    },

    getCaseDetails: async (id: string): Promise<OnboardingCase> => {
        return apiClient.get(`/hr-core/onboarding/cases/${id}`);
    },

    updateTaskStatus: async (taskId: string, status: OnboardingTaskStatus): Promise<any> => {
        return apiClient.patch(`/hr-core/onboarding/tasks/${taskId}`, { status });
    }
};
