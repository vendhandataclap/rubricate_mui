import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, Check, ChevronLeft, ChevronRight, Plus, X, Globe, Lock, Zap, AlertCircle, Eye, Pencil } from 'lucide-react'
import { adminApi } from '../../services/api'
import { useAuth } from '../../services/authContext'
import type { Job, Domain, Subdomain } from '../../types'

/* ─── Helpers ─── */
const formatLabel = (value?: string | null) => {
  const text = String(value ?? '').trim()
  if (!text) return '—'
  return text.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const formatDate = (value?: string | null, withTime = false) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  if (withTime) {
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatRange = (min?: number | null, max?: number | null) => {
  if (min === null || min === undefined) {
    return max === null || max === undefined ? '—' : `Up to ${max}`
  }
  if (max === null || max === undefined) return `${min}+`
  return `${min} - ${max}`
}

const statusBadgeClass = (status?: string | null) => {
  const normalized = String(status ?? '').toLowerCase()
  if (normalized === 'active') return 'badge active'
  if (normalized === 'inactive' || normalized === 'archived') return 'badge archived'
  if (!normalized || normalized === 'draft') return 'badge draft'
  return 'badge info'
}

const approvalBadgeClass = (status?: string | null) => {
  const normalized = String(status ?? '').toLowerCase()
  if (normalized === 'approved') return 'badge approved'
  if (normalized === 'rework') return 'badge review'
  if (normalized === 'rejected') return 'badge rejected'
  if (!normalized || normalized === 'not_approved' || normalized === 'pending') return 'badge draft'
  return 'badge info'
}

const normalizeApproval = (status?: string | null) => {
  const normalized = String(status ?? '').trim().toLowerCase()
  if (normalized === 'rework') return 'rework'
  return normalized === 'approved' ? 'approved' : 'not_approved'
}

const normalizeVoiceAi = (value?: string | null) => {
  const normalized = String(value ?? '').trim().toLowerCase()
  return normalized === 'required' ? 'allow' : 'not_allow'
}

type JobScopeFilter = 'companies' | 'admin'

const normalizeList = (value: unknown): string[] => {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean)
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.map(item => String(item).trim()).filter(Boolean)
      }
    } catch { /* fall through */ }
    if (trimmed.includes('\n')) {
      return trimmed.split('\n').map(item => item.trim()).filter(Boolean)
    }
    return trimmed.split(',').map(item => item.trim()).filter(Boolean)
  }
  return []
}

const lettersAndSpaces = (v: string) => /^[A-Za-z\s]+$/.test(v)

/* ─── Wizard Data Model ─── */
interface JobPostData {
  title: string
  category: string
  subdomain: string
  description: string
  voiceai_requirement: string
  approval_status: string
  experience: string
  education: string
  location: string
  workType: string
  budgetType: string
  budgetMin: number
  budgetMax: number
  duration: string
  startDate: string
  requiredSkills: string[]
  preferredSkills: string[]
  applicationDeadline: string
  applicationQuestions: string[]
  visibility: string
  isPublished?: boolean
  publishedJobId?: string
}

const steps = [
  { id: 1, title: 'Basic Info', description: 'Job title and description' },
  { id: 2, title: 'Requirements', description: 'Experience and qualifications' },
  { id: 3, title: 'Budget & Timeline', description: 'Project scope and budget' },
  { id: 4, title: 'Skills & Expertise', description: 'Required and preferred skills' },
  { id: 5, title: 'Application Process', description: 'How candidates apply' },
  { id: 6, title: 'Review', description: 'Review your job post' },
  { id: 7, title: 'Publish', description: 'Publish your job post' },
]

/* ─── Suggested Data ─── */

const experienceLevels = [
  { value: 'entry', label: 'Entry Level (0-2 years)' },
  { value: 'mid', label: 'Mid Level (2-5 years)' },
  { value: 'senior', label: 'Senior Level (5-8 years)' },
  { value: 'expert', label: 'Expert Level (8+ years)' },
]

const educationLevels = [
  "No formal requirement", "Bachelor's degree", "Master's degree", 'PhD', 'Relevant certifications',
]

const locations = [
  'Remote (Global)', 'Remote (US/Canada only)', 'Remote (Europe only)',
  'United States', 'Canada', 'United Kingdom', 'Germany', 'Singapore', 'Australia', 'Hybrid', 'On-site',
]

const workTypes = [
  { value: 'full-time', label: 'Full-time Employee' },
  { value: 'contract', label: 'Independent Contractor' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'consulting', label: 'Consulting Project' },
]

const budgetTypes = [
  { value: 'hourly', label: 'Hourly Rate' },
  { value: 'fixed', label: 'Fixed Price Project' },
  { value: 'monthly', label: 'Monthly Retainer' },
]

const durations = [
  'Less than 1 month', '1-3 months', '3-6 months', '6-12 months', '12+ months', 'Ongoing',
]

const suggestedSkills = [
  'Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Keras', 'NumPy', 'Pandas',
  'Machine Learning', 'Deep Learning', 'Neural Networks', 'Computer Vision',
  'Natural Language Processing', 'Reinforcement Learning', 'MLOps', 'AutoML',
  'Large Language Models', 'Transformer Models', 'BERT', 'GPT', 'Diffusion Models',
  'Generative AI', 'Image Recognition', 'Object Detection',
  'Speech Recognition', 'Time Series Analysis', 'Recommendation Systems',
  'AWS', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes', 'Apache Spark',
  'Jupyter', 'Git', 'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL', 'Redis',
  'OpenCV', 'spaCy', 'NLTK', 'Hugging Face', 'FastAPI', 'Flask', 'Django',
  'React', 'Node.js', 'JavaScript', 'R', 'Scala', 'Java', 'C++',
]

