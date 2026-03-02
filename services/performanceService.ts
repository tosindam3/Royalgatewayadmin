import { 
  EvaluationTemplate, 
  EvaluationResponse, 
  ReviewCycle, 
  Goal, 
  PerformanceKeyResult,
  SubmissionTarget,
  PendingEvaluation,
  PerformanceDashboardKPIs,
  TeamPerformanceData
} from '../types';

const API_BASE = '/api/v1/performance';

class PerformanceService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('royalgateway_auth_token');
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  }

  // Dashboard APIs
  async fetchDashboardKPIs(): Promise<PerformanceDashboardKPIs> {
    return this.request<PerformanceDashboardKPIs>('/dashboard');
  }

  async fetchTeamPerformance(): Promise<TeamPerformanceData[]> {
    return this.request<TeamPerformanceData[]>('/team-performance');
  }

  async fetchInsightsData(): Promise<any> {
    return this.request<any>('/insights');
  }

  // Template APIs
  async fetchTemplates(status?: string): Promise<EvaluationTemplate[]> {
    const params = status ? `?status=${status}` : '';
    return this.request<EvaluationTemplate[]>(`/templates${params}`);
  }

  async fetchPublishedTemplates(): Promise<EvaluationTemplate[]> {
    return this.request<EvaluationTemplate[]>('/templates/published');
  }

  async fetchTemplate(id: number): Promise<EvaluationTemplate> {
    return this.request<EvaluationTemplate>(`/templates/${id}`);
  }

  async createTemplate(template: Partial<EvaluationTemplate>): Promise<EvaluationTemplate> {
    return this.request<EvaluationTemplate>('/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
  }

  async updateTemplate(id: number, template: Partial<EvaluationTemplate>): Promise<EvaluationTemplate> {
    return this.request<EvaluationTemplate>(`/templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(template),
    });
  }

  async publishTemplate(id: number): Promise<EvaluationTemplate> {
    return this.request<EvaluationTemplate>(`/templates/${id}/publish`, {
      method: 'POST',
    });
  }

  async cloneTemplate(id: number, title?: string): Promise<EvaluationTemplate> {
    return this.request<EvaluationTemplate>(`/templates/${id}/clone`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async archiveTemplate(id: number): Promise<EvaluationTemplate> {
    return this.request<EvaluationTemplate>(`/templates/${id}/archive`, {
      method: 'POST',
    });
  }

  async deleteTemplate(id: number): Promise<void> {
    await this.request<void>(`/templates/${id}`, {
      method: 'DELETE',
    });
  }

  // Evaluation Response APIs
  async fetchEvaluations(filters?: {
    status?: string;
    employee_id?: number;
    cycle_id?: number;
  }): Promise<EvaluationResponse[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.employee_id) params.append('employee_id', filters.employee_id.toString());
    if (filters?.cycle_id) params.append('cycle_id', filters.cycle_id.toString());
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<EvaluationResponse[]>(`/evaluations${query}`);
  }

  async fetchPendingEvaluations(): Promise<PendingEvaluation[]> {
    return this.request<PendingEvaluation[]>('/evaluations/pending');
  }

  async fetchPendingReviews(): Promise<any[]> {
    return this.request<any[]>('/evaluations/pending-review');
  }

  async fetchEvaluation(id: number): Promise<EvaluationResponse> {
    return this.request<EvaluationResponse>(`/evaluations/${id}`);
  }

  async createEvaluation(evaluation: {
    template_id: number;
    employee_id: number;
    cycle_id?: number;
    answers: Record<string, any>;
  }): Promise<EvaluationResponse> {
    return this.request<EvaluationResponse>('/evaluations', {
      method: 'POST',
      body: JSON.stringify(evaluation),
    });
  }

  async updateEvaluation(id: number, answers: Record<string, any>): Promise<EvaluationResponse> {
    return this.request<EvaluationResponse>(`/evaluations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ answers }),
    });
  }

  async submitEvaluation(id: number, submittedTo: number, submissionType: string): Promise<EvaluationResponse> {
    return this.request<EvaluationResponse>(`/evaluations/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({
        submitted_to: submittedTo,
        submission_type: submissionType,
      }),
    });
  }

  async approveEvaluation(id: number, feedback?: string): Promise<EvaluationResponse> {
    return this.request<EvaluationResponse>(`/evaluations/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    });
  }

  async rejectEvaluation(id: number, feedback: string): Promise<EvaluationResponse> {
    return this.request<EvaluationResponse>(`/evaluations/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    });
  }

  async returnEvaluation(id: number, feedback: string): Promise<EvaluationResponse> {
    return this.request<EvaluationResponse>(`/evaluations/${id}/return`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    });
  }

  async deleteEvaluation(id: number): Promise<void> {
    await this.request<void>(`/evaluations/${id}`, {
      method: 'DELETE',
    });
  }

  async fetchSubmissionTargets(employeeId: number): Promise<SubmissionTarget[]> {
    return this.request<SubmissionTarget[]>(`/evaluations/submission-targets/${employeeId}`);
  }

  // Review Cycle APIs
  async fetchCycles(status?: string): Promise<ReviewCycle[]> {
    const params = status ? `?status=${status}` : '';
    return this.request<ReviewCycle[]>(`/cycles${params}`);
  }

  async fetchCycle(id: number): Promise<ReviewCycle> {
    return this.request<ReviewCycle>(`/cycles/${id}`);
  }

  async createCycle(cycle: {
    name: string;
    description?: string;
    start_date: string;
    end_date: string;
    template_id: number;
  }): Promise<ReviewCycle> {
    return this.request<ReviewCycle>('/cycles', {
      method: 'POST',
      body: JSON.stringify(cycle),
    });
  }

  async updateCycle(id: number, cycle: Partial<ReviewCycle>): Promise<ReviewCycle> {
    return this.request<ReviewCycle>(`/cycles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(cycle),
    });
  }

  async launchCycle(id: number, employeeIds: number[]): Promise<void> {
    await this.request<void>(`/cycles/${id}/launch`, {
      method: 'POST',
      body: JSON.stringify({ employee_ids: employeeIds }),
    });
  }

  async fetchCycleParticipants(id: number): Promise<any[]> {
    return this.request<any[]>(`/cycles/${id}/participants`);
  }

  async deleteCycle(id: number): Promise<void> {
    await this.request<void>(`/cycles/${id}`, {
      method: 'DELETE',
    });
  }

  // Goal/OKR APIs
  async fetchGoals(filters?: {
    type?: string;
    owner_id?: number;
    status?: string;
  }): Promise<Goal[]> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.owner_id) params.append('owner_id', filters.owner_id.toString());
    if (filters?.status) params.append('status', filters.status);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<Goal[]>(`/goals${query}`);
  }

  async fetchGoal(id: number): Promise<Goal> {
    return this.request<Goal>(`/goals/${id}`);
  }

  async createGoal(goal: {
    title: string;
    description?: string;
    owner_id: number;
    parent_goal_id?: number;
    type: string;
    start_date: string;
    end_date: string;
    key_results?: Array<{
      description: string;
      target_value: number;
      unit: string;
      weight?: number;
    }>;
  }): Promise<Goal> {
    return this.request<Goal>('/goals', {
      method: 'POST',
      body: JSON.stringify(goal),
    });
  }

  async updateGoal(id: number, goal: Partial<Goal>): Promise<Goal> {
    return this.request<Goal>(`/goals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(goal),
    });
  }

  async updateKeyResult(goalId: number, keyResultId: number, currentValue: number, note?: string): Promise<PerformanceKeyResult> {
    return this.request<PerformanceKeyResult>(`/goals/${goalId}/key-results/${keyResultId}/update`, {
      method: 'POST',
      body: JSON.stringify({
        current_value: currentValue,
        note,
      }),
    });
  }

  async deleteGoal(id: number): Promise<void> {
    await this.request<void>(`/goals/${id}`, {
      method: 'DELETE',
    });
  }
}

export const performanceService = new PerformanceService();
export default performanceService;