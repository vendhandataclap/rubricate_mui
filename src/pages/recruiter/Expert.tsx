import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, X, Award, Briefcase, Mail, Calendar, CheckCircle2, XCircle, ClipboardList, SlidersHorizontal, ArrowLeft } from 'lucide-react'
import { recruiterApi, adminApi } from '../../services/api'
import type { Expert, Domain, Subdomain } from '../../types'
import GradingSection from '../../components/shared/GradingSection'

type ApplicationStatus = 'approved' | 'rejected' | 'pending'
type ExpertColumnKey =
  | 'name'
  | 'email'
  | 'phone'
  | 'domain'
  | 'subdomain'
  | 'experience'
  | 'availability'
  | 'completion'
  | 'application'
  | 'assessment'
  | 'title'
  | 'city'
  | 'country'
  | 'joined'

const RECRUITER_EXPERTS_VISIBLE_COLUMNS_KEY = 'recruiter_experts_table_visible_columns_v1'
const DEFAULT_VISIBLE_COLUMNS: ExpertColumnKey[] = ['name', 'email', 'domain', 'subdomain', 'experience', 'availability', 'completion', 'application']
const COLUMN_OPTIONS: Array<{ key: ExpertColumnKey; label: string }> = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'domain', label: 'Domain' },
  { key: 'subdomain', label: 'Subdomain' },
  { key: 'experience', label: 'Experience' },
  { key: 'availability', label: 'Availability' },
  { key: 'completion', label: 'Completion' },
  { key: 'application', label: 'Application' },
  { key: 'assessment', label: 'Assessment' },
  { key: 'title', label: 'Title' },
  { key: 'city', label: 'City' },
  { key: 'country', label: 'Country' },
  { key: 'joined', label: 'Joined' },
]

