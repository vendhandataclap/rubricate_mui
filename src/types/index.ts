// Types for Rubricate Platform

export type QuestionType = 'open_text' | 'comparison' | 'error_identification' | 'ranking' | 'multiple_choice';
export type QuestionStatus = 'draft' | 'active' | 'archived';
export type DifficultyTier = 'no_experience' | 'junior' | 'mid' | 'senior';
export type AIRecommendation = 'pass' | 'review' | 'fail';
export type RecruiterDecision = 'approved' | 'rejected' | 'more_info' | null;
export type OnboardingStatus = 'profile_complete' | 'assessment_assigned' | 'assessment_in_progress' | 'assessment_complete' | 'approved' | 'rejected';
export type AssessmentStatus = 'assigned' | 'in_progress' | 'submitted' | 'graded' | 'reviewed';
export type AssessmentMode = 'manual' | 'voice' | 'communication' | string;

export interface Domain {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface Subdomain {
  id: string;
  domain_id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface Question {
  id: string;
  domain_id: string;
  subdomain_id: string | null;
  question_type: QuestionType;
  difficulty_tier: DifficultyTier;
  status: QuestionStatus;
  prompt: string;
  context_a?: string;
  context_b?: string;
  choices?: { id: string; text: string; is_correct: boolean }[];
  ranking_items?: { id: string; text: string; correct_order: number }[];
  grading_rubric: string;
  max_score: number;
  time_limit_minutes: number;
  min_response_length: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface QuestionBank {
  id: string;
  domain_id: string;
  difficulty_tier: DifficultyTier;
  name: string;
  question_ids: string[];
  is_active: boolean;
  created_at: string;
}
export interface Expert {
  id: string;
  full_name: string;
  email: string;
  primary_domain_id: string;
  primary_domain_name?: string;
  subdomain_id?: string | { id: string; name: string } | null;
  subdomain_name?: string;
  seniority_level: DifficultyTier | null;
  years_experience: number;
  onboarding_status: OnboardingStatus;
  profile_completed_at: string;
  created_at: string;
  country?: string | null;
  role?: string;
  // All raw user fields from directus
  [key: string]: any;
  userdetails?: Record<string, any>;
}

export interface Recruiter {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  company?: string;
  domain_ids: string[];
  status: 'active' | 'inactive' | 'invited' | 'pending';
  created_at: string;
  invited_at?: string | null;
  accepted_at?: string | null;
}

export interface CompanyUser {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  status: 'active' | 'inactive' | string;
  created_at: string;
  assignments_count?: number;
  last_active?: string | null;
  raw?: Record<string, any>;
}

export interface Job {
  id: string;
  status?: string | null;
  title: string;
  description?: string | null;
  category?: string | null;
  subdomain?: string | null;
  experience_level?: string | null;
  education?: string | null;
  location?: string | null;
  work_type?: string | null;
  budget_type?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  duration?: string | null;
  start_date?: string | null;
  required_skills?: string[];
  preferred_skills?: string[];
  application_deadline?: string | null;
  application_questions?: string[];
  visibility?: string | null;
  company_id?: string | null;
  posted_by?: string | null;
  views?: number | null;
  applications?: number | null;
  is_archived?: boolean | null;
  archived_at?: string | null;
  date_created?: string | null;
  voiceai_requirement?: string | null;
  approval_status?: string | null;
  english_assessment?: number | null;
  [key: string]: any;
}

export interface Assessment {
  id: string;
  expert_id: string;
  expert?: Expert;
  domain_id: string;
  difficulty_tier: DifficultyTier;
  assessment_mode?: AssessmentMode | null;
  status: AssessmentStatus;
  max_possible_score: number;
  total_score: number | null;
  percentage: number | null;
  ai_recommendation: AIRecommendation | null;
  ai_summary: string | null;
  strengths: string[] | null;
  gaps: string[] | null;
  recruiter_decision: RecruiterDecision;
  recruiter_id: string | null;
  recruiter_notes: string | null;
  decided_at: string | null;
  flag_count: number;
  question_count: number;
  started_at: string | null;
  submitted_at: string | null;
  time_taken_minutes?: number | null;
  graded_at: string | null;
  assigned_at: string | null;
  expires_at: string;
  created_at: string;
}

export interface AssessmentResponse {
  id: string;
  assessment_id: string;
  question_id: string;
  question?: Question;
  order_index: number;
  response_text: string;
  ai_score: number | null;
  override_score: number | null;
  ai_feedback: string | null;
  ai_reasoning: string | null;
  recruiter_feedback: string | null;
  is_flagged: boolean;
  flag_reason: string | null;
  submitted_at: string | null;
}

export interface ProfileComponentScoringResult {
  experience_score: number;
  skills_score: number;
  total_score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  confidence: string;
  model_used: string;
  graded_at: string;
}

export interface GradingRecord {
  id: string;
  profile_component_score?: number | null;
  assessment_component_score?: number | null;
  overall_score?: number | null;
  grading_status?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  meta?: {
    profile_component_scoring_result?: ProfileComponentScoringResult | null;
    [key: string]: any;
  } | null;
  [key: string]: any;
}

export interface GradingReportDimensionScore {
  name: string;
  score: number;
  weight: number;
  evidence?: string | null;
  reasoning?: string | null;
}

export interface GradingReport {
  id: string;
  assessment_id: string;
  assessment_type?: string | null;
  candidate_id?: string | null;
  grading_status?: string | null;
  grading_model?: string | null;
  graded_at?: string | null;
  date_created?: string | null;
  date_updated?: string | null;
  session_id?: string | null;
  error_message?: string | null;
  hiring_recommendation?: string | null;
  overall_score?: number | null;
  summary?: string | null;
  strengths?: string[];
  areas_for_improvement?: string[];
  dimension_scores?: GradingReportDimensionScore[];
  [key: string]: any;
}

export interface GradingRun {
  id: string;
  assessment_id: string;
  question_id: string | null;
  run_type: 'per_question' | 'summary' | 'test';
  success: boolean;
  input_tokens: number;
  output_tokens: number;
  estimated_cost: number;
  error_message: string | null;
  created_at: string;
}

export interface DashboardStats {
  totalQuestions: number;
  activeQuestions: number;
  totalDomains: number;
  totalAssessments: number;
  pendingReview: number;
  passRate: number;
  avgScore: number;
  flagRate: number;
}

// ── Assignment Timing Types ──────────────────────────────────────────────

export interface QuestionVisit {
  startTime: string; // ISO timestamp
  endTime: string | null; // null if visit is active
  duration: number | null; // in seconds, null if visit is active
}

export interface QuestionTiming {
  questionId: string;
  totalTimeSpent: number; // in seconds
  visits: QuestionVisit[];
}

export interface AssignmentTimingPayload {
  assignmentId: string;
  assignmentStartTime: string; // ISO timestamp
  assignmentEndTime: string | null;
  totalTimeSpent: number | null; // in seconds
  tabSwitchCount: number;
  terminationReason: 'TAB_SWITCH_LIMIT_EXCEEDED' | null;
  questions: QuestionTiming[];
}

export interface ActiveVisit {
  questionId: string;
  startTime: string; // ISO timestamp
}

export interface TabSwitchMonitorState {
  tabSwitchCount: number;
  warningsShown: number;
  isTerminated: boolean;
  terminationReason: 'TAB_SWITCH_LIMIT_EXCEEDED' | null;
}

export const TAB_SWITCH_LIMIT = 2 // Maximum allowed tab switches
