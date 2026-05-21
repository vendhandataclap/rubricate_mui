/**
 * api.ts — Central API service for the Rubricate platform.
 *
 * All fetch calls go to /api/* which Vite proxies to http://localhost:5000/*
 * stripping the /api prefix. Adapter functions normalise Directus-shaped
 * payloads to the exact frontend TypeScript types.
 */
import type {
  Question, Expert, Assessment, AssessmentResponse, DashboardStats,
  QuestionType, DifficultyTier, QuestionStatus, AIRecommendation,
  RecruiterDecision, Domain, Subdomain, Recruiter,CompanyUser,
  GradingRecord, GradingReport, Job,
} from '../types'
import { API_BASE_URL } from './env'

const BASE = API_BASE_URL

// ---------------------------------------------------------------------------
// Core HTTP helpers
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

// Helper to get stored authentication token
function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem('rubricate_auth')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.token || null
  } catch {
    return null
  }
}

function getStoredUserId(): string | null {
  try {
    const raw = localStorage.getItem('rubricate_auth')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.user?.id ? String(parsed.user.id) : null
  } catch {
    return null
  }
}

async function http<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers ?? {}) },
    ...opts,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || body.success === false) {
    throw new ApiError(res.status, body.message ?? `HTTP ${res.status}`)
  }
  // Flask returns { success: true, data: ... }
  return ('data' in body ? body.data : body) as T
}

// Authenticated HTTP for endpoints that require Bearer token
async function authHttp<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getStoredToken()
  if (!token) {
    throw new ApiError(401, 'No authentication token found')
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...(opts.headers ?? {}),
  }
  
  const res = await fetch(BASE + path, {
    headers,
    ...opts,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || body.success === false) {
    throw new ApiError(res.status, body.message ?? `HTTP ${res.status}`)
  }
  return ('data' in body ? body.data : body) as T
}

const authGet = <T>(path: string, params?: Record<string, string | number | undefined>) => {
  if (params) {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== '' && v !== null)
          .map(([k, v]) => [k, String(v)])
      )
    ).toString()
    if (qs) path += '?' + qs
  }
  return authHttp<T>(path)
}

const get  = <T>(path: string, params?: Record<string, string | number | undefined>) => {
  if (params) {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== '' && v !== null)
          .map(([k, v]) => [k, String(v)])
      )
    ).toString()
    if (qs) path += '?' + qs
  }
  return http<T>(path)
}

const post  = <T>(path: string, body: unknown) =>
  http<T>(path, { method: 'POST', body: JSON.stringify(body) })

const authPost = <T>(path: string, body: unknown) =>
  authHttp<T>(path, { method: 'POST', body: JSON.stringify(body) })

const patch = <T>(path: string, body: unknown) =>
  http<T>(path, { method: 'PATCH', body: JSON.stringify(body) })

const authPatch = <T>(path: string, body: unknown) =>
  authHttp<T>(path, { method: 'PATCH', body: JSON.stringify(body) })

const del = <T>(path: string) =>
  http<T>(path, { method: 'DELETE' })

const authDel = <T>(path: string) =>
  authHttp<T>(path, { method: 'DELETE' })

// ---------------------------------------------------------------------------
// Field adapters – Directus raw → Frontend types
// ---------------------------------------------------------------------------

/**
 * Extract a string ID from either a plain value or a Directus relation object.
 * Always return a string to avoid numeric/string mismatches between responses.
 */
function rid(val: string | number | { id: string | number } | null | undefined): string {
  if (val === null || val === undefined || val === '') return ''
  if (typeof val === 'object') return String((val as any).id ?? '')
  return String(val)
}

function splitToArray(val: string | string[] | null | undefined): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val.filter(Boolean)
  return val.split('\n').map(s => s.trim()).filter(Boolean)
}

function normalizeStringList(val: unknown): string[] {
  if (!val) return []
  if (Array.isArray(val)) {
    return val.map(item => String(item).trim()).filter(Boolean)
  }
  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.map(item => String(item).trim()).filter(Boolean)
      }
    } catch {
      // Fall through to text parsing.
    }
    if (trimmed.includes('\n')) {
      return splitToArray(trimmed)
    }
    return trimmed.split(',').map(s => s.trim()).filter(Boolean)
  }
  return []
}

function toOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function normalizeChoices(raw: unknown): Question['choices'] | undefined {
  if (!Array.isArray(raw)) return undefined

  const mapped = raw
    .map((item, idx) => {
      if (item && typeof item === 'object') {
        const text = String((item as any).text ?? '').trim()
        if (!text) return null
        return {
          id: String((item as any).id ?? idx + 1),
          text,
          is_correct: Boolean((item as any).is_correct),
        }
      }

      const text = String(item ?? '').trim()
      if (!text) return null
      return {
        id: String(idx + 1),
        text,
        is_correct: false,
      }
    })
    .filter(Boolean) as NonNullable<Question['choices']>

  return mapped.length ? mapped : undefined
}