const suggestedQuestions = [
  'What is your experience with [specific AI/ML technology mentioned in the job]?',
  'Can you share a portfolio or examples of similar projects you\'ve completed?',
  'How would you approach this project? Outline your methodology.',
  'What is your availability and preferred working hours?',
  'Have you worked with teams in [your timezone/region] before?',
  'What questions do you have about the project requirements?',
  'What additional tools or resources would you need for this project?',
  'Can you provide references from previous AI/ML projects?',
]

const visibilityOptions: Array<{ value: string; title: string; description: string; icon: typeof Globe; badge: string | null }> = [
  { value: 'public', title: 'Public', description: 'Visible to all users and search engines', icon: Globe, badge: 'Recommended' },
  { value: 'private', title: 'Private', description: 'Only visible to invited candidates', icon: Lock, badge: null },
  { value: 'featured', title: 'Featured', description: 'Highlighted placement with premium visibility', icon: Zap, badge: 'Premium' },
]

/* ─── Edit Modal Component ─── */
function EditJobModal({ job, onClose, onSaved }: { job: Job; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: job.title || '',
    description: job.description || '',
    category: job.category || '',
    subdomain: job.subdomain || '',
    location: job.location || '',
    experience_level: job.experience_level || '',
    education: job.education || '',
    work_type: job.work_type || '',
    budget_type: job.budget_type || '',
    budget_min: job.budget_min != null ? String(job.budget_min) : '',
    budget_max: job.budget_max != null ? String(job.budget_max) : '',
    duration: job.duration || '',
    status: job.status || 'draft',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!job.id) return
    setIsSaving(true)
    setError(null)
    try {
      const payload: Partial<Job> = {
        title: form.title,
        description: form.description,
        category: form.category,
        subdomain: form.subdomain,
        location: form.location,
        experience_level: form.experience_level,
        education: form.education,
        work_type: form.work_type,
        budget_type: form.budget_type,
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
        duration: form.duration,
        status: form.status,
      }
      await adminApi.updateJob(String(job.id), payload)
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div className="card" style={{
        maxWidth: 640, width: '100%', maxHeight: '90vh', overflow: 'auto',
        padding: 28,
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Edit Job</h2>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        {error && (
          <div style={{ padding: 12, background: 'var(--color-danger-light)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: 13, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label>Job Title</label>
            <input className="form-input" value={form.title} onChange={update('title')} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <input className="form-input" value={form.category} onChange={update('category')} />
            </div>
            <div className="form-group">
              <label>Subdomain</label>
              <input className="form-input" value={form.subdomain} onChange={update('subdomain')} />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-textarea" value={form.description} onChange={update('description')} style={{ minHeight: 100 }} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Location</label>
              <input className="form-input" value={form.location} onChange={update('location')} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select className="form-select" value={form.status} onChange={update('status')}>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="draft">Draft</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Experience Level</label>
              <select className="form-select" value={form.experience_level} onChange={update('experience_level')}>
                <option value="">Select</option>
                {experienceLevels.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Education</label>
              <select className="form-select" value={form.education} onChange={update('education')}>
                <option value="">Select</option>
                {educationLevels.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Work Type</label>
              <select className="form-select" value={form.work_type} onChange={update('work_type')}>
                <option value="">Select</option>
                {workTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Budget Type</label>
              <select className="form-select" value={form.budget_type} onChange={update('budget_type')}>
                <option value="">Select</option>
                {budgetTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Budget Min</label>
              <input className="form-input" type="number" value={form.budget_min} onChange={update('budget_min')} />
            </div>
            <div className="form-group">
              <label>Budget Max</label>
              <input className="form-input" type="number" value={form.budget_max} onChange={update('budget_max')} />
            </div>
          </div>
          <div className="form-group">
            <label>Duration</label>
            <select className="form-select" value={form.duration} onChange={update('duration')}>
              <option value="">Select</option>
              {durations.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Component ─── */
export default function Jobs() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scopeFilter, setScopeFilter] = useState<JobScopeFilter>('companies')
  const [currentStep, setCurrentStep] = useState(1)
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [requiredSkillInput, setRequiredSkillInput] = useState('')
  const [preferredSkillInput, setPreferredSkillInput] = useState('')
  const [questionInput, setQuestionInput] = useState('')
  const [approvalSaving, setApprovalSaving] = useState<Record<string, boolean>>({})
  const [voiceSaving, setVoiceSaving] = useState<Record<string, boolean>>({})

  const [viewJob, setViewJob] = useState<Job | null>(null)
  const [editJob, setEditJob] = useState<Job | null>(null)

  const [jobData, setJobData] = useState<JobPostData>({
    title: '', category: '', subdomain: '', description: '',
    voiceai_requirement: 'not_required', approval_status: 'approved',
    experience: '', education: '', location: '', workType: '',
    budgetType: '', budgetMin: 0, budgetMax: 0, duration: '', startDate: '',
    requiredSkills: [], preferredSkills: [],
    applicationDeadline: '', applicationQuestions: [],
    visibility: 'public', isPublished: false, publishedJobId: undefined,
  })

  const [domains, setDomains] = useState<Domain[]>([])
  const [subdomains, setSubdomains] = useState<Subdomain[]>([])
  const [domainsLoading, setDomainsLoading] = useState(false)

  /* Draft persistence */
  useEffect(() => {
    const draft = localStorage.getItem('rubricate_jobPostDraft')
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        setJobData({ ...parsed.data, subdomain: parsed.data?.subdomain ?? '' })
        setCurrentStep(parsed.step)
      } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    if (!isWizardOpen) return
    const draft = { data: jobData, step: currentStep, timestamp: Date.now() }
    localStorage.setItem('rubricate_jobPostDraft', JSON.stringify(draft))
  }, [jobData, currentStep, isWizardOpen])

  const updateJobData = (updates: Partial<JobPostData>) => {
    setJobData(prev => ({ ...prev, ...updates }))
  }

  useEffect(() => {
    if (!isWizardOpen) return
    setDomainsLoading(true)
    adminApi.getDomains()
      .then(({ domains: ds, subdomains: ss }) => {
        setDomains(ds)
        setSubdomains(ss)
      })
      .catch(() => {})
      .finally(() => setDomainsLoading(false))
  }, [isWizardOpen])

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await adminApi.getJobs({ limit: 200, offset: 0 })
      setJobs(result.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  const adminUserId = String(user?.id ?? '').trim()

  const adminJobs = useMemo(() => {
    if (!adminUserId) return []
    return jobs.filter(job => String(job.company_id ?? '').trim() === adminUserId)
  }, [jobs, adminUserId])

  const companyJobs = useMemo(() => {
    if (!adminUserId) return jobs
    return jobs.filter(job => String(job.company_id ?? '').trim() !== adminUserId)
  }, [jobs, adminUserId])

  const scopeCounts = useMemo(() => ({
    companies: companyJobs.length,
    admin: adminJobs.length,
  }), [companyJobs, adminJobs])

  const filteredJobs = useMemo(() => (
    scopeFilter === 'admin' ? adminJobs : companyJobs
  ), [scopeFilter, adminJobs, companyJobs])

  const filteredCount = filteredJobs.length

  const isStepCompleted = (stepNumber: number) => {
    switch (stepNumber) {
      case 1: return !!jobData.title && !!jobData.category && !!jobData.subdomain && !!jobData.description && lettersAndSpaces(jobData.title) && jobData.description.length >= 500
      case 2: return !!jobData.experience && !!jobData.location && !!jobData.workType
      case 3: return !!jobData.budgetType && !!jobData.duration
      case 4: return jobData.requiredSkills.length > 0
      case 5: return !!jobData.applicationDeadline
      case 6: return true
      case 7: return true
      default: return false
    }
  }

  const canProceed = isStepCompleted(currentStep)
  const progress = (currentStep / steps.length) * 100

  const nextStep = () => { if (currentStep < steps.length) setCurrentStep(s => s + 1) }
  const prevStep = () => { if (currentStep > 1) setCurrentStep(s => s - 1) }
  const goToStep = (step: number) => { if (step <= currentStep) setCurrentStep(step) }

  const handleApprovalChange = async (jobId: string | number, nextValue: 'approved' | 'not_approved' | 'rework') => {
    const id = String(jobId ?? '').trim()
    if (!id) return
    setApprovalSaving(prev => ({ ...prev, [id]: true }))
    try {
      await adminApi.updateJob(id, { approval_status: nextValue })
      setJobs(prev => prev.map(job => (String(job.id ?? '').trim() === id
        ? { ...job, approval_status: nextValue }
        : job
      )))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update approval status')
    } finally {
      setApprovalSaving(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleVoiceAiChange = async (jobId: string | number, nextValue: 'allow' | 'not_allow') => {
    const id = String(jobId ?? '').trim()
    if (!id) return
    const mappedValue = nextValue === 'allow' ? 'required' : 'not_required'
    setVoiceSaving(prev => ({ ...prev, [id]: true }))
    try {
      await adminApi.updateJob(id, { voiceai_requirement: mappedValue })
      setJobs(prev => prev.map(job => (String(job.id ?? '').trim() === id
        ? { ...job, voiceai_requirement: mappedValue }
        : job
      )))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update Voice AI setting')
    } finally {
      setVoiceSaving(prev => ({ ...prev, [id]: false }))
    }
  }

  const handlePublish = async () => {
    setIsPublishing(true)
    setPublishError(null)
    try {
      const payload: Partial<Job> = {
        title: jobData.title,
        description: jobData.description,
        category: jobData.category,
        subdomain: jobData.subdomain,
        posted_by: user?.id ? String(user.id) : null,
        english_assessment: 1,
        voiceai_requirement: jobData.voiceai_requirement,
        approval_status: jobData.approval_status,
        experience_level: jobData.experience,
        education: jobData.education,
        location: jobData.location,
        work_type: jobData.workType,
        budget_type: jobData.budgetType,
        budget_min: jobData.budgetMin || null,
        budget_max: jobData.budgetMax || null,
        duration: jobData.duration,
        start_date: jobData.startDate || null,
        required_skills: jobData.requiredSkills,
        preferred_skills: jobData.preferredSkills,
        application_deadline: jobData.applicationDeadline || null,
        application_questions: jobData.applicationQuestions,
        visibility: jobData.visibility,
        status: 'active',
      }
      const result = await adminApi.createJob(payload)
      updateJobData({ isPublished: true, publishedJobId: String(result.id ?? '') })
      localStorage.removeItem('rubricate_jobPostDraft')
      await loadJobs()
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Unable to publish job. Please try again.')
    } finally {
      setIsPublishing(false)
    }
  }

  const resetWizard = () => {
    setJobData({
      title: '', category: '', subdomain: '', description: '',
      voiceai_requirement: 'not_required', approval_status: 'approved',
      experience: '', education: '', location: '', workType: '',
      budgetType: '', budgetMin: 0, budgetMax: 0, duration: '', startDate: '',
      requiredSkills: [], preferredSkills: [],
      applicationDeadline: '', applicationQuestions: [],
      visibility: 'public', isPublished: false, publishedJobId: undefined,
    })
    setRequiredSkillInput('')
    setPreferredSkillInput('')
    setQuestionInput('')
    setCurrentStep(1)
    setPublishError(null)
    localStorage.removeItem('rubricate_jobPostDraft')
  }

  /* ─── Step Renderers ─── */
  const renderBasicInfo = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="form-group">
        <label>Job Title *</label>
        <input className="form-input" placeholder="e.g. Senior Machine Learning Engineer"
          value={jobData.title} onChange={e => updateJobData({ title: e.target.value })} />
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>A clear, descriptive title helps attract the right candidates</p>
      </div>
      <div className="form-group">
        <label>Domain *</label>
        <select className="form-select" value={jobData.category}
          disabled={domainsLoading}
          onChange={e => {
            const domainName = e.target.value
            updateJobData({ category: domainName, subdomain: '' })
          }}>
          <option value="">Select job domain</option>
          {domains.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
        </select>
        {domainsLoading && <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>Loading domains...</p>}
      </div>
      <div className="form-group">
        <label>Subdomain *</label>
        <select className="form-select" value={jobData.subdomain}
          disabled={!jobData.category || domainsLoading}
          onChange={e => updateJobData({ subdomain: e.target.value })}>
          <option value="">Select job subdomain</option>
          {subdomains
            .filter(s => {
              const selectedDomain = domains.find(d => d.name === jobData.category)
              return selectedDomain ? s.domain_id === selectedDomain.id : false
            })
            .map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>Job Description *</label>
        <textarea className="form-textarea" placeholder="Describe the project, objectives, and what you're looking for in a candidate..."
          value={jobData.description} onChange={e => updateJobData({ description: e.target.value })}
          style={{ minHeight: 150 }} />
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>Be specific about the project goals, deliverables, and expectations (minimum 500 characters)</p>
      </div>
      <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
        <div>
          <label style={{ marginBottom: 2 }}>Voice AI Assessment</label>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>Require candidates to complete a voice AI assessment</p>
        </div>
        <label className="switch">
          <input type="checkbox" checked={jobData.voiceai_requirement === 'required'}
            onChange={e => updateJobData({ voiceai_requirement: e.target.checked ? 'required' : 'not_required' })} />
          <span className="switch-slider" />
        </label>
      </div>
      <div style={{ padding: 16, background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--color-text-secondary)' }}>
        <strong style={{ color: 'var(--color-text)' }}>Tips for a great job post:</strong>
        <ul style={{ margin: '8px 0 0 16px', padding: 0, lineHeight: 1.6 }}>
          <li>Be specific about the AI/ML domain and techniques required</li>
          <li>Mention the business impact and project scope</li>
          <li>Include any relevant datasets or technologies</li>
          <li>Specify if it's research-focused or application-focused work</li>
        </ul>
      </div>
    </div>
  )

  const renderRequirements = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="form-group">
        <label>Experience Level *</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          {experienceLevels.map(level => (
            <label key={level.value} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
              <input type="radio" name="experience" value={level.value}
                checked={jobData.experience === level.value}
                onChange={e => updateJobData({ experience: e.target.value })} />
              {level.label}
            </label>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label>Education Requirement</label>
        <select className="form-select" value={jobData.education}
          onChange={e => updateJobData({ education: e.target.value })}>
          <option value="">Select education requirement</option>
          {educationLevels.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>Location *</label>
        <select className="form-select" value={jobData.location}
          onChange={e => updateJobData({ location: e.target.value })}>
          <option value="">Select work location</option>
          {locations.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>Work Type *</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          {workTypes.map(type => (
            <label key={type.value} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
              <input type="radio" name="workType" value={type.value}
                checked={jobData.workType === type.value}
                onChange={e => updateJobData({ workType: e.target.value })} />
              {type.label}
            </label>
          ))}
        </div>
      </div>
      <div style={{ padding: 16, background: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--color-text-secondary)', border: '1px solid var(--color-primary-light)' }}>
        <strong style={{ color: 'var(--color-text)' }}>Hiring for AI Talent?</strong>
        <p style={{ margin: '6px 0 0' }}>Consider that AI expertise often comes from diverse backgrounds. Focus on practical skills and portfolio over traditional credentials.</p>
      </div>
    </div>
  )

  const renderBudgetTimeline = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="form-group">
        <label>Budget Type *</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          {budgetTypes.map(type => (
            <label key={type.value} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
              <input type="radio" name="budgetType" value={type.value}
                checked={jobData.budgetType === type.value}
                onChange={e => updateJobData({ budgetType: e.target.value })} />
              {type.label}
            </label>
          ))}
        </div>
      </div>
      {jobData.budgetType && (
        <div className="form-row">
          <div className="form-group">
            <label>{jobData.budgetType === 'hourly' ? 'Min Hourly Rate' : 'Min Budget'} ($)</label>
            <input className="form-input" type="number" placeholder="0"
              value={jobData.budgetMin || ''} onChange={e => updateJobData({ budgetMin: Number(e.target.value) })} />
          </div>
          <div className="form-group">
            <label>{jobData.budgetType === 'hourly' ? 'Max Hourly Rate' : 'Max Budget'} ($)</label>
            <input className="form-input" type="number" placeholder="0"
              value={jobData.budgetMax || ''} onChange={e => updateJobData({ budgetMax: Number(e.target.value) })} />
          </div>
        </div>
      )}
      <div className="form-group">
        <label>Project Duration *</label>
        <select className="form-select" value={jobData.duration}
          onChange={e => updateJobData({ duration: e.target.value })}>
          <option value="">Select project duration</option>
          {durations.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>Preferred Start Date</label>
        <input className="form-input" type="date" value={jobData.startDate}
          onChange={e => updateJobData({ startDate: e.target.value })} />
      </div>
      <div style={{ padding: 16, background: 'var(--color-warning-light)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--color-text-secondary)', border: '1px solid var(--color-warning-light)' }}>
        <strong style={{ color: 'var(--color-text)' }}>AI Market Rates</strong>
        <div style={{ marginTop: 6, lineHeight: 1.6 }}>
          <p><strong>Entry Level:</strong> $50-100/hr | $3,000-8,000/month</p>
          <p><strong>Mid Level:</strong> $100-150/hr | $8,000-15,000/month</p>
          <p><strong>Senior Level:</strong> $150-250/hr | $15,000-25,000/month</p>
          <p><strong>Expert Level:</strong> $250-500/hr | $25,000-50,000/month</p>
        </div>
      </div>
    </div>
  )

  const renderSkills = () => {
    const addReq = (s: string) => { if (s && !jobData.requiredSkills.includes(s)) { updateJobData({ requiredSkills: [...jobData.requiredSkills, s] }); setRequiredSkillInput('') } }
    const addPref = (s: string) => { if (s && !jobData.preferredSkills.includes(s)) { updateJobData({ preferredSkills: [...jobData.preferredSkills, s] }); setPreferredSkillInput('') } }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Required Skills *</label>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>Essential skills candidates must have</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input className="form-input" placeholder="Type a skill and press Enter"
              value={requiredSkillInput} onChange={e => setRequiredSkillInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addReq(requiredSkillInput))} />
            <button type="button" className="btn btn-secondary" onClick={() => addReq(requiredSkillInput)}><Plus size={16} /></button>
          </div>
          {jobData.requiredSkills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {jobData.requiredSkills.map(skill => (
                <span key={skill} className="tag" style={{ background: 'var(--color-primary)', color: 'white', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {skill}
                  <button type="button" onClick={() => updateJobData({ requiredSkills: jobData.requiredSkills.filter(s => s !== skill) })} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0, lineHeight: 1 }}><X size={12} /></button>
                </span>
              ))}
            </div>
          )}
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>Suggested:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {suggestedSkills.filter(s => !jobData.requiredSkills.includes(s) && !jobData.preferredSkills.includes(s)).slice(0, 15).map(s => (
              <button key={s} type="button" className="tag" onClick={() => addReq(s)} style={{ cursor: 'pointer' }}>+ {s}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Preferred Skills</label>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>Nice-to-have skills that would be beneficial</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input className="form-input" placeholder="Type a skill and press Enter"
              value={preferredSkillInput} onChange={e => setPreferredSkillInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPref(preferredSkillInput))} />
            <button type="button" className="btn btn-secondary" onClick={() => addPref(preferredSkillInput)}><Plus size={16} /></button>
          </div>
          {jobData.preferredSkills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {jobData.preferredSkills.map(skill => (
                <span key={skill} className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {skill}
                  <button type="button" onClick={() => updateJobData({ preferredSkills: jobData.preferredSkills.filter(s => s !== skill) })} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 0, lineHeight: 1 }}><X size={12} /></button>
                </span>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {suggestedSkills.filter(s => !jobData.requiredSkills.includes(s) && !jobData.preferredSkills.includes(s)).slice(15, 30).map(s => (
              <button key={s} type="button" className="tag" onClick={() => addPref(s)} style={{ cursor: 'pointer' }}>+ {s}</button>
            ))}
          </div>
        </div>
        <div style={{ padding: 16, background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--color-text-secondary)' }}>
          <strong style={{ color: 'var(--color-text)' }}>Skill Selection Tips</strong>
          <ul style={{ margin: '8px 0 0 16px', padding: 0, lineHeight: 1.6 }}>
            <li>Keep required skills focused (5-8 max) - too many will limit your pool</li>
            <li>Include both technical and domain-specific skills</li>
            <li>Consider soft skills like "Research Methodology" or "Technical Writing"</li>
            <li>Preferred skills can be more extensive and aspirational</li>
          </ul>
        </div>
      </div>
    )
  }

  const renderApplicationProcess = () => {
    const addQ = (q: string) => { if (q && !jobData.applicationQuestions.includes(q)) { updateJobData({ applicationQuestions: [...jobData.applicationQuestions, q] }); setQuestionInput('') } }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="form-group">
          <label>Application Deadline *</label>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>When should applications be submitted by?</p>
          <input className="form-input" type="date" value={jobData.applicationDeadline}
            onChange={e => updateJobData({ applicationDeadline: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Application Questions</label>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>Custom questions to help you evaluate candidates (optional)</p>
          <textarea className="form-textarea" placeholder="Type your question here..." style={{ minHeight: 60 }}
            value={questionInput} onChange={e => setQuestionInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), addQ(questionInput))} />
          <button type="button" className="btn btn-secondary" style={{ marginTop: 8, width: '100%' }}
            onClick={() => addQ(questionInput)}><Plus size={16} style={{ marginRight: 6 }} />Add Question</button>
          {jobData.applicationQuestions.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {jobData.applicationQuestions.map((q, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: 10, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Q{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 13 }}>{q}</span>
                  <button type="button" onClick={() => updateJobData({ applicationQuestions: jobData.applicationQuestions.filter((_, idx) => idx !== i) })}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 0 }}><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {suggestedQuestions.filter(q => !jobData.applicationQuestions.includes(q)).slice(0, 5).map((q, i) => (
              <button key={i} type="button" className="tag" onClick={() => addQ(q)} style={{ cursor: 'pointer', textAlign: 'left', width: '100%' }}>+ {q}</button>
            ))}
          </div>
        </div>
        <div style={{ padding: 16, background: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--color-text-secondary)', border: '1px solid var(--color-primary-light)' }}>
          <strong style={{ color: 'var(--color-text)' }}>Application Best Practices</strong>
          <ul style={{ margin: '8px 0 0 16px', padding: 0, lineHeight: 1.6 }}>
            <li>Keep questions focused and relevant to the project</li>
            <li>Ask for specific examples rather than general experience</li>
            <li>Include questions about approach and methodology</li>
            <li>Limit to 3-5 questions to respect applicants' time</li>
            <li>Consider asking for portfolio links or code samples</li>
          </ul>
        </div>
      </div>
    )
  }

  const renderReview = () => {
    const fmtBudget = () => {
      if (!jobData.budgetType) return 'Not specified'
      const min = jobData.budgetMin || 0
      const max = jobData.budgetMax || 0
      if (jobData.budgetType === 'hourly') return `$${min}-${max}/hour`
      if (jobData.budgetType === 'monthly') return `$${min}-${max}/month`
      return `$${min}-${max} fixed price`
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Review Your Job Post</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Review all details before publishing. You can go back to edit any section.</p>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>{jobData.title || 'Untitled Job'}</h3>
              {jobData.category && <span className="tag" style={{ background: 'var(--color-bg)' }}>{jobData.category}</span>}
              {jobData.subdomain && <span className="tag" style={{ background: 'var(--color-bg)', marginLeft: 6 }}>{jobData.subdomain}</span>}
            </div>
          </div>
          <p style={{ marginTop: 12, fontSize: 13, color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{jobData.description || 'No description provided'}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 15 }}>Job Requirements</h4>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
              <p><strong>Experience:</strong> {jobData.experience || 'Not specified'}</p>
              <p><strong>Location:</strong> {jobData.location || 'Not specified'}</p>
              <p><strong>Work Type:</strong> {jobData.workType || 'Not specified'}</p>
              {jobData.education && <p><strong>Education:</strong> {jobData.education}</p>}
            </div>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 15 }}>Budget & Timeline</h4>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
              <p><strong>Budget:</strong> {fmtBudget()}</p>
              <p><strong>Duration:</strong> {jobData.duration || 'Not specified'}</p>
              <p><strong>Start Date:</strong> {jobData.startDate ? formatDate(jobData.startDate) : 'Not specified'}</p>
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 15 }}>Skills & Expertise</h4>
          <div style={{ marginBottom: 12 }}>
            <strong style={{ fontSize: 13 }}>Required Skills:</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {jobData.requiredSkills.length > 0 ? jobData.requiredSkills.map(s => <span key={s} className="tag" style={{ background: 'var(--color-primary)', color: 'white' }}>{s}</span>)
                : <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>None specified</span>}
            </div>
          </div>
          {jobData.preferredSkills.length > 0 && (
            <div>
              <strong style={{ fontSize: 13 }}>Preferred Skills:</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {jobData.preferredSkills.map(s => <span key={s} className="tag">{s}</span>)}
              </div>
            </div>
          )}
        </div>
        <div className="card" style={{ padding: 20 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 15 }}>Application Process</h4>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}><strong>Application Deadline:</strong> {jobData.applicationDeadline ? formatDate(jobData.applicationDeadline) : 'Not specified'}</p>
          {jobData.applicationQuestions.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <strong style={{ fontSize: 13 }}>Application Questions ({jobData.applicationQuestions.length}):</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                {jobData.applicationQuestions.map((q, i) => (
                  <div key={i} style={{ padding: 8, background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}><strong>Q{i + 1}:</strong> {q}</div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: 16, background: 'var(--color-success-light)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--color-text-secondary)', border: '1px solid var(--color-success-light)' }}>
          <strong style={{ color: 'var(--color-text)' }}>Ready to Publish?</strong>
          <p style={{ margin: '6px 0 0' }}>Your job post looks great! Once published, it will be visible to our community of AI experts and agencies. You can edit or pause the posting at any time.</p>
        </div>
      </div>
    )
  }

  const renderPublish = () => {
    if (jobData.isPublished) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-success-light)', display: 'grid', placeItems: 'center' }}>
            <Check size={32} style={{ color: 'var(--color-success)' }} />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Job Posted Successfully!</h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Your job post is now live and visible to our community of AI experts.</p>
          </div>
          <div className="card" style={{ padding: 24, width: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center' }}>
              <div><div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-primary)' }}>0</div><div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Views</div></div>
              <div><div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-primary)' }}>0</div><div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Applications</div></div>
              <div><div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-primary)' }}>24h</div><div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Avg. Response Time</div></div>
            </div>
          </div>
          <div className="btn-group">
            <button type="button" className="btn btn-primary" onClick={() => { setIsWizardOpen(false); resetWizard() }}>
              <Eye size={16} style={{ marginRight: 6 }} /> Back to Jobs
            </button>
          </div>
          <div style={{ padding: 16, background: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--color-text-secondary)', border: '1px solid var(--color-primary-light)', textAlign: 'left', width: '100%' }}>
            <strong style={{ color: 'var(--color-text)' }}>What's Next?</strong>
            <ul style={{ margin: '8px 0 0 16px', padding: 0, lineHeight: 1.6 }}>
              <li>You'll receive email notifications for new applications</li>
              <li>Review candidate profiles and portfolios carefully</li>
              <li>Use our messaging system to communicate with applicants</li>
              <li>Set up interviews through our integrated scheduling</li>
            </ul>
          </div>
        </div>
      )
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Ready to Publish Your Job?</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Choose your visibility settings and publish your job post to start receiving applications.</p>
        </div>
        {publishError && (
          <div style={{ padding: 12, background: 'var(--color-danger-light)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
            <AlertCircle size={16} />
            {publishError}
          </div>
        )}
        <div className="card" style={{ padding: 20 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 15 }}>Visibility Settings</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {visibilityOptions.map(opt => (
              <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                <input type="radio" name="visibility" value={opt.value}
                  checked={jobData.visibility === opt.value}
                  onChange={e => updateJobData({ visibility: e.target.value })} />
                <opt.icon size={18} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {opt.title}
                    {opt.badge && <span className="badge" style={{ background: opt.badge === 'Premium' ? 'var(--color-primary)' : 'var(--color-bg)', color: opt.badge === 'Premium' ? 'white' : 'var(--color-text-secondary)', fontSize: 11 }}>{opt.badge}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{opt.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 15 }}>Publishing Summary</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Job Title', value: jobData.title },
              { label: 'Budget', value: jobData.budgetType ? `${jobData.budgetType === 'hourly' ? `$${jobData.budgetMin}-${jobData.budgetMax}/hour` : `$${jobData.budgetMin}-${jobData.budgetMax} ${jobData.budgetType}`}` : '—' },
              { label: 'Duration', value: jobData.duration || '—' },
              { label: 'Required Skills', value: `${jobData.requiredSkills.length} skills` },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: 10, background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
                <strong>{item.label}</strong>
                <span style={{ color: 'var(--color-text-muted)' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: 16, background: 'var(--color-warning-light)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--color-text-secondary)', border: '1px solid var(--color-warning-light)' }}>
          <strong style={{ color: 'var(--color-text)' }}>Publishing Tips</strong>
          <ul style={{ margin: '8px 0 0 16px', padding: 0, lineHeight: 1.6 }}>
            <li>Jobs typically receive 5-15 applications within the first 24 hours</li>
            <li>Respond promptly to applications to maintain high engagement</li>
            <li>You can edit your job post after publishing if needed</li>
            <li>Featured jobs get 3x more visibility and applications</li>
          </ul>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button type="button" className="btn btn-primary btn-lg" onClick={handlePublish} disabled={isPublishing}>
            {isPublishing ? 'Publishing...' : 'Publish Job'}
          </button>
        </div>
      </div>
    )
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderBasicInfo()
      case 2: return renderRequirements()
      case 3: return renderBudgetTimeline()
      case 4: return renderSkills()
      case 5: return renderApplicationProcess()
      case 6: return renderReview()
      case 7: return renderPublish()
      default: return renderBasicInfo()
    }
  }

  /* ─── View Modal ─── */
  const renderViewModal = () => {
    if (!viewJob) return null
    const job = viewJob
    const skills = normalizeList(job.required_skills)
    const prefSkills = normalizeList(job.preferred_skills)
    const questions = normalizeList(job.application_questions)
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }} onClick={() => setViewJob(null)}>
        <div className="card" style={{
          maxWidth: 720, width: '100%', maxHeight: '90vh', overflow: 'auto',
          padding: 28,
        }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>{job.title || 'Untitled Job'}</h2>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {job.category && <span className="tag">{job.category}</span>}
                {job.subdomain && <span className="tag">{job.subdomain}</span>}
                <span className={statusBadgeClass(job.status)}>{formatLabel(job.status)}</span>
                <span className={approvalBadgeClass(job.approval_status)}>{formatLabel(job.approval_status)}</span>
              </div>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setViewJob(null)}><X size={16} /></button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--color-text-secondary)' }}>Description</h4>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}>{job.description || 'No description provided.'}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="card" style={{ padding: 16, background: 'var(--color-bg)' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>Requirements</h4>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                  <p><strong>Experience:</strong> {formatLabel(job.experience_level)}</p>
                  <p><strong>Education:</strong> {job.education || '—'}</p>
                  <p><strong>Location:</strong> {job.location || '—'}</p>
                  <p><strong>Work Type:</strong> {formatLabel(job.work_type)}</p>
                </div>
              </div>
              <div className="card" style={{ padding: 16, background: 'var(--color-bg)' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>Budget & Timeline</h4>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                  <p><strong>Budget:</strong> {formatRange(job.budget_min, job.budget_max)}</p>
                  <p><strong>Type:</strong> {formatLabel(job.budget_type)}</p>
                  <p><strong>Duration:</strong> {job.duration || '—'}</p>
                  <p><strong>Start Date:</strong> {formatDate(job.start_date)}</p>
                </div>
              </div>
            </div>

            {skills.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Required Skills</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {skills.map(s => <span key={s} className="tag" style={{ background: 'var(--color-primary)', color: 'white' }}>{s}</span>)}
                </div>
              </div>
            )}
            {prefSkills.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Preferred Skills</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {prefSkills.map(s => <span key={s} className="tag">{s}</span>)}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Application Process</h4>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                  <p><strong>Deadline:</strong> {formatDate(job.application_deadline)}</p>
                  <p><strong>Questions:</strong> {questions.length > 0 ? `${questions.length} question(s)` : 'None'}</p>
                </div>
              </div>
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Metadata</h4>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                  <p><strong>Visibility:</strong> {formatLabel(job.visibility)}</p>
                  <p><strong>Voice AI:</strong> {formatLabel(job.voiceai_requirement)}</p>
                  <p><strong>Created:</strong> {formatDate(job.date_created)}</p>
                  <p><strong>Views:</strong> {job.views ?? 0} &nbsp;|&nbsp; <strong>Apps:</strong> {job.applications ?? 0}</p>
                </div>
              </div>
            </div>

            {questions.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Application Questions</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {questions.map((q, i) => (
                    <div key={i} style={{ padding: 10, background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
                      <strong>Q{i + 1}:</strong> {q}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setViewJob(null)}>Close</button>
              <button type="button" className="btn btn-primary" onClick={() => { setViewJob(null); setEditJob(job) }}>
                <Pencil size={16} style={{ marginRight: 6 }} /> Edit
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {isWizardOpen ? (
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setIsWizardOpen(false); resetWizard() }}>
              <ChevronLeft size={16} style={{ marginRight: 4 }} /> Back to Jobs
            </button>
            <h1 style={{ marginTop: 10 }}>Job Post Wizard</h1>
            <p>Create a new job posting using our step-by-step wizard.</p>
          </div>
        </div>
      ) : (
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1>Jobs</h1>
            <p>Browse and review job postings from the jobs collection</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={loadJobs} disabled={loading}>
              <RefreshCw size={16} /> Refresh
            </button>
            <button className="btn btn-primary" onClick={() => setIsWizardOpen(true)}>
              <Plus size={16} style={{ marginRight: 6 }} /> Post New Job
            </button>
          </div>
        </div>
      )}

      {isWizardOpen ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="two-col-layout" style={{ gridTemplateColumns: '1.2fr 2.8fr' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>Job Post Progress</h3>
                <div style={{ height: 6, background: 'var(--color-bg)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.3s ease' }} />
                </div>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>Step {currentStep} of {steps.length}</p>
              </div>

              <div className="card" style={{ padding: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {steps.map(step => {
                    const isActive = currentStep === step.id
                    const isCompleted = currentStep > step.id
                    const isAccessible = currentStep >= step.id
                    return (
                      <button key={step.id} type="button" onClick={() => isAccessible && goToStep(step.id)}
                        disabled={!isAccessible}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--radius-md)',
                          border: 'none', background: isActive ? 'var(--color-primary)' : isCompleted ? 'var(--color-success-light)' : 'transparent',
                          color: isActive ? 'white' : isCompleted ? 'var(--color-success)' : 'var(--color-text-secondary)',
                          cursor: isAccessible ? 'pointer' : 'not-allowed', opacity: isAccessible ? 1 : 0.5,
                          textAlign: 'left', fontFamily: 'inherit', fontSize: 13, transition: 'all 0.15s',
                        }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700,
                          border: `2px solid ${isActive ? 'white' : isCompleted ? 'var(--color-success)' : 'var(--color-text-muted)'}`,
                          background: isActive ? 'white' : isCompleted ? 'var(--color-success)' : 'transparent',
                          color: isActive ? 'var(--color-primary)' : isCompleted ? 'white' : 'var(--color-text-muted)',
                          flexShrink: 0,
                        }}>
                          {isCompleted ? <Check size={14} /> : step.id}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{step.title}</div>
                          <div style={{ fontSize: 11, opacity: 0.8 }}>{step.description}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16 }}>{steps[currentStep - 1].title}</h3>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>{steps[currentStep - 1].description}</p>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{currentStep} / {steps.length}</span>
                </div>
                {renderStepContent()}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button type="button" className="btn btn-secondary" onClick={prevStep} disabled={currentStep === 1}>
                  <ChevronLeft size={16} style={{ marginRight: 4 }} /> Previous
                </button>
                <div className="btn-group">
                  {currentStep === steps.length ? (
                    jobData.isPublished ? (
                      <button type="button" className="btn btn-primary" onClick={() => { setIsWizardOpen(false); resetWizard() }}>
                        Done
                      </button>
                    ) : (
                      <button type="button" className="btn btn-secondary" onClick={() => { setIsWizardOpen(false); resetWizard() }}>
                        Cancel
                      </button>
                    )
                  ) : (
                    <button type="button" className="btn btn-primary" onClick={nextStep} disabled={!canProceed}>
                      Next <ChevronRight size={16} style={{ marginLeft: 4 }} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: 0 }}>Job Listings</h3>
                <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>Track job postings by owner</p>
              </div>
            </div>
            <div className="tabs" style={{ marginTop: 12 }}>
              {([
                { key: 'companies', label: 'Companies' },
                { key: 'admin', label: 'My Jobs' },
              ] as Array<{ key: JobScopeFilter; label: string }>).map(tab => (
                <button key={tab.key} type="button" className={`tab ${scopeFilter === tab.key ? 'active' : ''}`}
                  onClick={() => setScopeFilter(tab.key)}>
                  {tab.label} ({scopeCounts[tab.key]})
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p className="text-muted">Loading jobs...</p>
            </div>
          ) : error ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--color-danger-light)' }}>
              <p style={{ color: 'var(--color-danger)' }}>Error: {error}</p>
            </div>
          ) : filteredCount === 0 ? (
            <div className="card empty-state">
              <h3>No jobs found</h3>
              <p>There are no job postings in this tab.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="text-muted" style={{ fontSize: 13 }}>
                Showing {filteredCount} job{filteredCount === 1 ? '' : 's'}
              </div>
              {filteredJobs.map(job => {
                const jobId = String(job.id ?? '').trim()
                const approvalValue = normalizeApproval(job.approval_status)
                const approvalBusy = Boolean(jobId && approvalSaving[jobId])
                const voiceValue = normalizeVoiceAi(job.voiceai_requirement)
                const voiceBusy = Boolean(jobId && voiceSaving[jobId])
                return (
                  <div key={job.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{job.title || 'Untitled Job'}</h3>
                      <p style={{ margin: '6px 0 0', color: 'var(--color-text-muted)', fontSize: 13 }}>
                        {formatLabel(job.category)} • {formatLabel(job.experience_level)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className={statusBadgeClass(job.status)}>{formatLabel(job.status)}</span>
                      <span className={approvalBadgeClass(job.approval_status)}>
                        {formatLabel(job.approval_status) === '—' ? 'Approval: —' : `Approval: ${formatLabel(job.approval_status)}`}
                      </span>
                    </div>
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <span className="tag">{job.category || '—'}</span>
                    <span className="tag">{job.location || '—'}</span>
                    <span className="tag">{formatLabel(job.work_type)}</span>
                  </div>
                  <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Budget</div>
                      <div style={{ fontWeight: 600 }}>{formatRange(job.budget_min, job.budget_max)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</div>
                      <div style={{ fontWeight: 600 }}>{formatLabel(job.budget_type)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</div>
                      <div style={{ fontWeight: 600 }}>{formatLabel(job.status)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Created</div>
                      <div style={{ fontWeight: 600 }}>{formatDate(job.date_created)}</div>
                    </div>
                  </div>
                  {scopeFilter === 'companies' && (
                    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Approval</span>
                        <select
                          className="form-select"
                          style={{ width: 180 }}
                          value={approvalValue}
                          onChange={(event) => handleApprovalChange(jobId, event.target.value as 'approved' | 'not_approved' | 'rework')}
                          disabled={approvalBusy || !jobId}
                        >
                          <option value="approved">Approved</option>
                          <option value="not_approved">Not Approved</option>
                          <option value="rework">Rework</option>
                        </select>
                        {approvalBusy && <span className="text-muted" style={{ fontSize: 12 }}>Saving...</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Voice AI</span>
                        <select
                          className="form-select"
                          style={{ width: 180 }}
                          value={voiceValue}
                          onChange={(event) => handleVoiceAiChange(jobId, event.target.value as 'allow' | 'not_allow')}
                          disabled={voiceBusy || !jobId}
                        >
                          <option value="allow">Allow</option>
                          <option value="not_allow">Not Allow</option>
                        </select>
                        {voiceBusy && <span className="text-muted" style={{ fontSize: 12 }}>Saving...</span>}
                      </div>
                    </div>
                  )}
                  <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setViewJob(job)}>
                      <Eye size={14} style={{ marginRight: 4 }} /> View
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditJob(job)}>
                      <Pencil size={14} style={{ marginRight: 4 }} /> Edit
                    </button>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>
      )}
      {renderViewModal()}
      {editJob && (
        <EditJobModal
          job={editJob}
          onClose={() => setEditJob(null)}
          onSaved={() => loadJobs()}
        />
      )}
    </div>
  )
}
