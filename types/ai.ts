export type InsightType     = 'descriptive' | 'diagnostic' | 'predictive' | 'prescriptive';
export type InsightSeverity = 'info' | 'warning' | 'critical' | 'positive';

export interface InsightAction {
  label: string;
  href:  string;
}

export interface InsightItem {
  id:       string;
  type:     InsightType;
  severity: InsightSeverity;
  headline: string;
  summary:  string;
  detail?:  string | null;
  action?:  InsightAction | null;
}

export interface BriefingResponse {
  insights:       InsightItem[];
  health_score:   number;
  gemini_enabled: boolean;
  generated_at:   string;
}

export interface TrendNews {
  title:       string;
  description: string;
  url:         string;
  source:      string;
  published:   string;
}

export interface HrInsight {
  category: string;
  insight:  string;
}

export interface TrendsResponse {
  news:        TrendNews[];
  hr_insights: HrInsight[];
  fetched_at:  string;
}

export interface ChatMessage {
  role:    'user' | 'model';
  content: string;
}