function normalizeRankingItems(raw: unknown): Question['ranking_items'] | undefined {
  if (!Array.isArray(raw)) return undefined

  const mapped = raw
    .map((item, idx) => {
      if (item && typeof item === 'object') {
        const text = String((item as any).text ?? '').trim()
        if (!text) return null
        const orderRaw = (item as any).correct_order
        const correct_order = Number.isFinite(Number(orderRaw)) ? Number(orderRaw) : idx + 1
        return {
          id: String((item as any).id ?? idx + 1),
          text,
          correct_order,
        }
      }

      const text = String(item ?? '').trim()
      if (!text) return null
      return {
        id: String(idx + 1),
        text,
        correct_order: idx + 1,
      }
    })
    .filter(Boolean) as NonNullable<Question['ranking_items']>

  return mapped.length ? mapped : undefined
}

function parseComparisonContext(rawContext: unknown): { contextA?: string; contextB?: string } {
  const contextText = String(rawContext ?? '').trim()
  if (!contextText) return {}

  try {
    const parsed = JSON.parse(contextText)
    if (parsed && typeof parsed === 'object') {
      const contextA = String((parsed as any).context_a ?? '').trim()
      const contextB = String((parsed as any).context_b ?? '').trim()
      return {
        contextA: contextA || undefined,
        contextB: contextB || undefined,
      }
    }
  } catch {
    // Not JSON, keep raw text as context A.
  }

  return { contextA: contextText }
}

export function adaptQuestion(q: Record<string, unknown>): Question {
  const bankRaw   = q.bank_id as any
  const domainRaw = q.domain_id ?? (bankRaw && typeof bankRaw === 'object' ? bankRaw.domain_id : null) as any
  const subRaw    = q.subdomain_id ?? (bankRaw && typeof bankRaw === 'object' ? bankRaw.subdomain_id : null) as any
  const diffTier  = q.difficulty_tier ?? q.difficulty ?? (bankRaw && typeof bankRaw === 'object' ? bankRaw.difficulty_tier : 'mid')
  const domainName = (q.domain_name as string | undefined)
    ?? (typeof domainRaw === 'object' ? (domainRaw?.name as string | undefined) : undefined)
  const subdomainName = (q.subdomain_name as string | undefined)
    ?? (typeof subRaw === 'object' ? (subRaw?.name as string | undefined) : undefined)
  const normalizedType = String(q.type ?? q.question_type ?? 'open_text') as QuestionType
  const normalizedChoices = normalizeChoices(q.choices ?? q.option_json ?? q.options)
  const normalizedRankingItems = normalizeRankingItems(q.ranking_items ?? q.option_json)
  const comparisonContext = parseComparisonContext(q.context_a ?? q.context)
  return {
    id:                String(q.id ?? ''),
    domain_id:         rid(domainRaw),
    subdomain_id:      rid(subRaw) || null,
    question_type:     normalizedType,
    difficulty_tier:   (diffTier as DifficultyTier),
    status:            ((q.status ?? 'draft') as QuestionStatus),
    prompt:            (q.prompt as string) ?? '',
    context_a:         (q.context_a ?? comparisonContext.contextA ?? q.context ?? '') as string,
    context_b:         (q.context_b ?? comparisonContext.contextB ?? '') as string,
    choices:           normalizedChoices,
    ranking_items:     normalizedRankingItems,
    grading_rubric:    (q.grading_rubric ?? '') as string,
    max_score:         (q.max_score ?? 10) as number,
    time_limit_minutes: (q.time_limit_minutes ?? 15) as number,
    min_response_length: (q.min_response_length ?? 200) as number,
    tags:              Array.isArray(q.tags) ? (q.tags as string[]) : [],
    created_at:        (q.date_created ?? q.created_at ?? '') as string,
    updated_at:        (q.date_updated ?? q.updated_at ?? '') as string,
    // Preserve domain/subdomain names for display without extra lookups
    _domain_name:      domainName,
    _subdomain_name:   subdomainName,
  } as Question & { _domain_name?: string; _subdomain_name?: string }
}
export function adaptExpert(e: Record<string, unknown>): Expert {
  const firstName = (e.first_name ?? '') as string
  const lastName  = (e.last_name ?? '') as string
  const fullName  = (e.name ?? e.full_name ?? `${firstName} ${lastName}`.trim()) as string
  const domainRaw = e.domain_id as any
  const subdomainRaw = e.subdomain_id as any
  const details = (e.userdetails ?? {}) as Record<string, unknown>

  return {
    id:                  String(e.id ?? ''),
    full_name:           fullName || (e.email as string) || '',
    email:               (e.email ?? '') as string,
    primary_domain_id:   rid(domainRaw),
    primary_domain_name: typeof domainRaw === 'object' ? (domainRaw?.name as string) : undefined,
    subdomain_id:        rid(subdomainRaw) || null,
    subdomain_name:      typeof subdomainRaw === 'object' ? (subdomainRaw?.name as string) : undefined,
    seniority_level:     (e.seniority_level ?? e.experience ?? details.experience ?? details.experience_level ?? e.experience_level ?? null) as DifficultyTier | null,
    years_experience:    (e.years_experience ?? e.work_experience ?? 0) as number,
    onboarding_status:   (e.onboarding_status ?? e.status ?? 'profile_complete') as Expert['onboarding_status'],
    profile_completed_at: (e.profile_completed_at ?? e.date_created ?? e.last_access ?? '') as string,
    created_at:          (e.date_created ?? e.last_access ?? '') as string,
    country:             (e.country ?? null) as string | null,
    role:                (e.role ?? e.user_type ?? undefined) as string | undefined,
    userdetails:         (e.userdetails ?? null) as Record<string, any>,
    // Preserve all raw fields for flexible access
    ...(e as Record<string, any>),
  }
}
export function adaptAssessment(a: Record<string, unknown>): Assessment {
  const expertRaw = a.expert_id ?? a.expert
  const rec = ((a.ai_recommendation ?? '') as string).toLowerCase() || null
  const rawMaxPossible = Number(a.max_possible_score)
  const rawTotal = Number(a.total_score)
  const rawPercentage = Number(a.percentage_score ?? a.percentage)
  const derivedMaxPossible =
    Number.isFinite(rawTotal) && Number.isFinite(rawPercentage) && rawPercentage > 0
      ? Math.round((rawTotal * 100) / rawPercentage)
      : NaN
  const maxPossibleScore = Number.isFinite(rawMaxPossible) && rawMaxPossible > 0
    ? rawMaxPossible
    : Number.isFinite(derivedMaxPossible) && derivedMaxPossible > 0
      ? derivedMaxPossible
      : 100
  return {
    id:                String(a.id ?? ''),
    expert_id:         expertRaw ? rid(expertRaw as any) : '',
    expert:            expertRaw && typeof expertRaw === 'object'
                         ? adaptExpert(expertRaw as Record<string, unknown>)
                         : undefined,
    domain_id:         rid(a.domain_id as any),
    difficulty_tier:   ((a.seniority_level ?? a.difficulty_tier ?? 'mid') as DifficultyTier),
    assessment_mode:   (a.assessment_mode ?? null) as Assessment['assessment_mode'],
    status:            (a.status ?? 'assigned') as Assessment['status'],
    max_possible_score: maxPossibleScore,
    total_score:       (a.total_score ?? null) as number | null,
    percentage:        (a.percentage_score ?? a.percentage ?? null) as number | null,
    ai_recommendation: rec as AIRecommendation | null,
    ai_summary:        (a.ai_summary ?? null) as string | null,
    strengths:         a.ai_strengths
                         ? splitToArray(a.ai_strengths as string)
                         : Array.isArray(a.strengths)
                             ? a.strengths as string[]
                             : null,
    gaps:              a.ai_gaps
                         ? splitToArray(a.ai_gaps as string)
                         : Array.isArray(a.gaps)
                             ? a.gaps as string[]
                             : null,
    recruiter_decision: (a.recruiter_decision ?? null) as RecruiterDecision,
    recruiter_id:      (a.recruiter_id ?? null) as string | null,
    recruiter_notes:   (a.recruiter_notes ?? null) as string | null,
    decided_at:        (a.reviewed_at ?? a.decided_at ?? null) as string | null,
    flag_count:        (a.flag_count ?? 0) as number,
    question_count:    (a.question_count ?? 0) as number,
    started_at:        (a.started_at ?? null) as string | null,
    submitted_at:      (a.submitted_at ?? null) as string | null,
    time_taken_minutes: a.time_taken_minutes !== undefined && a.time_taken_minutes !== null
      ? Number(a.time_taken_minutes)
      : null,
    graded_at:         (a.graded_at ?? null) as string | null,
    expires_at:        (a.expires_at ?? '') as string,
    assigned_at:       (a.assigned_at ?? null) as string | null,
    created_at:        (a.date_created ?? a.created_at ?? '') as string,
    // preserve domain name
    _domain_name:      typeof a.domain_id === 'object' ? (a.domain_id as any)?.name : undefined,
  } as Assessment & { _domain_name?: string }
}

