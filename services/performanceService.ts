import apiClient from './apiClient';

const API_BASE = '/performance';

class PerformanceService {
  // ─── Submissions ──────────────────────────────────────────────────────────

  async getSubmissions(filters?: { status?: string; period?: string; per_page?: number }) {
    const response = await apiClient.get(`${API_BASE}/submissions`, { params: filters }) as any;
    return Array.isArray(response) ? response : (response?.data ?? response ?? []);
  }

  async createSubmission(data: {
    period: string;
    form_data: Record<string, any>;
  }) {
    const response = await apiClient.post(`${API_BASE}/submissions`, data) as any;
    return response?.data ?? response;
  }

  // ─── Drafts ───────────────────────────────────────────────────────────────

  async getDraft(departmentId: number, period: string) {
    const response = await apiClient.get(`${API_BASE}/drafts/my-draft`, {
      params: { department_id: departmentId, period }
    }) as any;
    return response?.data ?? response ?? null;
  }

  async saveDraft(data: {
    department_id: number;
    period: string;
    form_data: Record<string, any>;
  }) {
    const response = await apiClient.post(`${API_BASE}/drafts/save`, data) as any;
    return response?.data ?? response;
  }

  // ─── Analytics ────────────────────────────────────────────────────────────

  async getAvailablePeriods() {
    const response = await apiClient.get(`${API_BASE}/available-periods`) as any;
    return response?.data ?? { periods: [], years: [] };
  }

  async getLeaderboard(limit?: number, filters?: { period?: string, start_date?: string, end_date?: string, year?: string, quarter?: string }) {
    const response = await apiClient.get(`${API_BASE}/leaderboard`, {
      params: { limit, ...(filters || {}) }
    }) as any;
    return Array.isArray(response) ? response : (response?.data ?? []);
  }

  async getDepartmentSummaries(filters?: { period?: string, start_date?: string, end_date?: string, year?: string, quarter?: string }) {
    const response = await apiClient.get(`${API_BASE}/department-summaries`, {
      params: filters || {}
    }) as any;
    return Array.isArray(response) ? response : (response?.data ?? []);
  }

  async getAnalytics(params?: any) {
    try {
      const response = await apiClient.get(`${API_BASE}/analytics`, { params }) as any;
      return response?.data ?? response ?? {};
    } catch {
      return {};
    }
  }

  // ─── Template Resolution (Employee) ───────────────────────────────────────

  /** Returns the best published template for the current authenticated employee */
  async getConfigForEmployee() {
    const response = await apiClient.get(`${API_BASE}/configs/for-employee`) as any;
    return response?.data ?? response ?? null;
  }

  // ─── Configs — Read ───────────────────────────────────────────────────────

  async getConfigs(filters?: {
    department_id?: number;
    branch_id?: number;
    status?: 'draft' | 'published' | 'archived';
    scope?: 'department' | 'branch' | 'global';
  }) {
    const response = await apiClient.get(`${API_BASE}/configs`, { params: filters }) as any;
    return Array.isArray(response) ? response : (response?.data ?? []);
  }

  async getConfig(id: number) {
    const response = await apiClient.get(`${API_BASE}/configs/${id}`) as any;
    return response?.data ?? response;
  }

  async getConfigByDepartment(departmentId: number) {
    const response = await apiClient.get(`${API_BASE}/configs/department/${departmentId}`) as any;
    return response?.data ?? response;
  }

  // ─── Configs — CRUD ───────────────────────────────────────────────────────

  async createConfig(data: {
    name: string;
    description?: string;
    scope: 'department' | 'branch' | 'global';
    department_id?: number;
    department_ids?: number[];
    branch_id?: number;
    sections: any[];
    scoring_config: any;
  }) {
    const response = await apiClient.post(`${API_BASE}/configs`, data) as any;
    return response?.data ?? response;
  }

  async updateConfig(id: number, data: any) {
    const response = await apiClient.put(`${API_BASE}/configs/${id}`, data) as any;
    return response?.data ?? response;
  }

  async deleteConfig(id: number) {
    await apiClient.delete(`${API_BASE}/configs/${id}`);
  }

  // ─── Lifecycle Actions ────────────────────────────────────────────────────

  async publishConfig(id: number) {
    const response = await apiClient.post(`${API_BASE}/configs/${id}/publish`) as any;
    return response?.data ?? response;
  }

  async revertConfig(id: number) {
    const response = await apiClient.post(`${API_BASE}/configs/${id}/revert`) as any;
    return response?.data ?? response;
  }

  async archiveConfig(id: number) {
    const response = await apiClient.post(`${API_BASE}/configs/${id}/archive`) as any;
    return response?.data ?? response;
  }

  async cloneConfig(id: number) {
    const response = await apiClient.post(`${API_BASE}/configs/${id}/clone`) as any;
    return response?.data ?? response;
  }

  // ─── Export ───────────────────────────────────────────────────────────────

  async exportSubmissions(params?: any) {
    const response = await apiClient.get(`${API_BASE}/export`, {
      params,
      responseType: 'blob'
    } as any);
    return response as any;
  }

  // ─── Added Analytics ──────────────────────────────────────────────────────

  async getPersonalAnalytics(params?: { period?: string }) {
    const response = await apiClient.get(`${API_BASE}/analytics/personal`, { params }) as any;
    return response?.data ?? response;
  }

  async getBranchAnalytics(params?: { period?: string }) {
    const response = await apiClient.get(`${API_BASE}/analytics/branch`, { params }) as any;
    return response?.data ?? response;
  }

  // ─── Backward-compat aliases ──────────────────────────────────────────────

  async getTemplate(id: number) { return this.getConfig(id); }
  async createTemplate(data: any) { return this.createConfig(data); }
  async updateTemplate(id: number, data: any) { return this.updateConfig(id, data); }
}

export const performanceService = new PerformanceService();
export default performanceService;
