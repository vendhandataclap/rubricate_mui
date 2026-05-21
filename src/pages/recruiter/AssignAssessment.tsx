import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Check, ChevronRight, ChevronLeft, Mail, Send } from 'lucide-react'
import { recruiterApi, adminApi } from '../../services/api'
import type { Expert, Question, Domain, Subdomain, DifficultyTier, QuestionType } from '../../types'

type WizardStep = 'profile' | 'mode' | 'configure' | 'confirm' | 'success'

export default function AssignAssessment() {
  const { expertId } = useParams<{ expertId: string }>()
  const navigate = useNavigate()

  const [expert, setExpert] = useState<Expert | null>(null)
  const [loadingExpert, setLoadingExpert] = useState(true)
  const [expertError, setExpertError] = useState<string | null>(null)
  const [domainsList, setDomainsList] = useState<Domain[]>([])
  const [subdomainsList, setSubdomainsList] = useState<Subdomain[]>([])

  // Wizard step
  const [step, setStep] = useState<WizardStep>('profile')

  const [assessmentMode, setAssessmentMode] = useState<'manual' | 'voice'>('manual')

  // Step 1: Profile/Domain selection
  const [selectedDomainId, setSelectedDomainId] = useState('')
  const [selectedSubdomainId, setSelectedSubdomainId] = useState('')
  const [difficulty, setDifficulty] = useState<DifficultyTier>('mid')

  // Step 2: Configuration
  const [expiresDays, setExpiresDays] = useState(7)
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | ''>('')
  const [totalQuestions, setTotalQuestions] = useState(10)
  const [questionTypeLimits, setQuestionTypeLimits] = useState<Record<string, number>>({
    'multiple_choice': 2,
    'open_text': 2,
  })
  const [enabledQuestionTypes, setEnabledQuestionTypes] = useState<Set<string>>(new Set([
    'multiple_choice',
    'open_text',
    'comparison',
    'error_identification',
    'ranking',
  ]))
  const [autoBalance, setAutoBalance] = useState(true)
  const [questions, setQuestions] = useState<Question[]>([])
  const [fetchingQuestions, setFetchingQuestions] = useState(false)
  const [questionsError, setQuestionsError] = useState<string | null>(null)
  const [questionsMetadata, setQuestionsMetadata] = useState<any>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showQuestionsDrawer, setShowQuestionsDrawer] = useState(false)

  // Assignment result
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    assessment_id: number | string
    question_count: number
    expires_at: string
    test_link: string
  } | null>(null)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  // Load expert + domains
  useEffect(() => {
    if (!expertId) return
    Promise.all([
      recruiterApi.getExperts(),
      adminApi.getDomains(),
    ]).then(([{ experts }, { domains, subdomains }]) => {
      const found = experts.find(e => e.id === expertId)
      if (found) setExpert(found)
      else setExpertError('Expert not found')
      setDomainsList(domains)
      setSubdomainsList(subdomains)
    }).catch(() => setExpertError('Failed to load expert')).finally(() => setLoadingExpert(false))
  }, [expertId])

  // Auto-resolve domain/subdomain from expert profile
  const normalizeText = (v: unknown) => String(v ?? '').trim().toLowerCase()
  const normalizeLoose = (v: unknown) => normalizeText(v).replace(/[^a-z0-9]+/g, ' ').trim()

  const parseSubdomainTokens = (value: unknown): string[] => {
    if (!value) return []
    if (Array.isArray(value)) {
      return value.flatMap(item => parseSubdomainTokens(item)).filter(Boolean)
    }
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>
      if (obj.id) return [String(obj.id).trim()].filter(Boolean)
      if (obj.name) return [String(obj.name).trim()].filter(Boolean)
      return []
    }
    return String(value)
      .split(',')
      .map(part => part.trim())
      .filter(Boolean)
  }

  const autoResolveDomainId = (): string => {
    if (!expert) return ''
    const ud = (expert.userdetails || {}) as any
    const candidates = [ud.domain_id, ud.domainId, ud.domain, expert.primary_domain_id, (expert as any).domain_id]
    for (const c of candidates) {
      if (!c) continue
      const str = String(c).trim()
      const byId = domainsList.find(d => d.id === str)
      if (byId) return byId.id
      const byName = domainsList.find(d => normalizeText(d.name) === normalizeText(str))
      if (byName) return byName.id
    }
    return ''
  }

  const resolveMappedSubdomainOptions = (domainId: string): Array<{ id: string; name: string }> => {
    if (!expert) return []
    const ud = (expert.userdetails || {}) as any
    const candidates = [ud.subdomain_id, ud.subdomainId, ud.subdomain, ud.Subdomain, expert.subdomain_id, expert.subdomain_name]
    const matchesDomain = (s: Subdomain) => !domainId || s.domain_id === domainId
    const seen = new Set<string>()
    const options: Array<{ id: string; name: string }> = []

    const findByName = (value: string, enforceDomain: boolean) => {
      const text = normalizeText(value)
      const loose = normalizeLoose(value)
      return subdomainsList.find((s) => {
        if (enforceDomain && !matchesDomain(s)) return false
        const nameText = normalizeText(s.name)
        const nameLoose = normalizeLoose(s.name)
        return nameText === text || nameLoose === loose
      })
    }

    for (const c of candidates) {
      const values = parseSubdomainTokens(c)
      for (const value of values) {
        const byId = subdomainsList.find(s => s.id === value && matchesDomain(s))
        const byName = findByName(value, true)
        // Fallback: if domain mapping is inconsistent, still try by name globally.
        const byNameAnyDomain = findByName(value, false)
        const match = byId || byName || byNameAnyDomain
        if (!match || seen.has(match.id)) continue
        seen.add(match.id)
        options.push({ id: match.id, name: match.name })
      }
    }

    return options
  }

  const getRawSubdomainText = (): string => {
    if (!expert) return ''
    const ud = (expert.userdetails || {}) as any
    const seen = new Set<string>()
    const tokens = [ud.subdomain, ud.Subdomain, expert.subdomain_name]
      .flatMap(item => parseSubdomainTokens(item))
      .filter(Boolean)
      .filter(item => {
        const key = normalizeLoose(item)
        if (!key || seen.has(key)) return false
        seen.add(key)
        return true
      })

    return tokens.join(', ')
  }

  const autoResolveDifficulty = (): DifficultyTier => {
    if (!expert) return 'mid'
    const ud = (expert.userdetails || {}) as any
    const candidates = [
      expert.seniority_level,
      ud.seniority_level,
      expert.experience,
      ud.experience,
      ud.experience_level,
      ud.seniority,
      ud.level,
    ]

    // Only check for valid difficulty tiers: no_experience, junior, mid, senior
    for (const candidate of candidates) {
      const value = String(candidate || '').trim().toLowerCase()
      if (!value) continue
      // Normalize hyphens to underscores to handle both "no-experience" and "no_experience"
      const normalized = value.replace(/-/g, '_')
      if (normalized === 'no_experience' || normalized === 'junior' || normalized === 'mid' || normalized === 'senior') {
        return (normalized === 'no_experience' ? 'no_experience' : normalized) as DifficultyTier
      }
    }

    // Default to mid if no valid data found
    return 'mid'
  }

  const formatDifficulty = (value: string) => {
    if (!value) return 'Not Set'
    return value.charAt(0).toUpperCase() + value.slice(1)
  }

  // Set assignment criteria from expert profile (read-only in UI)
  useEffect(() => {
    if (!expert || domainsList.length === 0) return
    const autoDomain = autoResolveDomainId()
    const autoDifficulty = autoResolveDifficulty()

    setSelectedDomainId(autoDomain)
    setDifficulty(autoDifficulty)
  }, [expert, domainsList])

  const mappedSubdomainOptions = useMemo(
    () => resolveMappedSubdomainOptions(selectedDomainId),
    [expert, selectedDomainId, subdomainsList]
  )

  useEffect(() => {
    if (mappedSubdomainOptions.length === 0) {
      setSelectedSubdomainId('')
      return
    }
    setSelectedSubdomainId(prev => (
      mappedSubdomainOptions.some(option => option.id === prev)
        ? prev
        : mappedSubdomainOptions[0].id
    ))
  }, [mappedSubdomainOptions])

  const rawSubdomainText = getRawSubdomainText()

  // Calculate if question type counts are valid
  const enabledTypesCounts = useMemo(() => {
    const sum = Array.from(enabledQuestionTypes).reduce((acc, type) => acc + (questionTypeLimits[type] || 0), 0)
    return {
      sum,
      isValid: enabledQuestionTypes.size > 0 && sum === totalQuestions,
    }
  }, [enabledQuestionTypes, questionTypeLimits, totalQuestions])

  const getDomainName = (id: string) => domainsList.find(d => d.id === id)?.name || ''
  const getSubdomainName = (id: string) => subdomainsList.find(s => s.id === id)?.name || ''
  const domainLabel = getDomainName(selectedDomainId) || expert?.primary_domain_name || 'Not Set'
  const subdomainLabel = selectedSubdomainId
    ? (getSubdomainName(selectedSubdomainId) || mappedSubdomainOptions.find(option => option.id === selectedSubdomainId)?.name || 'Not Set')
    : (rawSubdomainText || expert?.subdomain_name || 'All Subdomains')

  const handleFetchQuestions = async () => {
    if (!selectedDomainId) return
    setFetchingQuestions(true)
    setQuestionsError(null)
    setQuestions([])
    setQuestionsMetadata(null)
    setSelectedIds(new Set())
    try {
      // Filter question type limits to only enabled types
      const filteredLimits: Record<string, number> = {}
      Object.entries(questionTypeLimits).forEach(([type, limit]) => {
        if (enabledQuestionTypes.has(type)) {
          filteredLimits[type] = limit
        }
      })
      
      const result = await recruiterApi.getQuestionsForAssignment({
        domain_id: String(selectedDomainId),
        subdomain_id: selectedSubdomainId || undefined,
        difficulty_tier: difficulty,
        total_questions: totalQuestions,
        question_type_limits: filteredLimits,
        auto_balance: autoBalance,
      })
      setQuestions(result.questions)
      setQuestionsMetadata(result.metadata)
      setSelectedIds(new Set(result.questions.map(q => String(q.id))))
      if (result.questions.length === 0) {
        setQuestionsError(result.metadata?.warning || 'No active questions found for this domain/difficulty.')
      }
    } catch (err) {
      setQuestionsError(err instanceof Error ? err.message : 'Failed to fetch questions')
    } finally {
      setFetchingQuestions(false)
    }
  }

  const toggleQ = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleAssign = async () => {
    if (!expertId || selectedIds.size === 0) return
    setAssigning(true)
    setAssignError(null)
    try {
      const payload: any = {
        domain_id: String(selectedDomainId),
        subdomain_id: selectedSubdomainId || undefined,
        difficulty_tier: difficulty,
        question_ids: Array.from(selectedIds),
        expires_days: expiresDays,
        assessment_mode: assessmentMode,
      }
      if (timeLimitMinutes) {
        payload.time_limit_minutes = Number(timeLimitMinutes)
      }
      const data = await recruiterApi.assignAssessment(expertId, payload)
      setResult(data as any)
      setStep('success')
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Assignment failed')
    } finally {
      setAssigning(false)
    }
  }

  const handleSendEmail = async () => {
    if (!result) return
    setSendingEmail(true)
    setEmailError(null)
    try {
      await recruiterApi.sendTestLink(String(result.assessment_id))
      setEmailSent(true)
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Failed to send email')
    } finally {
      setSendingEmail(false)
    }
  }

  // Step indicator bar
  const wizardSteps: { id: WizardStep; label: string; num: number }[] = [
    { id: 'profile', label: 'Domain & Seniority', num: 1 },
    { id: 'mode', label: 'Mode', num: 2 },
    { id: 'configure', label: 'Configure & Select', num: 3 },
    { id: 'confirm', label: 'Review & Assign', num: 4 },
  ]

  const stepIdx = step === 'success' ? wizardSteps.length : wizardSteps.findIndex(s => s.id === step)

  // ── Loading / error ──────────────────────────────────────────────────────
  if (loadingExpert) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Loading expert…
      </div>
    )
  }
  if (expertError || !expert) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--color-danger)' }}>{expertError || 'Expert not found'}</p>
        <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => navigate(-1)}>Go Back</button>
      </div>
    )
  }

  // ── Success screen ──────────────────────────────────────────────────────
  if (step === 'success' && result) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 16px' }}>
        <StepBar steps={wizardSteps} currentIdx={wizardSteps.length} />

        <div style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px 36px',
          border: '1px solid var(--color-border)',
          textAlign: 'center',
          marginTop: 24,
        }}>
          <CheckCircle size={52} style={{ color: 'var(--color-success)', marginBottom: 16 }} />
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Assessment Assigned!</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 28 }}>
            {expert?.full_name || expert?.email} has been assigned an assessment with{' '}
            <strong>{result.question_count}</strong> questions.
            Expires: <strong>{new Date(result.expires_at).toLocaleDateString()}</strong>.
          </p>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
            Mode: <strong>{assessmentMode === 'voice' ? 'Voice Interview' : 'Manual Test'}</strong>
          </div>

          {/* Send Email Button */}
          <div style={{ marginBottom: 24 }}>
            {emailSent ? (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                color: 'var(--color-success)',
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}>
                <CheckCircle size={16} />
                Test link sent to {expert.email}
              </div>
            ) : (
              <>
                <button
                  className="btn btn-primary"
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  style={{ width: '100%', justifyContent: 'center', gap: 8 }}
                >
                  <Mail size={16} />
                  {sendingEmail ? 'Sending…' : `Send Test Link to ${expert.email}`}
                </button>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6 }}>
                  Link will expire in 5 minutes after sending
                </p>
              </>
            )}
            {emailError && (
              <div style={{ marginTop: 8, color: 'var(--color-danger)', fontSize: 13 }}>{emailError}</div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/recruiter/assignments')}
            >
              View Assignments
            </button>

          </div>
        </div>
      </div>
    )
  }

  // ── Main Wizard ────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '8px 0 40px' }}>
      {/* Header */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-text-secondary)', fontSize: 14, fontWeight: 500,
          marginBottom: 20, padding: 0,
        }}
      >
        <ArrowLeft size={16} /> Back to Experts
      </button>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Assign Assessment</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
          Create and send an assessment to{' '}
          <strong style={{ color: 'var(--color-text)' }}>{expert.full_name || expert.email}</strong>
        </p>
      </div>

      {/* Step indicator */}
      <StepBar steps={wizardSteps} currentIdx={stepIdx} />

      {/* Expert info card (always visible) */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        padding: '16px 20px',
        marginBottom: 20, marginTop: 20,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: '50%',
          background: 'var(--color-primary-light)',
          color: 'var(--color-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 16, flexShrink: 0,
        }}>
          {(expert.full_name || expert.email || '?')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{expert.full_name || '—'}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{expert.email}</div>
        </div>
      </div>

      {/* ── STEP 1: Domain, Subdomain & Seniority ──────────────────────────── */}
      {step === 'profile' && (
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: '24px',
          marginBottom: 20,
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Step 1: Domain & Seniority</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={fieldLabel}>Domain *</label>
              <input
                value={domainLabel}
                readOnly
                style={fieldInput}
              />
            </div>
            <div>
              <label style={fieldLabel}>Subdomain</label>
              {mappedSubdomainOptions.length > 1 ? (
                <select
                  value={selectedSubdomainId}
                  onChange={e => {
                    setSelectedSubdomainId(e.target.value)
                    setQuestions([])
                    setSelectedIds(new Set())
                    setQuestionsError(null)
                  }}
                  style={{ ...fieldInput, marginTop: 8 }}
                >
                  {mappedSubdomainOptions.map(option => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={subdomainLabel}
                  readOnly
                  style={fieldInput}
                />
              )}
            </div>
            <div>
              <label style={fieldLabel}>Seniority Level *</label>
              <input
                value={formatDifficulty(difficulty)}
                readOnly
                style={fieldInput}
              />
            </div>
          </div>

          {!selectedDomainId && (
            <div style={{
              background: 'var(--color-danger-light)', border: '1px solid var(--color-danger-light)',
              borderRadius: 'var(--radius-md)', padding: '12px 16px',
              color: 'var(--color-danger)', fontSize: 14, marginTop: 16,
            }}>
              Domain is not available in this expert profile. Update expert details before assigning.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
            <button
              className="btn btn-primary"
              onClick={() => setStep('mode')}
              disabled={!selectedDomainId}
            >
              Next: Mode <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Assessment Mode ─────────────────────────────────────── */}
      {step === 'mode' && (
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: '24px',
          marginBottom: 20,
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Step 2: Choose Mode</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <button
              type="button"
              onClick={() => setAssessmentMode('manual')}
              style={{
                textAlign: 'left',
                padding: 16,
                borderRadius: 'var(--radius-md)',
                border: assessmentMode === 'manual' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                background: assessmentMode === 'manual' ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Manual Test</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                Candidate answers questions in text using the standard assessment portal.
              </div>
            </button>
            <button
              type="button"
              onClick={() => setAssessmentMode('voice')}
              style={{
                textAlign: 'left',
                padding: 16,
                borderRadius: 'var(--radius-md)',
                border: assessmentMode === 'voice' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                background: assessmentMode === 'voice' ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Voice Interview</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                Candidate joins a LiveKit room and answers questions by voice.
              </div>
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <button className="btn btn-secondary" onClick={() => setStep('mode')}>
              <ChevronLeft size={16} /> Back
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setStep('configure')}
            >
              Next: Configure <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Time, Options & Question Selection ─────────────────────── */}
      {step === 'configure' && (
        <>
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            padding: '24px',
            marginBottom: 20,
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Step 3: Configure Assessment</h3>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                <span style={chipStyle}>
                  Domain: <strong>{domainLabel || '—'}</strong>
                </span>
                {subdomainLabel && (
                  <span style={chipStyle}>
                    Subdomain: <strong>{subdomainLabel}</strong>
                  </span>
                )}
                <span style={chipStyle}>
                  Seniority: <strong style={{ textTransform: 'capitalize' }}>{formatDifficulty(difficulty)}</strong>
                </span>
              </div>
            </div>

            {/* Basic Settings */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 12 }}>
                Basic Settings
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={fieldLabel}>Expires In (days) *</label>
                  <input
                    type="number" min={1} max={90}
                    value={expiresDays}
                    onChange={e => setExpiresDays(Math.max(1, parseInt(e.target.value) || 7))}
                    style={fieldInput}
                  />
                </div>
                <div>
                  <label style={fieldLabel}>
                    Time Limit (minutes)
                    <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 4 }}>optional</span>
                  </label>
                  <input
                    type="number" min={5} max={480}
                    value={timeLimitMinutes}
                    onChange={e => setTimeLimitMinutes(e.target.value ? Math.max(5, parseInt(e.target.value) || 0) : '')}
                    placeholder="No limit"
                    style={fieldInput}
                  />
                </div>
              </div>
            </div>

            {/* Question Configuration */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 12 }}>
                Question Configuration
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={fieldLabel}>Total Questions Needed *</label>
                  <input
                    type="number" min={1} max={100}
                    value={totalQuestions}
                    onChange={e => setTotalQuestions(Math.max(1, parseInt(e.target.value) || 10))}
                    style={fieldInput}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <label style={{ ...fieldLabel, flex: 1, marginBottom: 0 }}>
                    <input
                      type="checkbox"
                      checked={autoBalance}
                      onChange={e => setAutoBalance(e.target.checked)}
                      style={{ marginRight: 6, accentColor: 'var(--color-primary)' }}
                    />
                    <span>Auto-balance types</span>
                  </label>
                </div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 10 }}>
                Per-Type Limits (questions needed from each type)
              </div>

              <QuestionTypeLimitsEditor
                limits={questionTypeLimits}
                onChange={setQuestionTypeLimits}
                totalNeeded={totalQuestions}
                enabledTypes={enabledQuestionTypes}
                onEnabledTypesChange={setEnabledQuestionTypes}
                autoBalance={autoBalance}
              />
            </div>

            <div style={{ marginTop: 20 }}>
              <button
                onClick={handleFetchQuestions}
                disabled={!selectedDomainId || fetchingQuestions || !enabledTypesCounts.isValid}
                className="btn btn-secondary"
                title={!enabledTypesCounts.isValid ? `Question counts must equal ${totalQuestions}` : ''}
              >
                {fetchingQuestions ? 'Loading questions…' : questions.length > 0 ? 'Reload Questions' : 'Load Questions'}
              </button>
              {!enabledTypesCounts.isValid && enabledQuestionTypes.size > 0 && (
                <p style={{ fontSize: 12, color: 'var(--color-danger)', marginTop: 8 }}>
                  Question counts must total {totalQuestions} (currently {enabledTypesCounts.sum})
                </p>
              )}
            </div>
          </div>

          {/* Questions */}
          {(questions.length > 0 || questionsError) && (
            <div style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              padding: '24px',
              marginBottom: 20,
            }}>
              {questionsError ? (
                <p style={{ color: 'var(--color-danger)', fontSize: 14 }}>{questionsError}</p>
              ) : (
                <>
                  {questionsMetadata && (
                    <div style={{ 
                      background: 'var(--color-bg)', 
                      border: '1px solid var(--color-border)', 
                      borderRadius: 'var(--radius-md)', 
                      padding: '12px 14px', 
                      marginBottom: 16,
                      fontSize: 12,
                    }}>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <span>
                          <strong>Total Available:</strong> {questionsMetadata.total_available}
                        </span>
                        <span>
                          <strong>Auto-balanced:</strong> {questionsMetadata.auto_balanced ? 'Yes' : 'No'}
                        </span>
                        <span>
                          <strong>Types:</strong> {questionsMetadata.all_types_available?.join(', ') || 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700 }}>
                      Questions — {selectedIds.size} of {questions.length} selected
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setShowQuestionsDrawer(true)}
                        disabled={questions.length === 0}
                      >
                        View All
                      </button>
                      <button
                        onClick={() => {
                          if (selectedIds.size === questions.length) setSelectedIds(new Set())
                          else setSelectedIds(new Set(questions.map(q => String(q.id))))
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: 13, fontWeight: 600 }}
                      >
                        {selectedIds.size === questions.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                  </div>
                  <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: 360, overflowY: 'auto' }}>
                    {questions.map((q, idx) => {
                      const qid = String(q.id)
                      const sel = selectedIds.has(qid)
                      return (
                        <div
                          key={qid}
                          onClick={() => toggleQ(qid)}
                          style={{
                            padding: '12px 16px',
                            cursor: 'pointer',
                            borderBottom: idx < questions.length - 1 ? '1px solid var(--color-border)' : 'none',
                            background: sel ? 'var(--color-primary-light)' : 'transparent',
                            display: 'flex', gap: 12, alignItems: 'flex-start',
                            transition: 'background 0.1s',
                          }}
                        >
                          <input
                            type="checkbox" checked={sel} onChange={() => toggleQ(qid)}
                            style={{ marginTop: 2, accentColor: 'var(--color-primary)', flexShrink: 0 }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5 }}>
                              {q.prompt?.length > 130 ? q.prompt.slice(0, 130) + '…' : q.prompt}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, display: 'flex', gap: 10 }}>
                              <span>{q.question_type}</span>
                              <span>{q.max_score} pts</span>
                              <span>{q.time_limit_minutes} min</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
            <button className="btn btn-secondary" onClick={() => setStep('mode')}>
              <ChevronLeft size={16} /> Back
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setStep('confirm')}
              disabled={selectedIds.size === 0}
            >
              Next: Review <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}

      {/* ── STEP 4: Confirmation ─────────────────────────────────────────── */}
      {step === 'confirm' && (
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: '24px',
          marginBottom: 20,
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Step 4: Review & Assign</h3>

          <div style={{
            background: 'var(--color-bg)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            padding: '16px 20px',
            marginBottom: 20,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
              <ConfirmRow label="Expert" value={expert.full_name || expert.email} />
              <ConfirmRow label="Email" value={expert.email} />
              <ConfirmRow label="Domain" value={domainLabel || 'Not Set'} />
              {subdomainLabel && (
                <ConfirmRow label="Subdomain" value={subdomainLabel} />
              )}
              <ConfirmRow label="Seniority" value={formatDifficulty(difficulty)} />
              <ConfirmRow label="Mode" value={assessmentMode === 'voice' ? 'Voice Interview' : 'Manual Test'} />
              <ConfirmRow label="Questions" value={`${selectedIds.size} questions`} />
              <ConfirmRow label="Expires In" value={`${expiresDays} days`} />
              {timeLimitMinutes && (
                <ConfirmRow label="Time Limit" value={`${timeLimitMinutes} minutes`} />
              )}
            </div>
          </div>

          {/* Selected questions summary */}
          <div style={{
            marginBottom: 20,
            background: 'var(--color-bg)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>
                SELECTED QUESTIONS
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>
                {selectedIds.size} questions ready
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                Preview the full list and details in the drawer.
              </div>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => setShowQuestionsDrawer(true)}
              disabled={selectedIds.size === 0}
            >
              View Questions
            </button>
          </div>

          {assignError && (
            <div style={{
              background: 'var(--color-danger-light)', border: '1px solid var(--color-danger-light)',
              borderRadius: 'var(--radius-md)', padding: '12px 16px',
              color: 'var(--color-danger)', fontSize: 14, marginBottom: 16,
            }}>
              {assignError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
            <button className="btn btn-secondary" onClick={() => setStep('configure')}>
              <ChevronLeft size={16} /> Back
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAssign}
              disabled={assigning}
              style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
            >
              <Send size={14} />
              {assigning ? 'Assigning…' : `Assign Assessment (${selectedIds.size} questions)`}
            </button>
          </div>
        </div>
      )}
      <QuestionsDrawer
        open={showQuestionsDrawer}
        onClose={() => setShowQuestionsDrawer(false)}
        questions={questions}
        selectedIds={selectedIds}
        onToggle={toggleQ}
        allowSelection={step === 'configure'}
      />
    </div>
  )
}

// ── Helper components ────────────────────────────────────────────────────────

function StepBar({ steps, currentIdx }: { steps: { id: string; label: string; num: number }[]; currentIdx: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 0 }}>
      {steps.map((s, idx) => {
        const isActive = idx === currentIdx
        const isComplete = idx < currentIdx
        return (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                background: isComplete ? 'var(--color-success)' : isActive ? 'var(--color-primary)' : 'var(--color-border)',
                color: isComplete || isActive ? 'white' : 'var(--color-text-muted)',
              }}>
                {isComplete ? <Check size={14} /> : s.num}
              </div>
              <span style={{
                fontSize: 12, fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
              }}>
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2, marginLeft: 8, marginRight: 8,
                background: isComplete ? 'var(--color-success)' : 'var(--color-border)',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function QuestionTypeLimitsEditor({ limits, onChange, totalNeeded, enabledTypes, onEnabledTypesChange, autoBalance }: {
  limits: Record<string, number>
  onChange: (limits: Record<string, number>) => void
  totalNeeded: number
  enabledTypes: Set<string>
  onEnabledTypesChange: (types: Set<string>) => void
  autoBalance: boolean
}) {
  const allTypes = [
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'open_text', label: 'Open Text' },
    { value: 'comparison', label: 'Comparison' },
    { value: 'error_identification', label: 'Error Identification' },
    { value: 'ranking', label: 'Ranking' },
  ]

  const handleToggleType = (type: string) => {
    const newEnabled = new Set(enabledTypes)
    const newLimits = { ...limits }
    
    if (newEnabled.has(type)) {
      // Unchecking - remove from limits
      newEnabled.delete(type)
      delete newLimits[type]
    } else {
      // Checking - add to limits
      newEnabled.add(type)
      
      if (autoBalance) {
        // Auto balance: distribute evenly with remainder
        const enabledCount = newEnabled.size
        const baseValue = Math.floor(totalNeeded / enabledCount)
        const remainder = totalNeeded % enabledCount
        
        let idx = 0
        const typesArray = Array.from(newEnabled)
        typesArray.forEach(t => {
          // Distribute remainder to first N types
          newLimits[t] = baseValue + (idx < remainder ? 1 : 0)
          idx++
        })
      } else {
        // Manual: add with default value of 1
        newLimits[type] = 1
      }
    }
    
    onEnabledTypesChange(newEnabled)
    onChange(newLimits)
  }

  const handleChangeLimit = (type: string, value: number) => {
    onChange({ ...limits, [type]: Math.max(0, value) })
  }

  // When autoBalance changes, redistribute if enabled
  useEffect(() => {
    if (autoBalance && enabledTypes.size > 0) {
      const enabledCount = enabledTypes.size
      const baseValue = Math.floor(totalNeeded / enabledCount)
      const remainder = totalNeeded % enabledCount
      const newLimits: Record<string, number> = {}
      
      let idx = 0
      const typesArray = Array.from(enabledTypes)
      typesArray.forEach(type => {
        // Distribute remainder to first N types
        newLimits[type] = baseValue + (idx < remainder ? 1 : 0)
        idx++
      })
      
      onChange(newLimits)
    }
  }, [autoBalance, enabledTypes, totalNeeded])

  // Calculate sum of only enabled types
  const enabledSum = Array.from(enabledTypes).reduce((sum, type) => sum + (limits[type] || 0), 0)
  const isValid = enabledSum === totalNeeded
  const isIncomplete = enabledTypes.size === 0

  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 24 }} />
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
          Type
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>
          Questions
        </div>
      </div>

      {allTypes.map(type => {
        const isEnabled = enabledTypes.has(type.value)
        const displayValue = limits[type.value] || 0
        
        return (
          <div key={type.value} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, marginBottom: 8, alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={() => handleToggleType(type.value)}
              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--color-primary)' }}
            />
            <span style={{ fontSize: 13, opacity: isEnabled ? 1 : 0.6 }}>{type.label}</span>
            {isEnabled && (
              autoBalance ? (
                <div
                  style={{
                    width: 60,
                    padding: '4px 8px',
                    fontSize: 13,
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)',
                    fontWeight: 600,
                  }}
                >
                  {displayValue}
                </div>
              ) : (
                <input
                  type="number"
                  min={0}
                  max={totalNeeded}
                  value={displayValue}
                  onChange={e => handleChangeLimit(type.value, parseInt(e.target.value) || 0)}
                  style={{
                    width: 60,
                    padding: '4px 8px',
                    fontSize: 13,
                    border: `1px solid ${isValid ? 'var(--color-border)' : 'var(--color-danger)'}`,
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                  }}
                />
              )
            )}
          </div>
        )
      })}

      <div style={{ 
        marginTop: 12, 
        paddingTop: 12, 
        borderTop: '1px solid var(--color-border)',
        display: 'flex', 
        justifyContent: 'space-between', 
        fontSize: 12, 
        fontWeight: 600,
        color: isIncomplete ? 'var(--color-text-muted)' : isValid ? 'var(--color-success)' : 'var(--color-danger)',
      }}>
        <span>Total:</span>
        <span>{enabledSum} / {totalNeeded}</span>
      </div>
    </div>
  )
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
        {value}
      </div>
    </div>
  )
}

function QuestionsDrawer({
  open,
  onClose,
  questions,
  selectedIds,
  onToggle,
  allowSelection,
}: {
  open: boolean
  onClose: () => void
  questions: Question[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
  allowSelection: boolean
}) {
  if (!open) return null

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          zIndex: 50,
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: 'min(520px, 92vw)',
          background: 'var(--color-surface)',
          borderLeft: '1px solid var(--color-border)',
          boxShadow: '0 20px 60px rgba(15, 23, 42, 0.2)',
          zIndex: 60,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{
          padding: '20px 20px 12px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Selected Questions</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              {selectedIds.size} selected of {questions.length} fetched
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
              cursor: 'pointer',
              fontSize: 16,
              lineHeight: 1,
            }}
            aria-label="Close questions drawer"
          >
            ×
          </button>
        </div>

        <div style={{
          padding: '16px 20px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          {questions.length === 0 && (
            <div style={{
              padding: '14px 16px',
              border: '1px dashed var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-muted)',
              fontSize: 13,
            }}>
              No questions selected yet.
            </div>
          )}

          {questions.map((q, idx) => (
            <div key={String(q.id)} style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              background: 'var(--color-bg)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                {allowSelection && (
                  <input
                    type="checkbox"
                    checked={selectedIds.has(String(q.id))}
                    onChange={() => onToggle(String(q.id))}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                )}
                <span style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {idx + 1}
                </span>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  {q.question_type?.replace(/_/g, ' ') || 'unknown'} • {q.max_score} pts • {q.time_limit_minutes} min
                </div>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                {q.prompt || 'No prompt provided'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const fieldLabel: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--color-text-muted)',
  marginBottom: 6,
}

const fieldInput: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg)',
  fontSize: 14,
  fontFamily: 'inherit',
}

const chipStyle: React.CSSProperties = {
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '99px',
  padding: '4px 12px',
  fontSize: 12,
  color: 'var(--color-text-secondary)',
}