export default function Expert() {
  const navigate = useNavigate()
  const [experts, setExperts] = useState<Expert[]>([])
  const [domainsList, setDomainsList] = useState<Domain[]>([])
  const [subdomainsList, setSubdomainsList] = useState<Subdomain[]>([])
  const [domains, setDomains] = useState<Record<string, string>>({})
  const [subdomains, setSubdomains] = useState<Record<string, string>>({})
  const [domainFilter, setDomainFilter] = useState('all')
  const [subdomainFilter, setSubdomainFilter] = useState('all')
  const [applicationExperienceFilter, setApplicationExperienceFilter] = useState('all')
  const [profileCompletionFilter, setProfileCompletionFilter] = useState('all')
  const [applicationFilter, setApplicationFilter] = useState<'all' | ApplicationStatus>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalTab, setModalTab] = useState<string>('profile_details')
  const [statusActionLoading, setStatusActionLoading] = useState<ApplicationStatus | null>(null)
  const [statusActionError, setStatusActionError] = useState<string | null>(null)
  const [statusActionSuccess, setStatusActionSuccess] = useState<string | null>(null)
  const [showColumnMenu, setShowColumnMenu] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState<ExpertColumnKey[]>(() => {
    try {
      const raw = localStorage.getItem(RECRUITER_EXPERTS_VISIBLE_COLUMNS_KEY)
      if (!raw) return DEFAULT_VISIBLE_COLUMNS
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return DEFAULT_VISIBLE_COLUMNS
      const valid = parsed.filter((k): k is ExpertColumnKey => COLUMN_OPTIONS.some(c => c.key === k))
      return valid.length ? valid : DEFAULT_VISIBLE_COLUMNS
    } catch {
      return DEFAULT_VISIBLE_COLUMNS
    }
  })

  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignExpert, setAssignExpert] = useState<Expert | null>(null)
  const [assignDomainId, setAssignDomainId] = useState('')
  const [assignSubdomainId, setAssignSubdomainId] = useState('')
  const [assignDifficulty, setAssignDifficulty] = useState('mid')
  const [assignQuestions, setAssignQuestions] = useState<any[]>([])
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([])
  const [assignExpiresDays, setAssignExpiresDays] = useState(7)
  const [fetchingQuestions, setFetchingQuestions] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load domains
        const { domains: domainsData, subdomains: subdomainData } = await adminApi.getDomains()
        setDomainsList(domainsData)
        setSubdomainsList(subdomainData)

        const domainMap = domainsData.reduce((acc, d) => {
          acc[d.id] = d.name
          return acc
        }, {} as Record<string, string>)
        setDomains(domainMap)
        const subMap = subdomainData.reduce((acc, s) => {
          acc[s.id] = s.name
          return acc
        }, {} as Record<string, string>)
        setSubdomains(subMap)

        // Load experts (already filtered by role='talent' in backend)
        const { experts: expertsData } = await recruiterApi.getExperts()
        setExperts(expertsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load experts')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    localStorage.setItem(RECRUITER_EXPERTS_VISIBLE_COLUMNS_KEY, JSON.stringify(visibleColumns))
  }, [visibleColumns])

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return '-'
    }
  }

  const getDomainName = (expert: Expert) => {
    if (expert.primary_domain_name) return expert.primary_domain_name
    if ((expert as any).userdetails?.domain && domains[(expert as any).userdetails.domain]) return domains[(expert as any).userdetails.domain]
    return domains[expert.primary_domain_id] || (expert as any).userdetails?.domain || 'N/A'
  }

  const getSubdomainName = (expert: Expert) => {
    if (expert.subdomain_name) return expert.subdomain_name
    const ud = (expert as any).userdetails || {}
    if (ud.subdomain) return ud.subdomain
    if (ud.Subdomain) return ud.Subdomain
    if (ud.Subdomain && subdomains[ud.Subdomain]) return subdomains[ud.Subdomain]
    if (expert.subdomain_id && typeof expert.subdomain_id === 'object') {
      return expert.subdomain_id.name
    }
    if (subdomains[expert.subdomain_id as string]) return subdomains[expert.subdomain_id as string]
    return 'N/A'
  }

  const normalizeText = (val: unknown) => String(val ?? '').trim().toLowerCase()

  const toIdString = (val: unknown) => {
    if (!val) return ''
    if (val !== null && typeof val === 'object' && 'id' in (val as Record<string, unknown>)) {
      return String((val as any).id ?? '')
    }
    return String(val)
  }

  const resolveDomainId = (expert: Expert) => {
    const ud = (expert.userdetails || {}) as any
    const candidates = [
      ud.domain_id,
      ud.domainId,
      ud.domain,
      expert.primary_domain_id,
      (expert as any).domain_id,
    ].map(toIdString).filter(Boolean)

    for (const candidate of candidates) {
      if (domainsList.some(d => d.id === candidate)) return candidate
      const byName = domainsList.find(d => normalizeText(d.name) === normalizeText(candidate))
      if (byName) return byName.id
    }

    const domainName = normalizeText(getDomainName(expert))
    if (domainName && domainName !== 'n/a') {
      const match = domainsList.find(d => normalizeText(d.name) === domainName)
      if (match) return match.id
    }

    return ''
  }

  const resolveSubdomainId = (expert: Expert, domainId: string) => {
    const ud = (expert.userdetails || {}) as any
    const candidates = [
      ud.subdomain_id,
      ud.subdomainId,
      ud.subdomain,
      ud.Subdomain,
      expert.subdomain_id,
    ].map(toIdString).filter(Boolean)

    const matchesDomain = (sub: Subdomain) => !domainId || sub.domain_id === domainId

    for (const candidate of candidates) {
      const byId = subdomainsList.find(s => s.id === candidate && matchesDomain(s))
      if (byId) return byId.id
      const byName = subdomainsList.find(s => normalizeText(s.name) === normalizeText(candidate) && matchesDomain(s))
      if (byName) return byName.id
    }

    const subName = normalizeText(getSubdomainName(expert))
    if (subName && subName !== 'n/a') {
      const match = subdomainsList.find(s => normalizeText(s.name) === subName && matchesDomain(s))
      if (match) return match.id
      const fallback = subdomainsList.find(s => normalizeText(s.name) === subName)
      if (fallback) return fallback.id
    }

    return ''
  }

  const getApplicationExperience = (expert: Expert) => {
    const raw = expert.userdetails?.experience ?? expert.userdetails?.experience_level
    if (!raw) return 'N/A'
    const value = String(raw).trim().replace(/_/g, ' ')
    if (!value) return 'N/A'
    return value.charAt(0).toUpperCase() + value.slice(1)
  }

  const getPhone = (expert: Expert) => {
    const raw = (expert as any).phone ?? (expert as any).userdetails?.phone
    return raw ? String(raw) : '-'
  }

  const getAvailability = (expert: Expert) => {
    const raw = (expert as any).userdetails?.availability
    if (!raw) return '-'
    return String(raw).replace(/-/g, ' ')
  }

  const getAssessmentStatus = (expert: Expert) => {
    const raw = String((expert as any).assessment_status || '').trim().toLowerCase()
    if (!raw) return 'Pending'
    return raw.charAt(0).toUpperCase() + raw.slice(1)
  }

  const getTitle = (expert: Expert) => {
    const raw = (expert as any).userdetails?.title
    return raw ? String(raw) : '-'
  }

  const getCity = (expert: Expert) => {
    const raw = (expert as any).userdetails?.city
    return raw ? String(raw) : '-'
  }

  const getCountry = (expert: Expert) => {
    const raw = (expert as any).userdetails?.country
    return raw ? String(raw) : '-'
  }

  const getJoinedDate = (expert: Expert) => {
    const raw = (expert as any).date_created ?? expert.created_at
    return raw ? formatDate(String(raw)) : '-'
  }

  const getProfileCompletionStatus = (expert: Expert) => {
    const completion = Number(expert.userdetails?.profile_completed ?? 0)
    if (completion >= 100) return 'completed'
    if (completion <= 0) return 'not_started'
    return 'in_progress'
  }

  const normalizeApplicationStatus = (status: unknown): ApplicationStatus => {
    const normalized = String(status || '').trim().toLowerCase()
    if (normalized === 'approved' || normalized === 'rejected') return normalized
    return 'pending'
  }

  const getApplicationStatusMeta = (status: unknown) => {
    const normalized = normalizeApplicationStatus(status)
    if (normalized === 'approved') {
      return {
        label: 'Approved',
        color: 'var(--color-success)',
        background: 'rgba(16, 185, 129, 0.12)',
      }
    }
    if (normalized === 'rejected') {
      return {
        label: 'Rejected',
        color: 'var(--color-danger)',
        background: 'rgba(239, 68, 68, 0.12)',
      }
    }
    return {
      label: 'Pending Review',
      color: 'var(--color-text-muted)',
      background: 'rgba(148, 163, 184, 0.15)',
    }
  }

  const renderApplicationStatus = (status: unknown) => {
    const meta = getApplicationStatusMeta(status)
    return (
      <span
        style={{
          padding: '4px 10px',
          borderRadius: '999px',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: meta.color,
          background: meta.background,
          whiteSpace: 'nowrap',
        }}
      >
        {meta.label}
      </span>
    )
  }

  const handleViewClick = (expert: Expert) => {
    setSelectedExpert(expert)
    setModalTab('profile_details')
    setStatusActionError(null)
    setStatusActionSuccess(null)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedExpert(null)
    setStatusActionError(null)
    setStatusActionSuccess(null)
  }

  const handleApplicationDecision = async (decision: 'approved' | 'rejected') => {
    if (!selectedExpert) return

    setStatusActionLoading(decision)
    setStatusActionError(null)
    setStatusActionSuccess(null)

    try {
      const updated = await recruiterApi.updateApplicationStatus(selectedExpert.id, decision)
      const nextStatus = normalizeApplicationStatus(updated?.application_status || decision)

      const nextExperts = experts.map(expert => (
        expert.id === selectedExpert.id
          ? { ...expert, application_status: nextStatus }
          : expert
      ))
      setExperts(nextExperts)
      setSelectedExpert(prev => prev ? { ...prev, application_status: nextStatus } : prev)
      setStatusActionSuccess(`Application ${nextStatus} successfully.`)
    } catch (err) {
      setStatusActionError(err instanceof Error ? err.message : 'Failed to update application status')
    } finally {
      setStatusActionLoading(null)
    }
  }

  const getProfileFilteredExperts = (list: Expert[]) => {
    return list.filter((expert) => {
      const expertDomain = getDomainName(expert)
      const expertSubdomain = getSubdomainName(expert)
      const expertExperience = getApplicationExperience(expert)
      const expertCompletionStatus = getProfileCompletionStatus(expert)
      const expertApplication = normalizeApplicationStatus(expert.application_status)

      const domainMatch = domainFilter === 'all' || expertDomain === domainFilter
      const subdomainMatch = subdomainFilter === 'all' || expertSubdomain === subdomainFilter
      const experienceMatch = applicationExperienceFilter === 'all' || expertExperience === applicationExperienceFilter
      const completionMatch = profileCompletionFilter === 'all' || expertCompletionStatus === profileCompletionFilter
      const applicationMatch = applicationFilter === 'all' || expertApplication === applicationFilter

      return domainMatch && subdomainMatch && experienceMatch && completionMatch && applicationMatch
    })
  }

  const getFilteredExperts = () => {
    return getProfileFilteredExperts(experts)
  }

  const openAssignModal = (expert: Expert) => {
    // Navigate to the dedicated assign page instead of opening an inline modal
    navigate(`/recruiter/assign/${expert.id}`)
  }

  const closeAssignModal = () => {
    setShowAssignModal(false)
    setAssignExpert(null)
    setAssignError(null)
    setAssignSuccess(null)
  }

  useEffect(() => {
    if (!showModal && !showAssignModal) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (showAssignModal) {
        closeAssignModal()
        return
      }
      if (showModal) {
        closeModal()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showModal, showAssignModal])

  const handleFetchQuestions = async () => {
    if (!assignDomainId) {
      setAssignError('Domain is missing on this expert profile. Update the expert before assigning.')
      return
    }
    setFetchingQuestions(true)
    setAssignError(null)
    try {
      const result = await recruiterApi.getQuestionsForAssignment({
        domain_id: assignDomainId,
        subdomain_id: assignSubdomainId || undefined,
        difficulty_tier: assignDifficulty || undefined,
      })
      const questions = result.questions || []
      setAssignQuestions(questions)
      setSelectedQuestionIds(questions.map((q: any) => String(q.id)))
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Failed to fetch questions')
    } finally {
      setFetchingQuestions(false)
    }
  }

  const toggleQuestionSelection = (qid: string) => {
    setSelectedQuestionIds(prev =>
      prev.includes(qid) ? prev.filter(id => id !== qid) : [...prev, qid]
    )
  }

  const handleAssignAssessment = async () => {
    if (!assignExpert) return
    if (!assignDomainId) {
      setAssignError('Domain is missing on this expert profile. Update the expert before assigning.')
      return
    }
    if (selectedQuestionIds.length === 0) {
      setAssignError('Select at least one question')
      return
    }

    setAssigning(true)
    setAssignError(null)
    setAssignSuccess(null)
    try {
      await recruiterApi.assignAssessment(assignExpert.id, {
        domain_id: assignDomainId,
        subdomain_id: assignSubdomainId || undefined,
        difficulty_tier: assignDifficulty,
        question_ids: selectedQuestionIds,
        expires_days: assignExpiresDays,
      })
      setAssignSuccess('Assessment assigned successfully!')
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Failed to assign assessment')
    } finally {
      setAssigning(false)
    }
  }

  const domainOptions = Array.from(new Set(experts.map((expert) => getDomainName(expert)))).sort((a, b) => a.localeCompare(b))
  const subdomainOptions = Array.from(new Set(experts.map((expert) => getSubdomainName(expert)))).sort((a, b) => a.localeCompare(b))
  const applicationExperienceOptions = Array.from(new Set(experts.map((expert) => getApplicationExperience(expert)))).sort((a, b) => a.localeCompare(b))
  const applicationOptions: Array<{ value: ApplicationStatus; label: string }> = [
    { value: 'pending', label: 'Pending Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ]
  const profileCompletionOptions: Array<{ value: string; label: string }> = [
    { value: 'not_started', label: 'Not Started (0%)' },
    { value: 'in_progress', label: 'In Progress (1-99%)' },
    { value: 'completed', label: 'Completed (100%)' },
  ]
  const filteredExperts = getFilteredExperts()
  const isVisible = (key: ExpertColumnKey) => visibleColumns.includes(key)
  const toggleColumn = (key: ExpertColumnKey) => {
    setVisibleColumns((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev
        return prev.filter((k) => k !== key)
      }
      return [...prev, key]
    })
  }

  if (loading) {
    return (
      <div>
        {/* <div className="page-header">
          <h1>Expert</h1>
          <p>View and manage expert candidates</p>
        </div> */}
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p className="text-muted">Loading experts...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        {/* <div className="page-header">
          <h1>Expert</h1>
          <p>View and manage expert candidates</p>
        </div> */}
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--color-danger-light)' }}>
          <p style={{ color: 'var(--color-danger)' }}>Error: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', margin: 0, padding: 0, gap: 0 }}>
      {/* <div className="page-header">
        <h1>Expert</h1>
        <p>View and manage expert candidates</p>
      </div> */}

      {/* Filter Card - Static */}
      <div className="card" style={{ margin: 0, marginBottom: 0, padding: '16px', borderRadius: 0, borderBottom: '1px solid var(--color-border)', flex: 'none' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Filters</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            Domain
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                padding: '9px 10px',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              <option value="all">All Domains</option>
              {domainOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            Sub Domain
            <select
              value={subdomainFilter}
              onChange={(e) => setSubdomainFilter(e.target.value)}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                padding: '9px 10px',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              <option value="all">All Sub Domains</option>
              {subdomainOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            Application Experience
            <select
              value={applicationExperienceFilter}
              onChange={(e) => setApplicationExperienceFilter(e.target.value)}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                padding: '9px 10px',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              <option value="all">All Experience</option>
              {applicationExperienceOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            Application
            <select
              value={applicationFilter}
              onChange={(e) => setApplicationFilter(e.target.value as 'all' | ApplicationStatus)}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                padding: '9px 10px',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              <option value="all">All Applications</option>
              {applicationOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            Profile Completion
            <select
              value={profileCompletionFilter}
              onChange={(e) => setProfileCompletionFilter(e.target.value)}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                padding: '9px 10px',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              <option value="all">All Profile Completion</option>
              {profileCompletionOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Table Card - Scrollable */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', flex: 1, margin: 0, padding: 0, borderRadius: 0, minHeight: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px', marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', flex: 'none' }}>
          <h3 style={{ marginTop: 0, marginBottom: 0 }}>Expert Candidates</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
            <span className="text-muted" style={{ fontSize: '14px' }}>Showing {filteredExperts.length} candidates</span>
            <button
              type="button"
              onClick={() => setShowColumnMenu((v) => !v)}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                padding: '6px 10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <SlidersHorizontal size={14} />
              Columns
            </button>

            {showColumnMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '36px',
                  right: 0,
                  zIndex: 20,
                  width: '230px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '10px',
                  background: 'var(--color-surface)',
                  boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
                  padding: '10px',
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>
                  Visible Columns
                </div>
                {COLUMN_OPTIONS.map((col) => (
                  <label key={col.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 2px', cursor: 'pointer', fontSize: '13px' }}>
                    <input
                      type="checkbox"
                      checked={isVisible(col.key)}
                      onChange={() => toggleColumn(col.key)}
                    />
                    {col.label}
                  </label>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
                  <button
                    type="button"
                    onClick={() => setVisibleColumns(DEFAULT_VISIBLE_COLUMNS)}
                    style={{ border: 'none', background: 'transparent', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, padding: 0 }}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowColumnMenu(false)}
                    style={{ border: 'none', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, padding: 0 }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>

        {filteredExperts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p className="text-muted">No expert candidates found in this category</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px',
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                  {isVisible('name') && <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Name</th>}
                  {isVisible('email') && <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Email</th>}
                  {isVisible('phone') && <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Phone</th>}
                  {isVisible('domain') && <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Domain</th>}
                  {isVisible('subdomain') && <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Subdomain</th>}
                  {isVisible('experience') && <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Experience</th>}
                  {isVisible('availability') && <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Availability</th>}
                  {isVisible('completion') && <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Completion</th>}
                  {isVisible('application') && <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Application</th>}
                  {isVisible('assessment') && <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Assessment</th>}
                  {isVisible('title') && <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Title</th>}
                  {isVisible('city') && <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>City</th>}
                  {isVisible('country') && <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Country</th>}
                  {isVisible('joined') && <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Joined</th>}
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExperts.map((expert, idx) => (
                  <tr
                    key={expert.id}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                      transition: 'none',
                    }}
                  >
                    {isVisible('name') && (
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600 }}>{expert.name || expert.full_name || '-'}</div>
                      </td>
                    )}
                    {isVisible('email') && (
                      <td style={{ padding: '12px 16px' }}>
                        <div>{expert.userdetails?.email || expert.email || '-'}</div>
                      </td>
                    )}
                    {isVisible('phone') && (
                      <td style={{ padding: '12px 16px' }}>
                        <div>{getPhone(expert)}</div>
                      </td>
                    )}
                    {isVisible('domain') && (
                      <td style={{ padding: '12px 16px' }}>
                        <div>{getDomainName(expert)}</div>
                      </td>
                    )}
                    {isVisible('subdomain') && (
                      <td style={{ padding: '12px 16px' }}>
                        <div>{getSubdomainName(expert)}</div>
                      </td>
                    )}
                    {isVisible('experience') && (
                      <td style={{ padding: '12px 16px' }}>
                        <div>{getApplicationExperience(expert) === 'N/A' ? '-' : getApplicationExperience(expert)}</div>
                      </td>
                    )}
                    {isVisible('availability') && (
                      <td style={{ padding: '12px 16px' }}>
                        <div>{getAvailability(expert)}</div>
                      </td>
                    )}
                    {isVisible('completion') && (
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '60px', height: '6px', backgroundColor: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                backgroundColor: 'var(--color-primary)',
                                width: `${expert.userdetails?.profile_completed || 0}%`,
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)' }}>{expert.userdetails?.profile_completed || 0}%</span>
                        </div>
                      </td>
                    )}
                    {isVisible('application') && (
                      <td style={{ padding: '12px 16px' }}>
                        {renderApplicationStatus(expert.application_status)}
                      </td>
                    )}
                    {isVisible('assessment') && (
                      <td style={{ padding: '12px 16px' }}>
                        <div>{getAssessmentStatus(expert)}</div>
                      </td>
                    )}
                    {isVisible('title') && (
                      <td style={{ padding: '12px 16px' }}>
                        <div>{getTitle(expert)}</div>
                      </td>
                    )}
                    {isVisible('city') && (
                      <td style={{ padding: '12px 16px' }}>
                        <div>{getCity(expert)}</div>
                      </td>
                    )}
                    {isVisible('country') && (
                      <td style={{ padding: '12px 16px' }}>
                        <div>{getCountry(expert)}</div>
                      </td>
                    )}
                    {isVisible('joined') && (
                      <td style={{ padding: '12px 16px' }}>
                        <div>{getJoinedDate(expert)}</div>
                      </td>
                    )}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleViewClick(expert)}
                          aria-label="View expert details"
                          title="View expert details"
                          style={{
                            background: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            fontWeight: 500,
                            transition: 'none',
                          }}
                        >
                          <Eye size={14} />
                        </button>
                        {normalizeApplicationStatus(expert.application_status) === 'approved' && (
                          <button
                            onClick={() => openAssignModal(expert)}
                            style={{
                              background: 'var(--color-success)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '6px 12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: 500,
                              transition: 'none',
                            }}
                          >
                            <ClipboardList size={14} /> Asses
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && selectedExpert && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={closeModal}>
          <div style={{
            backgroundColor: 'var(--color-bg)',
            borderRadius: '14px',
            maxWidth: '960px',
            width: '95%',
            maxHeight: '92vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 16px 50px rgba(0,0,0,0.28)',
          }} onClick={e => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(0,0,0,0.06)',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                zIndex: 10,
              }}
            >
              <X size={18} />
            </button>

            <div style={{ padding: '28px 32px 32px' }}>
              {(() => {
                const gradingData =
                  (selectedExpert as any).grading ??
                  (selectedExpert as any).latest_grading ??
                  (selectedExpert as any).gradingData ??
                  null
                const gradingLoading = Boolean(
                  (selectedExpert as any).gradingLoading ??
                  (selectedExpert as any).grading_loading ??
                  false
                )

                return (
                  <>
              <button
                onClick={closeModal}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--color-text-muted)',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '12px',
                  padding: 0,
                }}
              >
                <ArrowLeft size={14} /> Back
              </button>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '22px', fontWeight: 700, flexShrink: 0,
                }}>
                  {(selectedExpert.full_name || selectedExpert.email || '?').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{selectedExpert.full_name}</h2>
                  <a
                    href={`mailto:${selectedExpert.email}`}
                    style={{ color: 'var(--color-primary)', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}
                  >
                    <Mail size={12} /> {selectedExpert.email}
                  </a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {renderApplicationStatus(selectedExpert.application_status)}
                </div>
              </div>

              {/* Application Review */}
              <div
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))',
                  marginBottom: '20px',
                  padding: '16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>Application Review</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      Review this applicant and update custom users.application_status.
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      Onboarding: {(selectedExpert.onboarding_status || 'active').replace(/_/g, ' ')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => handleApplicationDecision('approved')}
                      disabled={statusActionLoading !== null}
                      style={{
                        border: 'none',
                        borderRadius: '8px',
                        padding: '9px 14px',
                        cursor: statusActionLoading ? 'not-allowed' : 'pointer',
                        background: 'var(--color-success)',
                        color: '#ffffff',
                        opacity: statusActionLoading && statusActionLoading !== 'approved' ? 0.65 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 600,
                      }}
                    >
                      <CheckCircle2 size={15} />
                      {statusActionLoading === 'approved' ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleApplicationDecision('rejected')}
                      disabled={statusActionLoading !== null}
                      style={{
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        borderRadius: '8px',
                        padding: '9px 14px',
                        cursor: statusActionLoading ? 'not-allowed' : 'pointer',
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: 'var(--color-danger)',
                        opacity: statusActionLoading && statusActionLoading !== 'rejected' ? 0.65 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 600,
                      }}
                    >
                      <XCircle size={15} />
                      {statusActionLoading === 'rejected' ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                </div>
                {statusActionError && (
                  <div style={{ marginTop: '10px', color: 'var(--color-danger)', fontSize: '12px' }}>
                    {statusActionError}
                  </div>
                )}
                {statusActionSuccess && (
                  <div style={{ marginTop: '10px', color: 'var(--color-success)', fontSize: '12px' }}>
                    {statusActionSuccess}
                  </div>
                )}
              </div>

              {modalTab === 'profile_details' ? (
                <>
                  {/* Profile Completion Section */}
                  <div style={{ marginBottom: '24px', background: 'var(--color-surface)', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>Profile Completion</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {selectedExpert.userdetails?.profile_completed || 0}%
                      </div>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          backgroundColor: 'var(--color-primary)',
                          width: `${selectedExpert.userdetails?.profile_completed || 0}%`,
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ marginBottom: '14px', color: 'var(--color-text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                      Basic Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {[
                        { label: 'Title', value: selectedExpert.userdetails?.title },
                        { label: 'Email', value: selectedExpert.userdetails?.email || selectedExpert.email },
                        { label: 'Country', value: selectedExpert.userdetails?.country },
                        { label: 'City', value: selectedExpert.userdetails?.city },
                        { label: 'Country Code', value: selectedExpert.userdetails?.country_code },
                        { label: 'Experience', value: selectedExpert.userdetails?.experience ?? selectedExpert.userdetails?.experience_level },
                        { label: 'Availability', value: selectedExpert.userdetails?.availability },
                        { label: 'Overview', value: selectedExpert.userdetails?.overview },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ background: 'var(--color-surface)', borderRadius: '8px', padding: '12px 14px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                          <div style={{ fontWeight: 500, fontSize: '14px', wordBreak: 'break-word' }}>
                            {value === null || value === undefined || value === '' ? '-' : String(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Skills & Expertise */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ marginBottom: '14px', color: 'var(--color-text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                      Skills & Expertise
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {[
                        { label: 'Labeling Types', value: selectedExpert.userdetails?.labeling_types },
                        { label: 'Data Types', value: selectedExpert.userdetails?.data_types },
                        { label: 'Labeling Software', value: selectedExpert.userdetails?.labeling_software },
                        { label: 'General Annotation Tasks', value: selectedExpert.userdetails?.general_annotation_tasks },
                        { label: 'Domain Expert Tasks', value: selectedExpert.userdetails?.domain_expert_tasks },
                        { label: 'Language Tasks', value: selectedExpert.userdetails?.language_tasks },
                        { label: 'Languages', value: selectedExpert.userdetails?.languages },
                        { label: 'Industries', value: selectedExpert.userdetails?.industries },
                      ].map(({ label, value }) => {
                        let displayValue = '-'
                        if (value) {
                          try {
                            if (typeof value === 'string') {
                              const parsed = JSON.parse(value)
                              displayValue = Array.isArray(parsed) ? parsed.join(', ') : JSON.stringify(parsed)
                            } else {
                              displayValue = String(value)
                            }
                          } catch {
                            displayValue = String(value)
                          }
                        }
                        return (
                          <div key={label} style={{ background: 'var(--color-surface)', borderRadius: '8px', padding: '12px 14px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                            <div style={{ fontWeight: 500, fontSize: '14px', wordBreak: 'break-word' }}>{displayValue}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <GradingSection grading={gradingData} loading={gradingLoading} />

                  {/* Files & Links */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ marginBottom: '14px', color: 'var(--color-text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                      Files & Links
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {[
                        { label: 'Resume File', value: selectedExpert.userdetails?.resume_file },
                        { label: 'Photo File', value: selectedExpert.userdetails?.photo_file },
                        { label: 'Portfolio Links', value: selectedExpert.userdetails?.portfolio_links },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ background: 'var(--color-surface)', borderRadius: '8px', padding: '12px 14px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                          <div style={{ fontWeight: 500, fontSize: '14px', wordBreak: 'break-word' }}>
                            {value === null || value === undefined || value === '' ? '-' : String(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Users Collection Info */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ marginBottom: '14px', color: 'var(--color-text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                      Users Collection
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {[
                        { label: 'Email', value: selectedExpert.email },
                        { label: 'Phone', value: selectedExpert.phone },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ background: 'var(--color-surface)', borderRadius: '8px', padding: '12px 14px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                          <div style={{ fontWeight: 500, fontSize: '14px', wordBreak: 'break-word' }}>
                            {value === null || value === undefined || value === '' ? '-' : String(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Education */}
                    {(() => {
                      const raw = selectedExpert.education
                      let items: any[] = []
                      try { items = typeof raw === 'string' ? JSON.parse(raw) : (Array.isArray(raw) ? raw : []) } catch { items = [] }
                      if (!items.length) return (
                        <div style={{ marginTop: '12px', background: 'var(--color-surface)', borderRadius: '8px', padding: '12px 14px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Education</div>
                          <div style={{ fontWeight: 500, fontSize: '14px' }}>-</div>
                        </div>
                      )
                      return (
                        <div style={{ marginTop: '12px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Education</div>
                          {items.map((edu: any, i: number) => (
                            <div key={i} style={{ background: 'var(--color-surface)', borderRadius: '8px', padding: '12px 14px', marginBottom: '8px' }}>
                              <div style={{ fontWeight: 600, fontSize: '14px' }}>{edu.institution || '-'}</div>
                              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                {[edu.degree, edu.field, edu.startYear ? `${edu.startYear}${edu.endYear ? ` – ${edu.endYear}` : ''}` : null, edu.grade ? `Grade: ${edu.grade}` : null].filter(Boolean).join(' · ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                    {/* Work Experience */}
                    {(() => {
                      const raw = selectedExpert.work_experience
                      let items: any[] = []
                      try { items = typeof raw === 'string' ? JSON.parse(raw) : (Array.isArray(raw) ? raw : []) } catch { items = [] }
                      if (!items.length) return (
                        <div style={{ marginTop: '12px', background: 'var(--color-surface)', borderRadius: '8px', padding: '12px 14px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Work Experience</div>
                          <div style={{ fontWeight: 500, fontSize: '14px' }}>-</div>
                        </div>
                      )
                      return (
                        <div style={{ marginTop: '12px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Work Experience</div>
                          {items.map((job: any, i: number) => (
                            <div key={i} style={{ background: 'var(--color-surface)', borderRadius: '8px', padding: '12px 14px', marginBottom: '8px' }}>
                              <div style={{ fontWeight: 600, fontSize: '14px' }}>{job.company || '-'} — {job.role || '-'}</div>
                              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                {[job.startDate ? `${job.startDate}${job.ongoing ? ' – Present' : (job.endDate ? ` – ${job.endDate}` : '')}` : null, job.description].filter(Boolean).join(' · ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                    {/* Labeling Experience */}
                    {(() => {
                      const raw = selectedExpert.labeling_experience
                      let items: any[] = []
                      try { items = typeof raw === 'string' ? JSON.parse(raw) : (Array.isArray(raw) ? raw : []) } catch { items = [] }
                      if (!items.length) return (
                        <div style={{ marginTop: '12px', background: 'var(--color-surface)', borderRadius: '8px', padding: '12px 14px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Labeling Experience</div>
                          <div style={{ fontWeight: 500, fontSize: '14px' }}>-</div>
                        </div>
                      )
                      return (
                        <div style={{ marginTop: '12px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Labeling Experience</div>
                          {items.map((exp: any, i: number) => (
                            <div key={i} style={{ background: 'var(--color-surface)', borderRadius: '8px', padding: '12px 14px', marginBottom: '8px' }}>
                              <div style={{ fontWeight: 600, fontSize: '14px' }}>{exp.title || '-'}</div>
                              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                {[exp.dataType, Array.isArray(exp.labelingTypes) ? exp.labelingTypes.join(', ') : exp.labelingTypes, exp.subjectMatter, exp.startDate ? `${exp.startDate}${exp.ongoing ? ' – Present' : (exp.endDate ? ` – ${exp.endDate}` : '')}` : null].filter(Boolean).join(' · ')}
                              </div>
                              {exp.description && <div style={{ fontSize: '13px', marginTop: '4px' }}>{exp.description}</div>}
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                </>
              ) : (
                <>
                  {/* Personal Information */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ marginBottom: '14px', color: 'var(--color-text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em' }}>
                      Personal Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      {[
                        { label: 'Full Name', value: selectedExpert.full_name },
                        { label: 'Email',     value: selectedExpert.email },
                        { label: 'Country',   value: selectedExpert.country },
                        { label: 'Signed Up', value: formatDate(selectedExpert.created_at) },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ background: 'var(--color-surface)', borderRadius: '8px', padding: '12px 14px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                          <div style={{ fontWeight: 500, fontSize: '14px', wordBreak: 'break-word' }}>{value || '-'}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ marginBottom: '14px', color: 'var(--color-text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em' }}>
                      Professional Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      {[
                        { label: 'Domain',           value: getDomainName(selectedExpert),    icon: <Briefcase size={13} /> },
                        { label: 'Subdomain',         value: getSubdomainName(selectedExpert), icon: null },
                        { label: 'Seniority Level',   value: selectedExpert.seniority_level ? selectedExpert.seniority_level.toUpperCase() : null, icon: <Award size={13} /> },
                        { label: 'Years Experience',  value: selectedExpert.years_experience ? `${selectedExpert.years_experience} years` : null, icon: null },
                        { label: 'Profile Completed', value: formatDate(selectedExpert.profile_completed_at), icon: <Calendar size={13} /> },
                        { label: 'Onboarding Status', value: (selectedExpert.onboarding_status || '').replace(/_/g, ' '), icon: null },
                      ].map(({ label, value, icon }) => (
                        <div key={label} style={{ background: 'var(--color-surface)', borderRadius: '8px', padding: '12px 14px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                          <div style={{ fontWeight: 500, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {icon}{value || '-'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {showAssignModal && assignExpert && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
        }} onClick={closeAssignModal}>
          <div style={{
            backgroundColor: 'var(--color-bg)',
            borderRadius: '14px',
            maxWidth: '720px',
            width: '95%',
            maxHeight: '92vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 16px 50px rgba(0,0,0,0.28)',
          }} onClick={e => e.stopPropagation()}>
            <button
              onClick={closeAssignModal}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(0,0,0,0.06)',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                zIndex: 10,
              }}
            >
              <X size={18} />
            </button>

            <div style={{ padding: '28px 32px 32px' }}>
              <button
                onClick={closeAssignModal}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--color-text-muted)',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '10px',
                  padding: 0,
                }}
              >
                <ArrowLeft size={14} /> Back
              </button>
              <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700 }}>Assign Assessment</h2>
              <p style={{ margin: '0 0 20px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                Assigning to <strong>{assignExpert.full_name || assignExpert.email}</strong>
              </p>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>Domain *</label>
                <div style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontSize: '14px', fontWeight: 600 }}>
                  {getDomainName(assignExpert)}
                </div>
                {!assignDomainId && (
                  <div style={{ marginTop: '6px', color: 'var(--color-danger)', fontSize: '12px' }}>
                    Domain is missing for this expert. Please update their profile before assigning.
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>Subdomain</label>
                <div style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontSize: '14px', fontWeight: 600 }}>
                  {getSubdomainName(assignExpert)}
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>Seniority / Difficulty</label>
                <select
                  value={assignDifficulty}
                  onChange={e => {
                    setAssignDifficulty(e.target.value)
                    setAssignQuestions([])
                    setSelectedQuestionIds([])
                  }}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontSize: '14px', fontFamily: 'inherit' }}
                >
                  <option value="no_experience">No experience</option>
                  <option value="junior">Junior</option>
                  <option value="mid">Mid</option>
                  <option value="senior">Senior</option>
                </select>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>Expires In (days)</label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={assignExpiresDays}
                  onChange={e => setAssignExpiresDays(Math.max(1, parseInt(e.target.value, 10) || 7))}
                  style={{ width: '100px', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontSize: '14px', fontFamily: 'inherit' }}
                />
              </div>

              <button
                onClick={handleFetchQuestions}
                disabled={!assignDomainId || fetchingQuestions}
                style={{
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  cursor: !assignDomainId ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  marginBottom: '16px',
                  opacity: !assignDomainId ? 0.5 : 1,
                }}
              >
                {fetchingQuestions ? 'Fetching...' : 'Fetch Questions'}
              </button>

              {assignQuestions.length > 0 && (
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
                      Questions ({selectedQuestionIds.length}/{assignQuestions.length} selected)
                    </label>
                    <button
                      onClick={() => {
                        if (selectedQuestionIds.length === assignQuestions.length) {
                          setSelectedQuestionIds([])
                        } else {
                          setSelectedQuestionIds(assignQuestions.map((q: any) => String(q.id)))
                        }
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 600 }}
                    >
                      {selectedQuestionIds.length === assignQuestions.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                    {assignQuestions.map((q: any) => {
                      const qid = String(q.id)
                      const isSelected = selectedQuestionIds.includes(qid)
                      return (
                        <div
                          key={qid}
                          onClick={() => toggleQuestionSelection(qid)}
                          style={{
                            padding: '10px 14px',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--color-border)',
                            background: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            transition: 'background 0.12s',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleQuestionSelection(qid)}
                            style={{ marginTop: '3px', accentColor: 'var(--color-primary)' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 500, lineHeight: 1.4 }}>
                              {q.prompt?.length > 120 ? q.prompt.slice(0, 120) + '...' : q.prompt}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                              {q.question_type} · {q.max_score} pts · {q.time_limit_minutes} min
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {assignQuestions.length === 0 && !fetchingQuestions && assignDomainId && (
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                  Click "Fetch Questions" to load matching questions.
                </p>
              )}

              {assignError && (
                <div style={{ marginBottom: '12px', color: 'var(--color-danger)', fontSize: '13px', background: 'var(--color-danger-light)', padding: '10px 14px', borderRadius: '8px' }}>
                  {assignError}
                </div>
              )}
              {assignSuccess && (
                <div style={{ marginBottom: '12px', color: 'var(--color-success)', fontSize: '13px', background: 'var(--color-success-light)', padding: '10px 14px', borderRadius: '8px' }}>
                  {assignSuccess}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={closeAssignModal}
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '13px',
                    fontFamily: 'inherit',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignAssessment}
                  disabled={assigning || !assignDomainId || selectedQuestionIds.length === 0 || !!assignSuccess}
                  style={{
                    background: 'var(--color-success)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    cursor: assigning ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    opacity: assigning || !assignDomainId || selectedQuestionIds.length === 0 || !!assignSuccess ? 0.5 : 1,
                  }}
                >
                  {assigning ? 'Assigning...' : 'Assign Assessment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
