import api from './apiClient';
import type { JobOpening, Application, JobStatistics, PipelineStatistics } from '../types/talent';

export const talentApi = {
  // Job Openings
  getJobs: (filters?: any): Promise<{ data: JobOpening[]; meta?: any }> =>
    api.get('/talent/jobs', { params: filters }),

  getJobById: (id: string | number): Promise<JobOpening> =>
    api.get(`/talent/jobs/${id}`),

  createJob: (data: Partial<JobOpening>): Promise<JobOpening> =>
    api.post('/talent/jobs', data),

  updateJob: (id: string | number, data: Partial<JobOpening>): Promise<JobOpening> =>
    api.put(`/talent/jobs/${id}`, data),

  deleteJob: (id: string | number): Promise<void> =>
    api.delete(`/talent/jobs/${id}`),

  getJobStatistics: (): Promise<JobStatistics> =>
    api.get('/talent/jobs/statistics'),

  // Applications
  applyForJob: (jobId: string | number, data: { cover_letter: string; resume?: File; referrer_employee_id?: number }): Promise<Application> => {
    const formData = new FormData();
    formData.append('cover_letter', data.cover_letter);
    if (data.resume) {
      formData.append('resume', data.resume);
    }
    if (data.referrer_employee_id) {
      formData.append('referrer_employee_id', data.referrer_employee_id.toString());
    }
    return api.post(`/talent/jobs/${jobId}/apply`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getMyApplications: (): Promise<Application[]> =>
    api.get('/talent/applications/me'),

  getApplications: (filters?: any): Promise<{ data: Application[]; meta?: any }> =>
    api.get('/talent/applications', { params: filters }),

  updateApplicationStage: (id: number, stage: string): Promise<Application> =>
    api.put(`/talent/applications/${id}/stage`, { stage }),

  getPipelineStatistics: (): Promise<PipelineStatistics> =>
    api.get('/talent/applications/statistics'),
};

export default talentApi;
