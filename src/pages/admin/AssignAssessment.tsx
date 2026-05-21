import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { recruiterApi, adminApi } from '../../services/api'
import type { Expert, Question, Domain, Subdomain } from '../../types'

export default function AssignAssessment() {
  const { expertId } = useParams<{ expertId: string }>()
  const navigate = useNavigate()

  const [expert, setExpert] = useState<Expert | null>(null)
  const [loadingExpert, setLoadingExpert] = useState(true)
  const [expertError, setExpertError] = useState<string | null>(null)
  const [domainsList, setDomainsList] = useState<Domain[]>([])
  const [subdomainsList, setSubdomainsList] = useState<Subdomain[]>([])

  // Form state
  const [difficulty, setDifficulty] = useState('mid')
  const [expiresDays, setExpiresDays] = useState(7)
  const [assessmentMode, setAssessmentMode] = useState<'manual' | 'voice'>('manual')
  const [selectedQuestionType, setSelectedQuestionType] = useState('')
  const [selectedSubdomainId, setSelectedSubdomainId] = useState('')

  // Questions
  const [questions, setQuestions] = useState<Question[]>([])
  const [fetchingQuestions, setFetchingQuestions] = useState(false)
  const [questionsError, setQuestionsError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Assignment result
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    assessment_id: number | string
    question_count: number
    expires_at: string
    test_link: string
  } | null>(null)
  // Load expert + domains list in parallel
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

  // Resolve domain: userdetails.domain is a string name like "Information Technology"
  // We need to match it to an actual domain ID in the domains collection.
  const normalizeText = (v: unknown) => String(v ?? '').trim().toLowerCase()

  const resolveDomainId = (): string => {
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

  const resolveDomainName = (): string => {
    if (!expert) return ''
    const ud = (expert.userdetails || {}) as any
    const domId = resolveDomainId()
    if (domId) {
      const match = domainsList.find(d => d.id === domId)
      if (match) return match.name
    }
    return ud.domain || expert.primary_domain_name || ''
  }

  const parseSubdomainTokens = (value: unknown): string[] => {
    if (!value) return []
    if (Array.isArray(value)) {
      return value
        .flatMap(v => parseSubdomainTokens(v))
        .filter(Boolean)
    }
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>
      if (obj.id) return [String(obj.id).trim()].filter(Boolean)
      if (obj.name) return [String(obj.name).trim()].filter(Boolean)
      return []
    }
    return String(value)
      .split(',')
      .map(v => v.trim())
      .filter(Boolean)
  }

  const resolveSubdomainOptions = (domainId: string): Array<{ id: string; name: string }> => {
    if (!expert) return []
    const ud = (expert.userdetails || {}) as any
    const candidates = [
      ud.subdomain_id,
      ud.subdomainId,
      ud.subdomain,
      ud.Subdomain,
      expert.subdomain_id,
      expert.subdomain_name,
    ]
    const matchesDomain = (s: Subdomain) => !domainId || s.domain_id === domainId
    const seen = new Set<string>()
    const options: Array<{ id: string; name: string }> = []

    for (const c of candidates) {
      const tokens = parseSubdomainTokens(c)
      for (const token of tokens) {
        const byId = subdomainsList.find(s => s.id === token && matchesDomain(s))
        const byName = subdomainsList.find(s => normalizeText(s.name) === normalizeText(token) && matchesDomain(s))
        const match = byId || byName
        if (!match) continue
        if (seen.has(match.id)) continue
        seen.add(match.id)
        options.push({ id: match.id, name: match.name })
      }
    }

    return options
  }

  const domainId = resolveDomainId()
  const domainName = resolveDomainName()
  const subdomainOptions = useMemo(() => resolveSubdomainOptions(domainId), [expert, domainId, subdomainsList])

  useEffect(() => {
    if (subdomainOptions.length === 0) {
      setSelectedSubdomainId('')
      return
    }
    setSelectedSubdomainId(prev => (
      subdomainOptions.some(option => option.id === prev)
        ? prev
        : subdomainOptions[0].id
    ))
  }, [subdomainOptions])

  const selectedSubdomain = subdomainOptions.find(option => option.id === selectedSubdomainId) || null
  const subdomainId = selectedSubdomain?.id || null
  const subdomainName = selectedSubdomain?.name || expert?.subdomain_name || ''

  const handleFetchQuestions = async () => {
    if (!domainId) return
    setFetchingQuestions(true)
    setQuestionsError(null)
    setQuestions([])
    setSelectedIds(new Set())
    try {
      const { questions: qs } = await recruiterApi.getQuestionsForAssignment({
        domain_id: String(domainId),
        subdomain_id: subdomainId ? String(subdomainId) : undefined,
        difficulty_tier: difficulty,
        question_type: selectedQuestionType || undefined,
      })
      setQuestions(qs)
      if (qs.length === 0) setQuestionsError('No active questions found for this domain/difficulty.')
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
      const data = await recruiterApi.assignAssessment(expertId, {
        domain_id: String(domainId),
        subdomain_id: subdomainId ? String(subdomainId) : undefined,
        difficulty_tier: difficulty,
        question_ids: Array.from(selectedIds),
        expires_days: expiresDays,
        assessment_mode: assessmentMode,
      })
      setResult(data as any)
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Assignment failed')
    } finally {
      setAssigning(false)
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────
  if (result) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px 36px',
          border: '1px solid var(--color-border)',
          textAlign: 'center',
        }}>
          <CheckCircle size={52} style={{ color: 'var(--color-success)', marginBottom: 16 }} />
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Assessment Assigned!</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 28 }}>
            {expert?.full_name || expert?.email} has been assigned an assessment with{' '}
            <strong>{result.question_count}</strong> questions.
            Expires: <strong>{new Date(result.expires_at).toLocaleDateString()}</strong>.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8 }}>
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

  // ── Main form ────────────────────────────────────────────────────────────
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

      {/* Expert info card */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        padding: '20px 24px',
        marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'var(--color-primary-light)',
          color: 'var(--color-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 18, flexShrink: 0,
        }}>
          {(expert.full_name || expert.email || '?')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{expert.full_name || '—'}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{expert.email}</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--color-text-secondary)' }}>
          <div><span style={{ fontWeight: 600 }}>Domain:</span> {domainName || '—'}</div>
          {subdomainName && <div><span style={{ fontWeight: 600 }}>Subdomain:</span> {subdomainName}</div>}
        </div>
      </div>

      {!domainId && (
        <div style={{
          background: 'var(--color-danger-light)', border: '1px solid var(--color-danger-light)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px',
          color: 'var(--color-danger)', fontSize: 14, marginBottom: 20,
        }}>
          This expert has no domain assigned. Update their profile before assigning an assessment.
        </div>
      )}

      {/* Configuration */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        padding: '24px',
        marginBottom: 20,
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Configuration</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 6 }}>
              Difficulty / Seniority
            </label>
            <select
              value={difficulty}
              onChange={e => { setDifficulty(e.target.value); setQuestions([]); setSelectedIds(new Set()) }}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 14, fontFamily: 'inherit' }}
            >
              <option value="no_experience">No experience</option>
              <option value="junior">Junior</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 6 }}>
              Expires In (days)
            </label>
            <input
              type="number" min={1} max={90}
              value={expiresDays}
              onChange={e => setExpiresDays(Math.max(1, parseInt(e.target.value) || 7))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 14, fontFamily: 'inherit' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 6 }}>
              Question Type
            </label>
            <select
              value={selectedQuestionType}
              onChange={e => { setSelectedQuestionType(e.target.value); setQuestions([]); setSelectedIds(new Set()) }}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 14, fontFamily: 'inherit' }}
            >
              <option value="">All Types</option>
              <option value="open_text">Open Text</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="comparison">Comparison</option>
              <option value="error_identification">Error Identification</option>
              <option value="ranking">Ranking</option>
            </select>
          </div>
        </div>

        {subdomainOptions.length > 1 && (
          <div style={{ marginTop: 16, maxWidth: 320 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 6 }}>
              Subdomain
            </label>
            <select
              value={selectedSubdomainId}
              onChange={e => { setSelectedSubdomainId(e.target.value); setQuestions([]); setSelectedIds(new Set()) }}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 14, fontFamily: 'inherit' }}
            >
              {subdomainOptions.map(option => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <button
            onClick={handleFetchQuestions}
            disabled={!domainId || fetchingQuestions}
            className="btn btn-secondary"
          >
            {fetchingQuestions ? 'Loading questions…' : 'Load Questions for Domain'}
          </button>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>
                  Questions — {selectedIds.size} of {questions.length} selected
                </h3>
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
              <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: 320, overflowY: 'auto' }}>
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

      {/* Error */}
      {assignError && (
        <div style={{
          background: 'var(--color-danger-light)', border: '1px solid var(--color-danger-light)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px',
          color: 'var(--color-danger)', fontSize: 14, marginBottom: 16,
        }}>
          {assignError}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
        <button
          className="btn btn-primary"
          onClick={handleAssign}
          disabled={assigning || !domainId || selectedIds.size === 0}
        >
          {assigning ? 'Assigning…' : `Assign Assessment (${selectedIds.size} questions)`}
        </button>
      </div>
    </div>
  )
}