export function adaptGradingRecord(record: Record<string, unknown>): GradingRecord {
  const toNum = (value: unknown) => {
    if (value === null || value === undefined || value === '') return null
    const num = Number(value)
    return Number.isFinite(num) ? num : null
  }

  const rawMeta = record.meta
  let meta = rawMeta
  if (typeof rawMeta === 'string') {
    try {
      meta = JSON.parse(rawMeta)
    } catch {
      meta = null
    }
  }

  return {
    id: String(record.id ?? ''),
    profile_component_score: toNum(record.profile_component_score),
    assessment_component_score: toNum(record.assessment_component_score),
    overall_score: toNum(record.overall_score),
    grading_status: (record.grading_status ?? null) as string | null,
    updated_at: (record.updated_at ?? null) as string | null,
    created_at: (record.created_at ?? null) as string | null,
    meta: (meta && typeof meta === 'object') ? (meta as GradingRecord['meta']) : null,
  }
}

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String)
  }
  if (typeof value === 'string') {
    return value
      .split('\n')
      .map(item => item.replace(/^[-*\s]+/, '').trim())
      .filter(Boolean)
  }
  return []
}

const toDimensionScores = (value: unknown): GradingReport['dimension_scores'] => {
  let parsed = value
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value)
    } catch {
      parsed = null
    }
  }
  if (!Array.isArray(parsed)) return []
  return parsed.map((item: any) => ({
    name: String(item?.name ?? ''),
    score: Number(item?.score ?? 0),
    weight: Number(item?.weight ?? 0),
    evidence: item?.evidence ?? null,
    reasoning: item?.reasoning ?? null,
  }))
}

