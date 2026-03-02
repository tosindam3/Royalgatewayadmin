
export interface PerformanceDashboardKPIs {
    org_health_score: number;
    completion_rate: number;
    top_performers: number;
    top_performers_percentage: number;
    turnover_risk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface TeamPerformanceData {
    name: string;
    kpi: number;
    behavioral: number;
    attendance: number;
    avg?: number;
}

export interface PendingEvaluation {
    id: number;
    employee_name: string;
    employee_code: string;
    department: string;
    template_title: string;
    status: 'pending' | 'in_progress' | 'completed';
    due_date?: string;
}

export interface EvaluationResponse {
    id: number;
    template_id: number;
    employee_id: number;
    evaluator_id: number;
    cycle_id?: number;
    answers: Record<string, any>;
    status: 'draft' | 'submitted_to_manager' | 'submitted_to_admin' | 'approved' | 'rejected' | 'returned';
    submitted_to?: number;
    submitted_at?: string;
    approved_at?: string;
    approved_by?: number;
    feedback?: string;
    calculated_score?: number;
    template?: EvaluationTemplate;
    employee?: {
        id: number;
        first_name: string;
        last_name: string;
        employee_code: string;
        department?: {
            id: number;
            name: string;
        };
    };
}

export interface EvaluationTemplate {
    id: number;
    title: string;
    description: string;
    total_questions: number;
    status: 'draft' | 'published' | 'archived';
    sessions?: any[];
}

export interface Goal {
    id: number;
    title: string;
    description: string;
    owner_id: number;
    type: 'company' | 'department' | 'team' | 'individual';
    status: 'active' | 'completed' | 'cancelled';
    progress: number;
    start_date: string;
    end_date: string;
    owner?: {
        first_name: string;
        last_name: string;
        avatar?: string;
    };
    key_results?: PerformanceKeyResult[];
}

export interface PerformanceKeyResult {
    id: number;
    goal_id: number;
    description: string;
    target_value: number;
    current_value: number;
    unit: string;
    weight: number;
    progress_percentage: number;
}

export interface PerformanceNotification {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'CYCLE_EVENT' | 'EVALUATION_COMPLETE';
}
export interface ReviewCycle {
    id: number;
    name: string;
    description?: string;
    start_date: string;
    end_date: string;
    status: 'draft' | 'active' | 'closed';
    template_id: number;
    template?: EvaluationTemplate;
    completion_rate?: number;
    participants_count?: number;
}
