// Talent Management Types

export interface JobOpening {
  id: string | number;
  title: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  department_id?: number;
  department?: {
    id: number;
    name: string;
  };
  branch_id?: number;
  branch?: {
    id: number;
    name: string;
  };
  location: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'intern';
  experience_level: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  openings: number;
  status: 'draft' | 'active' | 'on_hold' | 'closed';
  posted_date?: string;
  closing_date?: string;
  applicants_count?: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string;
  resume_path?: string;
  linkedin_url?: string;
  source: 'linkedin' | 'indeed' | 'referral' | 'direct' | 'agency' | 'other';
  overall_rating?: number;
  user_id?: number;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: number;
  candidate_id: number;
  candidate?: Candidate;
  job_opening_id: number;
  jobOpening?: JobOpening;
  stage: 'applied' | 'screening' | 'technical' | 'interview' | 'offer' | 'hired' | 'rejected';
  status: 'active' | 'withdrawn' | 'rejected' | 'hired';
  applied_date: string;
  cover_letter?: string;
  referrer_employee_id?: number;
  created_at: string;
  updated_at: string;
}

export interface Interview {
  id: number;
  application_id: number;
  interview_type: 'phone' | 'video' | 'in_person' | 'technical' | 'panel';
  scheduled_date: string;
  duration_minutes: number;
  location?: string;
  meeting_link?: string;
  interviewer_id?: number;
  feedback?: string;
  rating?: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  created_at: string;
  updated_at: string;
}

export interface JobStatistics {
  total_active: number;
  total_draft: number;
  total_closed: number;
  total_applications: number;
}

export interface PipelineStatistics {
  applied: number;
  screening: number;
  technical: number;
  interview: number;
  offer: number;
  hired: number;
}