export function adaptGradingReport(record: Record<string, unknown>): GradingReport {
  return {
    id: String(record.id ?? ''),
    assessment_id: String(record.assessment_id ?? ''),
    assessment_type: (record.assessment_type ?? null) as string | null,
    candidate_id: (record.candidate_id ?? null) as string | null,
    grading_status: (record.grading_status ?? null) as string | null,
    grading_model: (record.grading_model ?? null) as string | null,
    graded_at: (record.graded_at ?? null) as string | null,
    date_created: (record.date_created ?? null) as string | null,
    date_updated: (record.date_updated ?? null) as string | null,
    session_id: (record.session_id ?? null) as string | null,
    error_message: (record.error_message ?? null) as string | null,
    hiring_recommendation: (record.hiring_recommendation ?? null) as string | null,
    overall_score: record.overall_score !== undefined && record.overall_score !== null
      ? Number(record.overall_score)
      : null,
    summary: (record.summary ?? null) as string | null,
    strengths: toStringArray(record.strengths),
    areas_for_improvement: toStringArray(record.areas_for_improvement),
    dimension_scores: toDimensionScores(record.dimension_scores),
  }
}
export function adaptAssessmentResponse(r: Record<string, unknown>): AssessmentResponse {
  const qRaw = r.question_id ?? r.question
  return {
    id:             String(r.id ?? ''),
    assessment_id:  (r.assessment_id ?? '') as string,
    question_id:    qRaw ? rid(qRaw as any) : '',
    question:       qRaw && typeof qRaw === 'object'
                      ? adaptQuestion(qRaw as Record<string, unknown>)
                      : undefined,
    order_index:    (r.order_index ?? 0) as number,
    response_text:  (r.response_text ?? '') as string,
    ai_score:       (r.ai_score ?? null) as number | null,
    override_score: (r.recruiter_score_override ?? r.override_score ?? null) as number | null,
    ai_feedback:    (r.ai_feedback ?? null) as string | null,
    ai_reasoning:   (r.ai_reasoning ?? null) as string | null,
    recruiter_feedback: (r.recruiter_feedback ?? null) as string | null,
    is_flagged:     (r.flag ?? r.ai_flag ?? r.is_flagged ?? false) as boolean,
    flag_reason:    (r.flag_reason ?? r.ai_flag_reason ?? null) as string | null,
    submitted_at:   (r.submitted_at ?? null) as string | null,
  }
}

export function adaptDomain(d: Record<string, unknown>): Domain {
  return {
    id:          String(d.id ?? ''),
    name:        (d.name ?? '') as string,
    description: (d.description ?? '') as string,
    created_at:  (d.date_created ?? d.created_at ?? '') as string,
  }
}

export function adaptSubdomain(s: Record<string, unknown>): Subdomain {
  return {
    id:          String(s.id ?? ''),
    domain_id:   rid(s.domain_id as any),
    name:        (s.name ?? '') as string,
    description: (s.description ?? '') as string,
    created_at:  (s.date_created ?? s.created_at ?? '') as string,
  }
}

export function adaptRecruiter(r: Record<string, unknown>): Recruiter {
  return {
    id:          String(r.id ?? ''),
    full_name:   (r.full_name || `${r.first_name || ''} ${r.last_name || ''}`.trim()) as string,
    email:       (r.email ?? '') as string,
    phone:       (r.phone ?? '') as string,
    company:     (r.company_id ?? '') as string,
    domain_ids:  [],
    status:      (r.status ?? 'pending') as Recruiter['status'],
    created_at:  (r.created_at ?? r.date_created ?? new Date().toISOString()) as string,
    invited_at:  (r.invited_at ?? null) as string | null,
    accepted_at: (r.accepted_at ?? null) as string | null,
  }
}

export function adaptCompanyUser(row: Record<string, unknown>): CompanyUser {
  const name = String(
    row.name
    ?? row.full_name
    ?? `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim()
    ?? row.email
    ?? ''
  )

  const companyRaw = row.company ?? row.company_id
  const roleRaw = row.role ?? row.role_id

  const company = typeof companyRaw === 'object'
    ? String((companyRaw as any)?.name ?? (companyRaw as any)?.title ?? (companyRaw as any)?.id ?? '')
    : String(companyRaw ?? '')

  const role = typeof roleRaw === 'object'
    ? String((roleRaw as any)?.name ?? (roleRaw as any)?.slug ?? (roleRaw as any)?.id ?? '')
    : String(roleRaw ?? '')

  const statusRaw = String(row.status ?? '').toLowerCase()
  const status = statusRaw || ((row.is_active === false) ? 'inactive' : 'active')

  return {
    id: String(row.id ?? ''),
    name,
    email: String(row.email ?? ''),
    company,
    role,
    status,
    created_at: String(row.created_at ?? row.date_created ?? ''),
    assignments_count: Number(row.assignments_count ?? 0),
    last_active: (row.last_active ?? row.last_access ?? null) as string | null,
    raw: row,
  }
}

export function adaptJob(job: Record<string, unknown>): Job {
  return {
    id: String(job.id ?? ''),
    status: (job.status ?? null) as string | null,
    title: String(job.title ?? ''),
    description: (job.description ?? null) as string | null,
    category: (job.category ?? null) as string | null,
    subdomain: (job.subdomain ?? null) as string | null,
    experience_level: (job.experience_level ?? null) as string | null,
    education: (job.education ?? null) as string | null,
    location: (job.location ?? null) as string | null,
    work_type: (job.work_type ?? null) as string | null,
    budget_type: (job.budget_type ?? null) as string | null,
    budget_min: toOptionalNumber(job.budget_min),
    budget_max: toOptionalNumber(job.budget_max),
    duration: (job.duration ?? null) as string | null,
    start_date: (job.start_date ?? null) as string | null,
    required_skills: normalizeStringList(job.required_skills),
    preferred_skills: normalizeStringList(job.preferred_skills),
    application_deadline: (job.application_deadline ?? null) as string | null,
    application_questions: normalizeStringList(job.application_questions),
    visibility: (job.visibility ?? null) as string | null,
    company_id: (job.company_id ?? null) as string | null,
    posted_by: (job.posted_by ?? null) as string | null,
    views: toOptionalNumber(job.views),
    applications: toOptionalNumber(job.applications),
    is_archived: (job.is_archived ?? null) as boolean | null,
    archived_at: (job.archived_at ?? null) as string | null,
    date_created: (job.date_created ?? job.created_at ?? null) as string | null,
    voiceai_requirement: (job.voiceai_requirement ?? null) as string | null,
    approval_status: (job.approval_status ?? null) as string | null,
    english_assessment: (job.english_assessment ?? null) as number | null,
    ...job,
  }
}
// ---------------------------------------------------------------------------
// Frontend Question → Backend payload
// ---------------------------------------------------------------------------

export function toBackendQuestion(q: Partial<Question>): Record<string, unknown> {
  const p: Record<string, unknown> = {}
  if (q.prompt            !== undefined) p.prompt              = q.prompt
  if (q.grading_rubric    !== undefined) p.grading_rubric      = q.grading_rubric
  if (q.question_type     !== undefined) p.type                = q.question_type
  if (q.difficulty_tier   !== undefined) p.difficulty          = q.difficulty_tier
  if (q.status            !== undefined) p.status              = q.status
  if (q.domain_id         !== undefined) p.domain_id           = q.domain_id || null
  if (q.subdomain_id      !== undefined) p.subdomain_id        = q.subdomain_id || null
  if (q.context_a         !== undefined) p.context_a           = q.context_a || null
  if (q.context_b         !== undefined) p.context_b           = q.context_b || null
  if (q.choices           !== undefined) p.options             = q.choices    // frontend: choices → backend: options
  if (q.ranking_items     !== undefined) p.ranking_items       = q.ranking_items
  if (q.tags              !== undefined) p.tags                = q.tags
  if (q.max_score         !== undefined) p.max_score           = q.max_score
  if (q.time_limit_minutes !== undefined) p.time_limit_minutes = q.time_limit_minutes
  if (q.min_response_length !== undefined) p.min_response_length = q.min_response_length
  return p
}

// ---------------------------------------------------------------------------
// Admin API
// ---------------------------------------------------------------------------

export interface QuestionsParams {
  domain?:     string
  subdomain?:  string
  difficulty?: string
  status?:     string
  type?:       string
  search?:     string
  page?:       number
  limit?:      number
  per_page?:   number
  pagination?: number
}

export interface QuestionsResult {
  questions:   Question[]
  total:       number
  domainNames: Record<string, string>
  subNames:    Record<string, string>
}

export interface RecruiterCreatePayload {
  company_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  title?: string
  department?: string
  notes?: string
  status?: 'pending' | 'active' | 'inactive' | 'invited'
  is_active?: boolean
}

export interface CompanyUsersParams {
  role?: string
  role_id?: string
  search?: string
  status?: string
  company?: string
  limit?: number
  offset?: number
}

export interface CompanyUsersResult {
  items: CompanyUser[]
  total: number
  limit: number
  offset: number
}

export interface JobsResult {
  items: Job[]
  total: number
  limit: number
  offset: number
}

export interface CompletedTask {
  id: string | number
  status?: string
  ls_task_id?: string | number | null
  project_id?: string | number | null
  done_by?: string | null
  data?: unknown
  output?: unknown
  assignments?: unknown
  date_created?: string | null
  date_updated?: string | null
  [key: string]: unknown
}

export interface CompletedTasksResult {
  items: CompletedTask[]
  total: number
  limit: number
  offset: number
}

export interface Project {
  id: string | number
  ls_project_id?: string | number | null
  project_name?: string | null
  status?: string
  created_by?: string | null
  [key: string]: unknown
}

export interface ProjectsResult {
  items: Project[]
  total: number
  limit: number
  offset: number
}

export interface ProjectTask {
  id: string | number
  ls_task_id?: string | number | null
  project_id?: string | number | null
  done_by?: string | null
  status?: string
  completed_at?: string | null
  date_created?: string | null
  date_updated?: string | null
  [key: string]: unknown
}

export interface ProjectTasksResult {
  items: ProjectTask[]
  total: number
  limit: number
  offset: number
}

export const adminApi = {

  getStats: (): Promise<DashboardStats> =>
    get<DashboardStats>('/admin/stats'),

  getDomains: (): Promise<{ domains: Domain[]; subdomains: Subdomain[] }> =>
    get<any>('/admin/domains').then(raw => ({
      domains:    (raw.domains    ?? []).map(adaptDomain),
      subdomains: (raw.subdomains ?? []).map(adaptSubdomain),
    })),

  getQuestions: (params: QuestionsParams = {}): Promise<QuestionsResult> =>
    get<any>('/admin/questions', params as Record<string, string | number>).then(raw => {
      const items: any[] = Array.isArray(raw) ? raw : (raw?.data ?? raw ?? [])
      const questions    = items.map(adaptQuestion) as Array<Question & { _domain_name?: string; _subdomain_name?: string }>
      const total        = (raw?.meta?.filter_count ?? raw?.meta?.total_count ?? items.length) as number
      const domainNames: Record<string, string> = {}
      const subNames:    Record<string, string> = {}
      items.forEach(q => {
        const bank = q.bank_id && typeof q.bank_id === 'object' ? q.bank_id : null
        const dom = q.domain_id ?? bank?.domain_id
        const sub = q.subdomain_id ?? bank?.subdomain_id
        const domId = rid(dom as any)
        const subId = rid(sub as any)
        const domName = (q.domain_name as string | undefined)
          ?? (typeof dom === 'object' ? (dom?.name as string | undefined) : undefined)
        const subName = (q.subdomain_name as string | undefined)
          ?? (typeof sub === 'object' ? (sub?.name as string | undefined) : undefined)
        if (domId && domName) domainNames[domId] = domName
        if (subId && subName) subNames[subId] = subName
      })
      return { questions, total, domainNames, subNames }
    }),

  getQuestion: (id: string): Promise<Question> =>
    get<any>(`/admin/questions/${id}`).then(adaptQuestion),

  createQuestion: (data: Partial<Question>): Promise<Question> =>
    post<any>('/admin/questions', toBackendQuestion(data)).then(adaptQuestion),

  updateQuestion: (id: string, data: Partial<Question>): Promise<Question> =>
    patch<any>(`/admin/questions/${id}`, toBackendQuestion(data)).then(adaptQuestion),

  bulkUpdate: (ids: string[], action: 'activate' | 'archive') =>
    post<any>('/admin/questions/bulk-update', { ids, action }),

  importQuestions: (file: File): Promise<any> => {
    const formData = new FormData()
    formData.append('file', file)
    return fetch(BASE + '/admin/questions/import', {
      method: 'POST',
      body: formData,
    }).then(async res => {
      const body = await res.json().catch(() => ({}))
      if (!res.ok || body.success === false) {
        throw new ApiError(res.status, body.message ?? `HTTP ${res.status}`)
      }
      return ('data' in body ? body.data : body) as any
    })
  },

  previewQuestion: (id: string): Promise<Question> =>
    get<any>(`/admin/questions/${id}/preview`).then(adaptQuestion),

  createDomain: (name: string, description?: string): Promise<Domain> =>
    post<any>('/admin/domains', { name, description }).then(adaptDomain),

  updateDomain: (id: string, name?: string, description?: string): Promise<Domain> =>
    patch<any>(`/admin/domains/${id}`, { name, description }).then(adaptDomain),

  deleteDomain: (id: string): Promise<void> =>
    del<void>(`/admin/domains/${id}`),

  createSubdomain: (domain_id: string, name: string, description?: string): Promise<Subdomain> =>
    post<any>('/admin/subdomains', { domain_id, name, description }).then(adaptSubdomain),

  updateSubdomain: (id: string, name?: string, description?: string): Promise<Subdomain> =>
    patch<any>(`/admin/subdomains/${id}`, { name, description }).then(adaptSubdomain),

  deleteSubdomain: (id: string): Promise<void> =>
    del<void>(`/admin/subdomains/${id}`),

  getSubdomains: (domain_id?: string): Promise<Subdomain[]> =>
    get<any[]>('/admin/subdomains', domain_id ? { domain_id } : undefined).then(list => {
      const rows = Array.isArray(list) ? list : []
      return rows.map(adaptSubdomain)
    }),

  getRecruiters: (company_id?: string): Promise<Recruiter[]> =>
    get<any[]>('/recruiters', company_id ? { company_id } : undefined).then(list => {
      const rows = Array.isArray(list) ? list : []
      return rows.map(adaptRecruiter)
    }),

  createJob: (data: Partial<Job>): Promise<Job> =>
    authPost<any>('/admin/jobs', data).then(adaptJob),

  updateJob: (id: string, data: Partial<Job>): Promise<Job> =>
    authPatch<any>(`/admin/jobs/${id}`, data).then(adaptJob),

  getJobs: (params: { limit?: number; offset?: number } = {}): Promise<JobsResult> =>
    get<any>('/admin/jobs', params as Record<string, string | number>).then(raw => {
      const data = (raw && typeof raw === 'object' && 'items' in raw)
        ? raw
        : (raw?.data && typeof raw.data === 'object' ? raw.data : raw)
      const itemsRaw: any[] = Array.isArray((data as any)?.items)
        ? (data as any).items
        : Array.isArray(data)
          ? (data as any)
          : []
      return {
        items: itemsRaw.map(adaptJob),
        total: Number((data as any)?.total ?? raw?.meta?.filter_count ?? raw?.meta?.total_count ?? itemsRaw.length ?? 0),
        limit: Number((data as any)?.limit ?? params.limit ?? 50),
        offset: Number((data as any)?.offset ?? params.offset ?? 0),
      }
    }),
  getCompanyUsers: (params: CompanyUsersParams = {}): Promise<CompanyUsersResult> =>
    authGet<any>('/admin/company-users', params as Record<string, string | number>).then(raw => {
      const itemsRaw: any[] = Array.isArray(raw?.items) ? raw.items : []
      return {
        items: itemsRaw.map(adaptCompanyUser),
        total: Number(raw?.total ?? itemsRaw.length ?? 0),
        limit: Number(raw?.limit ?? params.limit ?? 20),
        offset: Number(raw?.offset ?? params.offset ?? 0),
      }
    }),

  getCompanyUser: (id: string): Promise<CompanyUser> =>
    authGet<any>(`/admin/company-users/${id}`).then(adaptCompanyUser),

  updateCompanyUser: (id: string, data: { name?: string; email?: string; status?: string }): Promise<CompanyUser> =>
    authPatch<any>(`/admin/company-users/${id}`, data).then(adaptCompanyUser),

  disableCompanyUser: (id: string): Promise<CompanyUser> =>
    authPatch<any>(`/admin/company-users/${id}`, { status: 'inactive' }).then(adaptCompanyUser),

  activateCompanyUser: (id: string): Promise<CompanyUser> =>
    authPatch<any>(`/admin/company-users/${id}`, { status: 'active' }).then(adaptCompanyUser),

  deleteCompanyUser: (id: string): Promise<void> =>
    authDel<void>(`/admin/company-users/${id}`),

  createRecruiter: (payload: RecruiterCreatePayload): Promise<Recruiter> =>
    post<any>('/recruiters', payload).then(adaptRecruiter),

  updateRecruiter: (id: string, data: Record<string, unknown>): Promise<Recruiter> =>
    patch<any>(`/recruiters/${id}`, data).then(adaptRecruiter),

  deleteRecruiter: (id: string): Promise<void> =>
    del<void>(`/recruiters/${id}`),

  resendInvitation: (id: string): Promise<void> =>
    post<void>(`/recruiters/${id}/resend-invitation`, {}),

  getExperts: (): Promise<{ experts: Expert[] }> =>
    get<any>('/admin/experts').then(raw => ({
      experts: (Array.isArray(raw.users) ? raw.users : []).map(adaptExpert),
    })),

  getCompletedTasks: (params: { limit?: number; offset?: number } = {}): Promise<CompletedTasksResult> =>
    get<any>('/admin/completed-tasks', params as Record<string, string | number>).then(raw => {
      const itemsRaw: any[] = Array.isArray(raw?.items) ? raw.items : []
      return {
        items: itemsRaw as CompletedTask[],
        total: Number(raw?.total ?? itemsRaw.length ?? 0),
        limit: Number(raw?.limit ?? params.limit ?? 50),
        offset: Number(raw?.offset ?? params.offset ?? 0),
      }
    }),

  getProjectsByCreator: (createdBy: string, params: { limit?: number; offset?: number } = {}): Promise<ProjectsResult> =>
    get<any>('/admin/projects-by-creator', { ...params, created_by: createdBy } as Record<string, string | number>).then(raw => {
      const itemsRaw: any[] = Array.isArray(raw?.items) ? raw.items : []
      return {
        items: itemsRaw as Project[],
        total: Number(raw?.total ?? itemsRaw.length ?? 0),
        limit: Number(raw?.limit ?? params.limit ?? 100),
        offset: Number(raw?.offset ?? params.offset ?? 0),
      }
    }),

  getTasksByProject: (projectId: string, params: { limit?: number; offset?: number } = {}): Promise<ProjectTasksResult> =>
    get<any>('/admin/tasks-by-project', { ...params, project_id: projectId } as Record<string, string | number>).then(raw => {
      const itemsRaw: any[] = Array.isArray(raw?.items) ? raw.items : []
      return {
        items: itemsRaw as ProjectTask[],
        total: Number(raw?.total ?? itemsRaw.length ?? 0),
        limit: Number(raw?.limit ?? params.limit ?? 100),
        offset: Number(raw?.offset ?? params.offset ?? 0),
      }
    }),

  getAssignments: (params: any = {}): Promise<AssessmentsResult> =>
    get<any>('/recruiter/assessments', params as Record<string, string | number>).then(raw => {
      const items: any[] = Array.isArray(raw) ? raw : (raw?.data ?? raw ?? [])
      return {
        assessments: items.map(adaptAssessment),
        total:       (raw?.meta?.filter_count ?? raw?.meta?.total_count ?? items.length) as number,
      }
    }),
  getCurrentUser: (): Promise<{ id: string; email: string; first_name: string; last_name: string; role?: string; role_id?: string; last_access?: string; company?: string; company_id?: string }> =>
  //getCurrentUser: (): Promise<{ id: string; email: string; first_name: string; last_name: string; role?: string; last_access?: string }> =>
    authGet<any>('/auth/me'),
}

// ---------------------------------------------------------------------------
// Recruiter API
// ---------------------------------------------------------------------------

export interface AssessmentsParams {
  domain?:             string
  status?:             string
  ai_recommendation?:  string
  recruiter_decision?: string
  page?:               number
  limit?:              number
}

export interface AssessmentsResult {
  assessments: Assessment[]
  total:       number
}

export interface DecisionPayload {
  decision:       RecruiterDecision
  notes?:         string
  recruiter_score?: number
  recruiter_id?:  string
  score_overrides?: { response_id: string; score?: number; feedback?: string }[]
}
export interface ApplicationStatusPayload {
  decision: 'approved' | 'rejected'
}

export interface AssignmentPayload {
  domain_id: string
  subdomain_id?: string
  difficulty_tier?: string
  question_ids?: string[]
  expires_days?: number
  time_limit_minutes?: number
}

export interface QuestionsForAssignmentParams {
  domain_id: string
  subdomain_id?: string
  difficulty_tier?: string
  total_questions?: number
  question_type_limits?: Record<string, number>
  auto_balance?: boolean
}

export interface QuestionsForAssignmentResult {
  questions: Question[]
  metadata?: {
    total_requested: number
    total_fetched: number
    total_available?: number
    type_limits: Record<string, number>
    questions_by_type: Record<string, number>
    auto_balanced: boolean
    all_types_available: string[]
    warning?: string
  }
}

export const recruiterApi = {

  getExperts: (): Promise<{ experts: Expert[] }> =>
    get<any>('/recruiter/experts').then(raw => ({
      experts: (Array.isArray(raw.users) ? raw.users : []).map(adaptExpert),
    })),

  getApprovedExperts: (): Promise<{ experts: Expert[] }> =>
    recruiterApi.getExperts().then(({ experts }) => ({
      experts: experts.filter((expert) => String(expert.application_status || '').toLowerCase() === 'approved'),
    })),

  getQuestionsForAssignment: (params: QuestionsForAssignmentParams): Promise<QuestionsForAssignmentResult> =>
    post<any>('/recruiter/questions-for-assignment', {
      domain_id: params.domain_id,
      subdomain_id: params.subdomain_id,
      difficulty_tier: params.difficulty_tier,
      total_questions: params.total_questions ?? 10,
      question_type_limits: params.question_type_limits ?? {},
      auto_balance: params.auto_balance ?? true,
    }).then(raw => {
      const data = raw?.data ?? raw
      const items: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.questions)
          ? data.questions
          : []
      return {
        questions: items.map(adaptQuestion),
        metadata: data?.metadata || undefined,
      }
    }),
    
  getAssessments: (params: AssessmentsParams = {}): Promise<AssessmentsResult> =>
    get<any>('/recruiter/assessments', params as Record<string, string | number>).then(raw => {
      const items: any[] = Array.isArray(raw) ? raw : (raw?.data ?? raw ?? [])
      return {
        assessments: items.map(adaptAssessment),
        total:       (raw?.meta?.filter_count ?? raw?.meta?.total_count ?? items.length) as number,
      }
    }),

  getAssessmentDetail: (id: string): Promise<{ assessment: Assessment; responses: AssessmentResponse[]; grading: GradingRecord | null; grading_reports: GradingReport[] }> =>
    get<any>(`/recruiter/assessment/${id}`).then(raw => ({
      assessment: adaptAssessment(raw.assessment),
      responses:  (raw.responses ?? []).map(adaptAssessmentResponse),
      grading:    raw.grading ? adaptGradingRecord(raw.grading) : null,
      grading_reports: Array.isArray(raw.grading_reports)
        ? raw.grading_reports.map((item: any) => adaptGradingReport(item))
        : [],
    })),

  submitDecision: (id: string, payload: DecisionPayload) => {
    const recruiterId = getStoredUserId()
    const body: DecisionPayload = recruiterId && !payload.recruiter_id
      ? { ...payload, recruiter_id: recruiterId }
      : payload
    return authHttp<any>(`/recruiter/assessment/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  updateScores: (id: string, payload: { score_overrides: { response_id: string; score?: number; feedback?: string }[] }) =>
    authHttp<any>(`/recruiter/assessment/${id}/scores`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  assignAssessment: (expertId: string, payload?: AssignmentPayload) =>
    post<any>(`/recruiter/assign/${expertId}`, payload ?? {}),

  triggerGrading: (id: string) =>
    post<any>(`/recruiter/assessment/${id}/grade`, {}),

  sendTestLink: (id: string) =>
    post<any>(`/recruiter/assessment/${id}/send-link`, {}),

  updateApplicationStatus: (expertId: string, decision: 'approved' | 'rejected') =>
    post<any>(`/recruiter/expert/${expertId}/application-status`, { decision } as ApplicationStatusPayload),
}

// ---------------------------------------------------------------------------
// Test / Candidate API  (no auth required — public endpoints)
// ---------------------------------------------------------------------------

export const testApi = {
  /** Fetch high-level assessment info without email verification. */
  getInfo: (assessmentId: string | number) =>
    get<any>(`/assessments/${assessmentId}`),

  /** Check if the current logged-in user matches the assessment expert. */
  verifySession: (assessmentId: string | number) =>
    authHttp<{ matched: boolean; email: string; expert_name: string }>(
      `/assessments/${assessmentId}/verify-session`,
      { method: 'POST' },
    ),

  /** Verify candidate email and fetch questions. */
  getQuestions: (assessmentId: string | number, email: string) =>
    post<any>(`/assessments/${assessmentId}/questions`, { email }),

  /** Mark the assessment as started. */
  start: (assessmentId: string | number, email: string) =>
    post<any>(`/assessments/${assessmentId}/start`, { email }),

  /** Auto-save a single response. */
  saveResponse: (assessmentId: string | number, responseId: number, response_text: string) =>
    http<any>(`/assessments/${assessmentId}/response/${responseId}`, {
      method: 'PATCH',
      body: JSON.stringify({ response_text }),
    }),

  /** Submit the completed assessment with optional timing data. */
  submit: (assessmentId: string | number, responses: { response_id: number; response_text: string }[], timing?: any) =>
    post<any>(`/assessments/${assessmentId}/submit`, { responses, timing }),
}