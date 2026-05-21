/**
 * TestPortal.tsx — Multi-step candidate test-taking platform with advanced time tracking.
 *
 * Steps:
 *   1. Intro     — shows assessment details and requires candidate login
 *   2. PreInst   — shows instructions and rules, ask to start assignment
 *   3. Test      — question-by-question with timer, auto-save, and time tracking
 *   4. Done      — submission confirmation
 * 
 * Features:
 * - Time tracking with multi-visit support
 * - Tab switch detection with warnings and auto-submit
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Clock, CheckCircle, ChevronRight, ChevronLeft, Save, Send, AlertCircle, BookOpen, LogIn } from 'lucide-react'
import PreInstruction from '../components/PreInstruction'
import TabSwitchWarningModal from '../components/TabSwitchWarningModal'
import { useAssignmentTimer } from '../hooks/useAssignmentTimer'
import { useQuestionTimer } from '../hooks/useQuestionTimer'
import { useTabSwitchMonitor } from '../hooks/useTabSwitchMonitor'
import { useAuth } from '../services/authContext'
import { testApi } from '../services/api'

// ── Types ───────────────────────────────────────────────────────────────────

interface TestQuestion {
  id: number
  prompt: string
  context: string
  context_a?: string | null
  context_b?: string | null
  question_type: string
  max_score: number
  time_limit_minutes: number
  min_response_length: number
  tags: string[]
  options?: string[] | string | null
  ranking_items?: Array<{ id: string; text: string }>
}

interface TestItem {
  question: TestQuestion
  response_id: number | null
  response_text: string
  last_saved_at: string | null
}

interface AssessmentInfo {
  id: number
  status: string
  difficulty_tier: string
  expires_at: string
  link_expires_at: string | null
  started_at: string | null
  submitted_at: string | null
  max_possible_score: number
  time_limit_minutes: number | null
  expert_id: { first_name: string; email: string } | null
  domain_id: { name: string } | null
}

type Step = 'intro' | 'pre_instruction' | 'test' | 'done'

const normalizeQuestionType = (value: string | undefined | null): string =>
  (value || 'open_text').trim().toLowerCase().replace(/[\s-]+/g, '_')

const parseQuestionOptions = (options: string[] | string | null | undefined): string[] => {
  if (Array.isArray(options)) {
    return options.map(opt => {
      if (opt && typeof opt === 'object') return String((opt as any).text ?? '').trim()
      return String(opt).trim()
    }).filter(Boolean)
  }
  if (typeof options === 'string') {
    return options
      .split(',')
      .map(opt => opt.trim())
      .filter(Boolean)
  }
  return []
}

const parseRankingItems = (items: Array<{ id: string; text: string }> | string[] | null | undefined): Array<{ id: string; text: string }> => {
  if (!items) return []
  if (Array.isArray(items)) {
    return items
      .map((item, idx) => {
        if (item && typeof item === 'object') {
          const text = String((item as any).text ?? '').trim()
          if (!text) return null
          return { id: String((item as any).id ?? idx + 1), text }
        }
        const text = String(item ?? '').trim()
        if (!text) return null
        return { id: String(idx + 1), text }
      })
      .filter(Boolean) as Array<{ id: string; text: string }>
  }
  return []
}

// ── Helper components ───────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div>
      <div style={{
        height: 6, background: 'var(--color-border)', borderRadius: 4, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: 'var(--color-primary)',
          transition: 'width 0.3s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: 'var(--color-text-muted)' }}>
        <span>Question {current} of {total}</span>
        <span>{pct}% complete</span>
      </div>
    </div>
  )
}

function CountdownTimer({ totalSeconds, onExpire }: { totalSeconds: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    setRemaining(totalSeconds)
  }, [totalSeconds])

  useEffect(() => {
    if (remaining <= 0) { onExpireRef.current(); return }
    const id = setInterval(() => setRemaining(r => {
      if (r <= 1) { onExpireRef.current(); clearInterval(id); return 0 }
      return r - 1
    }), 1000)
    return () => clearInterval(id)
  }, [remaining])

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const urgent = remaining < 60

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      color: urgent ? 'var(--color-danger)' : 'var(--color-text-secondary)',
      fontWeight: 600, fontSize: 14,
    }}>
      <Clock size={15} />
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export default function TestPortal() {
  const { assessmentId } = useParams<{ assessmentId: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, user, token, logout } = useAuth()

  const [step, setStep] = useState<Step>('intro')

  // Intro step
  const [info, setInfo] = useState<{ assessment: AssessmentInfo; question_count: number } | null>(null)
  const [infoLoading, setInfoLoading] = useState(true)
  const [infoError, setInfoError] = useState<string | null>(null)
  const [startingTest, setStartingTest] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

  // Session-based auth state
  const [sessionChecked, setSessionChecked] = useState(false)
  const [sessionMatched, setSessionMatched] = useState(false)
  const [sessionEmail, setSessionEmail] = useState('')
  const [sessionError, setSessionError] = useState<string | null>(null)

  // Timer hooks
  const assignmentTimer = useAssignmentTimer(assessmentId || '')
  const questionTimer = useQuestionTimer(assessmentId || '', null)

  // Tab switch monitor (only active during test)
  const tabMonitor = useTabSwitchMonitor(assessmentId || '')

  // Test step
  const [items, setItems] = useState<TestItem[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})  // response_id → text
  const [currentIdx, setCurrentIdx] = useState(0)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [savedId, setSavedId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Overall timer — use assessment-level time_limit_minutes when set;
  // fall back to summing per-question limits (default 15 min each)
  const totalTestSeconds = info?.assessment?.time_limit_minutes
    ? info.assessment.time_limit_minutes * 60
    : items.reduce((s, it) => s + (it.question.time_limit_minutes || 15) * 60, 0)

  // Load assessment info
  useEffect(() => {
    if (!assessmentId) return
    testApi.getInfo(assessmentId).then((d: { assessment: AssessmentInfo; question_count: number }) => {
      setInfo(d)
      if (d.assessment.status === 'submitted') setStep('done')
    }).catch(err => setInfoError(err.message)).finally(() => setInfoLoading(false))
  }, [assessmentId])

  // Session-based authentication check
  // If the user is already logged in, verify their email matches the assessment expert
  useEffect(() => {
    if (!assessmentId || !info || sessionChecked) return
    if (!isAuthenticated || !token) {
      setSessionError(null)
      setSessionChecked(true)
      return
    }
    setSessionError(null)
    testApi.verifySession(assessmentId)
      .then((result) => {
        if (result.matched) {
          setSessionMatched(true)
          setSessionEmail(result.email)
        }
      })
      .catch((err: Error) => {
        setSessionError(err.message || 'Unable to verify your signed-in account')
      })
      .finally(() => setSessionChecked(true))
  }, [assessmentId, info, isAuthenticated, token, sessionChecked])

  // Auto-save on answer change (debounced)
  const autoSaveTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({})
  const scheduleAutoSave = useCallback((responseId: number, text: string) => {
    if (autoSaveTimers.current[responseId]) clearTimeout(autoSaveTimers.current[responseId])
    autoSaveTimers.current[responseId] = setTimeout(async () => {
      try {
        await testApi.saveResponse(assessmentId!, responseId, text)
        setSavedId(responseId)
        setTimeout(() => setSavedId(s => s === responseId ? null : s), 2000)
      } catch { /* silent auto-save failure */ }
    }, 1800)
  }, [assessmentId])

  const handleAnswerChange = (responseId: number | null, text: string) => {
    setAnswers(prev => responseId !== null ? { ...prev, [responseId]: text } : prev)
    if (responseId !== null) scheduleAutoSave(responseId, text)
  }

  // ── Verified session access and start pre-instruction ───────────────────
  const handleAssessmentAccess = useCallback(async (candidateEmail?: string) => {
    const verifiedEmail = (candidateEmail ?? sessionEmail).trim()
    if (!verifiedEmail || !assessmentId) return
    setStartingTest(true)
    setStartError(null)
    try {
      // Start the test (sets started_at)
      await testApi.start(assessmentId, verifiedEmail)
      // Fetch questions
      const result = await testApi.getQuestions(assessmentId, verifiedEmail) as { assessment: AssessmentInfo; items: TestItem[] }
      setItems(result.items)
      const init: Record<number, string> = {}
      result.items.forEach(it => {
        if (it.response_id !== null) init[it.response_id] = it.response_text || ''
      })
      setAnswers(init)
      setCurrentIdx(0)
      setStep('pre_instruction')
    } catch (err: any) {
      setStartError(err.message ?? 'Failed to start test')
    } finally {
      setStartingTest(false)
    }
  }, [assessmentId, sessionEmail])

  useEffect(() => {
    if (!sessionMatched || !sessionChecked || step !== 'intro' || startingTest) return
    if (sessionStorage.getItem('rubricate_assessment_autostart') !== '1') return

    sessionStorage.removeItem('rubricate_assessment_autostart')
    void handleAssessmentAccess(sessionEmail)
  }, [handleAssessmentAccess, sessionChecked, sessionEmail, sessionMatched, startingTest, step])

  // ── Start assignment (from pre-instruction) ──────────────────────────────
  const handleStartAssignment = () => {
    if (!assessmentId) return
    assignmentTimer.startAssignment()
    setStep('test')
  }

  // ── Manual save ─────────────────────────────────────────────────────────
  const handleSave = async (item: TestItem) => {
    if (!item.response_id || !assessmentId) return
    setSavingId(item.response_id)
    try {
      await testApi.saveResponse(assessmentId!, item.response_id, answers[item.response_id] ?? '')
      setSavedId(item.response_id)
      setTimeout(() => setSavedId(s => s === item.response_id ? null : s), 2000)
    } catch { /* ignore */ } finally {
      setSavingId(null)
    }
  }

  // ── Navigate to next question ────────────────────────────────────────────
  const handleNextQuestion = () => {
    const nextIdx = Math.min(items.length - 1, currentIdx + 1)
    setCurrentIdx(nextIdx)
  }

  // ── Navigate to previous question ────────────────────────────────────────
  const handlePreviousQuestion = () => {
    const prevIdx = Math.max(0, currentIdx - 1)
    setCurrentIdx(prevIdx)
  }

  // ── Jump to question directly ────────────────────────────────────────────
  const handleJumpToQuestion = (idx: number) => {
    setCurrentIdx(idx)
  }

  // ── Submit test with timing data ─────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!assessmentId || submitting) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const responses = items
        .filter(it => it.response_id !== null)
        .map(it => ({
          response_id: it.response_id!,
          response_text: answers[it.response_id!] ?? '',
        }))

      // Get timing data from assignment timer
      const timingData = assignmentTimer.completeAssignment()

      // Add tab switch count and termination reason
      if (timingData && tabMonitor.monitorState) {
        timingData.tabSwitchCount = tabMonitor.monitorState.tabSwitchCount
        timingData.terminationReason = tabMonitor.monitorState.terminationReason
      }

      // Submit with timing
      await testApi.submit(assessmentId!, responses, timingData)

      setStep('done')
    } catch (err: any) {
      setSubmitError(err.message ?? 'Submission failed')
      setSubmitting(false)
    }
  }, [assessmentId, items, answers, assignmentTimer, tabMonitor.monitorState, submitting])

  // ── Auto-submit on tab switch termination ────────────────────────────────
  useEffect(() => {
    if (step === 'test' && tabMonitor.monitorState?.isTerminated && !submitting) {
      // Auto-submit immediately
      handleSubmit()
    }
  }, [tabMonitor.monitorState?.isTerminated, step, handleSubmit, submitting])

  const answeredCount = items.filter(it => it.response_id !== null && (answers[it.response_id!] || '').trim().length > 0).length

  // ── RENDER: loading ──────────────────────────────────────────────────────
  if (infoLoading) {
    return (
      <div style={outerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
            Loading assessment…
          </div>
        </div>
      </div>
    )
  }

  if (infoError) {
    return (
      <div style={outerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <AlertCircle size={48} style={{ color: 'var(--color-danger)', marginBottom: 16 }} />
            <h2 style={{ marginBottom: 8 }}>Assessment not found</h2>
            <p style={{ color: 'var(--color-text-muted)' }}>{infoError}</p>
          </div>
        </div>
      </div>
    )
  }

  const assessment = info!.assessment
  const domainName = assessment.domain_id
    ? (typeof assessment.domain_id === 'object' ? (assessment.domain_id as any).name : assessment.domain_id)
    : 'Assessment'

  // ── RENDER: done ─────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div style={outerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <CheckCircle size={64} style={{ color: 'var(--color-success)', marginBottom: 20 }} />
            <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 12 }}>
              Assessment Submitted!
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 16, marginBottom: 8 }}>
              Thank you for completing your assessment.
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
              Your responses have been recorded. The recruiter will review your answers and get back to you.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const difficultyLabel = assessment.difficulty_tier.replace(/_/g, ' ')
  const difficultyTitle = difficultyLabel.replace(/\b\w/g, c => c.toUpperCase())

  // ── RENDER: pre-instruction ─────────────────────────────────────────────
  if (step === 'pre_instruction') {
    const expiredAt = new Date(assessment.expires_at)
    const isExpired = expiredAt < new Date()

    return (
      <PreInstruction
        assessmentTitle={`${difficultyTitle} Level Assessment`}
        questionCount={info!.question_count}
        difficulty={assessment.difficulty_tier}
        domain={domainName}
        totalTimeLimit={info!.assessment.time_limit_minutes ?? info!.question_count * 15}
        isExpired={isExpired}
        expireDate={assessment.expires_at}
        onStart={handleStartAssignment}
      />
    )
  }

  // ── RENDER: intro ─────────────────────────────────────────────────────────
  if (step === 'intro') {
    const expiredAt = new Date(assessment.expires_at)
    const isExpired = expiredAt < new Date()
    const linkExpired = assessment.link_expires_at ? new Date(assessment.link_expires_at) < new Date() : false

    // Handle login redirect — log out current user, save return URL, and go to sign-in
    const handleLoginRedirect = () => {
      // Clear any existing session so the new login starts fresh
      if (isAuthenticated) {
        logout()
      }
      // Store the return URL so SignIn can redirect back after login
      sessionStorage.setItem('rubricate_return_url', `/test/${assessmentId}`)
      sessionStorage.setItem('rubricate_assessment_autostart', '1')
      navigate('/signin?role=expert')
    }

    return (
      <div style={outerStyle}>
        <div style={{ ...cardStyle, maxWidth: 560 }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-primary)', marginBottom: 4 }}>
              Rubricate
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Assessment Platform</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--color-primary-light)', color: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <BookOpen size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>
                {domainName} Assessment
              </h1>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                Difficulty: <strong style={{ textTransform: 'capitalize', color: 'var(--color-text)' }}>{difficultyLabel}</strong>
                {' · '}{info!.question_count} question{info!.question_count !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Details */}
          <div style={{
            background: 'var(--color-bg)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)', padding: '16px 20px',
            marginBottom: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px',
          }}>
            <InfoRow label="Status" value={<span style={{ textTransform: 'capitalize' }}>{assessment.status.replace('_', ' ')}</span>} />
            <InfoRow label="Questions" value={String(info!.question_count)} />
            <InfoRow
              label="Expires"
              value={expiredAt.toLocaleDateString()}
              danger={isExpired}
            />
            <InfoRow label="Difficulty" value={<span style={{ textTransform: 'capitalize' }}>{difficultyLabel}</span>} />
          </div>

          {isExpired || linkExpired ? (
            <div style={{
              background: 'var(--color-danger-light)', border: '1px solid var(--color-danger)',
              borderRadius: 'var(--radius-md)', padding: '14px 16px',
              color: 'var(--color-danger)', fontSize: 14, textAlign: 'center',
            }}>
              {linkExpired
                ? 'This assessment link has expired. Please ask your recruiter to send a new link.'
                : 'This assessment has expired. Please contact your recruiter.'
              }
            </div>
          ) : assessment.status === 'submitted' ? (
            <div style={{
              background: 'var(--color-success-light)', border: '1px solid var(--color-success)',
              borderRadius: 'var(--radius-md)', padding: '14px 16px',
              color: 'var(--color-success)', fontSize: 14, textAlign: 'center',
            }}>
              You have already submitted this assessment. Thank you!
            </div>
          ) : (
            <>
              {/* Session-based auth: user is logged in and email matches */}
              {sessionMatched && isAuthenticated ? (
                <>
                  <div style={{
                    background: 'var(--color-success-light)', border: '1px solid var(--color-success)',
                    borderRadius: 'var(--radius-md)', padding: '14px 16px',
                    color: 'var(--color-success)', fontSize: 14, marginBottom: 16,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle size={16} />
                      <span>Signed in as <strong>{sessionEmail}</strong></span>
                    </div>
                  </div>
                  <button
                    onClick={() => void handleAssessmentAccess()}
                    disabled={startingTest}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: 15 }}
                  >
                    {startingTest ? 'Starting…' : 'Continue to Assessment'}
                    {!startingTest && <ChevronRight size={18} />}
                  </button>
                </>
              ) : (
                <>
                  {/* Not logged in — require expert sign-in first */}
                  {!isAuthenticated && sessionChecked && (
                    <div style={{
                      background: 'var(--color-info-light)', border: '1px solid var(--color-info)',
                      borderRadius: 'var(--radius-md)', padding: '14px 16px',
                      color: 'var(--color-info)', fontSize: 14, marginBottom: 16,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <LogIn size={16} />
                        <span style={{ fontWeight: 600 }}>Sign in required</span>
                      </div>
                      <p style={{ fontSize: 13, marginBottom: 12, color: 'var(--color-text-secondary)' }}>
                        Sign in with the email address assigned to this assessment. Once verified, the assessment will continue automatically.
                      </p>
                      <button
                        onClick={handleLoginRedirect}
                        className="btn"
                        style={{
                          background: 'var(--color-primary)', color: '#fff', padding: '8px 16px',
                          fontSize: 13, borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <LogIn size={14} /> Sign In to Continue
                      </button>
                    </div>
                  )}

                  {isAuthenticated && !sessionChecked && (
                    <div style={{
                      background: 'var(--color-info-light)', border: '1px solid var(--color-info)',
                      borderRadius: 'var(--radius-md)', padding: '14px 16px',
                      color: 'var(--color-info)', fontSize: 13, marginBottom: 16,
                    }}>
                      Verifying your signed-in account…
                    </div>
                  )}

                  {isAuthenticated && sessionChecked && !sessionMatched && (
                    <div style={{
                      background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)',
                      borderRadius: 'var(--radius-md)', padding: '14px 16px',
                      color: 'var(--color-warning)', fontSize: 13, marginBottom: 16,
                    }}>
                      {sessionError
                        ? sessionError
                        : <>You are signed in as <strong>{user?.email}</strong>, but this assessment is assigned to a different email. Please sign in with the assigned account to continue.</>
                      }
                    </div>
                  )}

                  {isAuthenticated && sessionChecked && !sessionMatched && (
                    <button
                      onClick={handleLoginRedirect}
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: 15 }}
                    >
                      <LogIn size={16} /> Sign In with Assigned Account
                    </button>
                  )}
                  {startError && (
                    <div style={{ marginBottom: 14, color: 'var(--color-danger)', fontSize: 13, background: 'var(--color-danger-light)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                      {startError}
                    </div>
                  )}
                </>
              )}
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 12 }}>
                Assessment access is tied to the assigned account, and your answers will be auto-saved as you type.
              </p>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── RENDER: test ─────────────────────────────────────────────────────────
  const currentItem = items[currentIdx]
  const normalizedQuestionType = normalizeQuestionType(currentItem.question.question_type)
  const isMultipleChoice = normalizedQuestionType === 'multiple_choice' || normalizedQuestionType === 'mcq'
  const isRanking = normalizedQuestionType === 'ranking'
  const isComparison = normalizedQuestionType === 'comparison'
  const questionOptions = parseQuestionOptions(currentItem.question.options)
  const rankingItems = parseRankingItems(currentItem.question.ranking_items)
  const comparisonContextA = String(currentItem.question.context_a ?? '').trim()
  const comparisonContextB = String(currentItem.question.context_b ?? '').trim()
  const isLastQuestion = currentIdx === items.length - 1

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Tab Switch Warning Modal */}
      <TabSwitchWarningModal
        isOpen={tabMonitor.showWarning}
        onDismiss={tabMonitor.dismissWarning}
      />

      {/* Top bar */}
      <div style={{
        background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)',
        padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-primary)' }}>Rubricate</div>
        <ProgressBar current={currentIdx + 1} total={items.length} />
        <CountdownTimer totalSeconds={totalTestSeconds} onExpire={handleSubmit} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, maxWidth: 760, width: '100%', margin: '0 auto', padding: '32px 24px 120px' }}>
        {/* Question card */}
        <div style={{
          background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)', overflow: 'hidden',
        }}>
          {/* Question header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)' }}>
                Question {currentIdx + 1} of {items.length}
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--color-text-muted)' }}>
                <span style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '3px 10px', borderRadius: 99, fontWeight: 600 }}>
                  {normalizedQuestionType.replace(/_/g, ' ')}
                </span>
                <span>{currentItem.question.max_score} pts</span>
              </div>
            </div>
          </div>

          {/* Question body */}
          <div style={{ padding: '28px 24px' }}>
            <p style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.7, marginBottom: 20, color: 'var(--color-text)' }}>
              {currentItem.question.prompt}
            </p>

            {isComparison && (comparisonContextA || comparisonContextB) ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div style={{
                  background: 'var(--color-bg)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)', padding: '14px 18px',
                  fontSize: 14, lineHeight: 1.7, color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap',
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
                    Context A
                  </span>
                  {comparisonContextA || 'No context provided'}
                </div>
                <div style={{
                  background: 'var(--color-bg)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)', padding: '14px 18px',
                  fontSize: 14, lineHeight: 1.7, color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap',
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
                    Context B
                  </span>
                  {comparisonContextB || 'No context provided'}
                </div>
              </div>
            ) : currentItem.question.context && (
              <div style={{
                background: 'var(--color-bg)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)', padding: '14px 18px',
                marginBottom: 20, fontSize: 14, lineHeight: 1.7,
                color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap',
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
                  Context / Reference
                </span>
                {currentItem.question.context}
              </div>
            )}

            <div>
              <label style={{ ...labelStyle, marginBottom: 8 }}>
                Your Answer
                {!isMultipleChoice && !isRanking && (
                  <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 8 }}>
                    (min {currentItem.question.min_response_length} characters)
                  </span>
                )}
              </label>

              {isMultipleChoice ? (
                /* ── MCQ radio buttons ── */
                questionOptions.length ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {questionOptions.map((option, optIdx) => {
                      const currentAnswer = currentItem.response_id !== null ? (answers[currentItem.response_id] ?? '') : ''
                      const isSelected = currentAnswer === option
                      return (
                        <label
                          key={optIdx}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: 12,
                            padding: '14px 16px',
                            borderRadius: 'var(--radius-md)',
                            border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            background: isSelected ? 'var(--color-primary-light)' : 'var(--color-bg)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <input
                            type="radio"
                            name={`question-${currentItem.question.id}`}
                            value={option}
                            checked={isSelected}
                            onChange={() => handleAnswerChange(currentItem.response_id, option)}
                            style={{ marginTop: 2, accentColor: 'var(--color-primary)', flexShrink: 0 }}
                          />
                          <span style={{
                            fontSize: 14, lineHeight: 1.6,
                            color: isSelected ? 'var(--color-primary)' : 'var(--color-text)',
                            fontWeight: isSelected ? 600 : 400,
                          }}>
                            {option}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{
                    background: 'var(--color-danger-light)',
                    color: 'var(--color-danger)',
                    border: '1px solid var(--color-danger)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    fontSize: 13,
                  }}>
                    This multiple-choice question has no options configured yet.
                  </div>
                )
              ) : isRanking ? (
                rankingItems.length ? (
                  <>
                    <div style={{
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px',
                      marginBottom: 10,
                      fontSize: 13,
                      color: 'var(--color-text-secondary)',
                    }}>
                      Rank the following items from highest priority to lowest. Enter your ordered answer below as a comma-separated list.
                    </div>
                    <ol style={{ margin: '0 0 12px 18px', padding: 0, color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.7 }}>
                      {rankingItems.map(item => (
                        <li key={item.id}>{item.text}</li>
                      ))}
                    </ol>
                    <textarea
                      value={currentItem.response_id !== null ? (answers[currentItem.response_id] ?? '') : ''}
                      onChange={e => handleAnswerChange(currentItem.response_id, e.target.value)}
                      placeholder="Example: Item B, Item D, Item A, Item C"
                      rows={4}
                      style={{
                        width: '100%', padding: '14px 16px',
                        borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                        background: 'var(--color-bg)', fontSize: 14, fontFamily: 'inherit',
                        lineHeight: 1.7, resize: 'vertical', outline: 'none',
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={e => { e.target.style.borderColor = 'var(--color-primary)' }}
                      onBlur={e => { e.target.style.borderColor = 'var(--color-border)' }}
                    />
                  </>
                ) : (
                  <div style={{
                    background: 'var(--color-danger-light)',
                    color: 'var(--color-danger)',
                    border: '1px solid var(--color-danger)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    fontSize: 13,
                  }}>
                    This ranking question has no items configured yet.
                  </div>
                )
              ) : (
                /* ── Text answer (open_text, comparison, etc.) ── */
                <>
                  <textarea
                    value={currentItem.response_id !== null ? (answers[currentItem.response_id] ?? '') : ''}
                    onChange={e => handleAnswerChange(currentItem.response_id, e.target.value)}
                    placeholder="Write your answer here…"
                    rows={8}
                    style={{
                      width: '100%', padding: '14px 16px',
                      borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                      background: 'var(--color-bg)', fontSize: 14, fontFamily: 'inherit',
                      lineHeight: 1.7, resize: 'vertical', outline: 'none',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'var(--color-primary)' }}
                    onBlur={e => { e.target.style.borderColor = 'var(--color-border)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {currentItem.response_id !== null ? (answers[currentItem.response_id] ?? '').length : 0} chars
                    </span>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                  {savedId === currentItem.response_id && (
                    <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle size={11} /> Saved
                    </span>
                  )}
                  <button
                    onClick={() => handleSave(currentItem)}
                    disabled={savingId === currentItem.response_id || currentItem.response_id === null}
                    style={{
                      background: 'none', border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)', padding: '4px 10px',
                      cursor: 'pointer', fontSize: 11, fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 4,
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    <Save size={11} /> {savingId === currentItem.response_id ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Answered summary */}
        <div style={{ marginTop: 16, fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center' }}>
          {answeredCount} of {items.length} questions answered
        </div>

        {/* Navigation */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          padding: '16px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          zIndex: 10,
        }}>
          <button
            onClick={handlePreviousQuestion}
            disabled={currentIdx === 0}
            className="btn btn-secondary"
          >
            <ChevronLeft size={16} /> Previous
          </button>

          {/* Paginated Question Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Page info */}
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>
              Question {currentIdx + 1} of {items.length}
            </div>

            {/* Pagination controls with window of buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Previous page button */}
              <button
                onClick={() => {
                  const prevPageStart = Math.max(0, Math.floor(currentIdx / 7) * 7 - 7)
                  handleJumpToQuestion(prevPageStart)
                }}
                disabled={currentIdx < 7}
                style={{
                  width: 28, height: 28, borderRadius: '4px', border: '1px solid var(--color-border)',
                  cursor: currentIdx < 7 ? 'default' : 'pointer',
                  padding: 0, fontSize: 12, fontWeight: 600,
                  background: currentIdx < 7 ? 'var(--color-bg)' : 'var(--color-surface)',
                  color: currentIdx < 7 ? 'var(--color-text-muted)' : 'var(--color-text)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                title="Previous page"
              >
                ‹
              </button>

              {/* Visible question buttons window */}
              <div style={{ display: 'flex', gap: 4 }}>
                {(() => {
                  const pageSize = 7
                  const currentPage = Math.floor(currentIdx / pageSize)
                  const pageStart = currentPage * pageSize
                  const pageEnd = Math.min(pageStart + pageSize, items.length)
                  const visibleIndices = Array.from({ length: pageEnd - pageStart }, (_, i) => pageStart + i)

                  return visibleIndices.map((idx) => {
                    const it = items[idx]
                    const hasAnswer = it.response_id !== null && (answers[it.response_id] ?? '').trim().length > 0
                    return (
                      <button
                        key={idx}
                        onClick={() => handleJumpToQuestion(idx)}
                        style={{
                          width: 30, height: 30, borderRadius: '50%', border: 'none',
                          cursor: 'pointer', fontSize: 12, fontWeight: 600,
                          background: idx === currentIdx
                            ? 'var(--color-primary)'
                            : hasAnswer
                              ? 'var(--color-success)'
                              : 'var(--color-border)',
                          color: idx === currentIdx || hasAnswer ? 'white' : 'var(--color-text-muted)',
                          transition: 'background 0.15s',
                        }}
                        title={`Question ${idx + 1}${hasAnswer ? ' (answered)' : ''}`}
                      >
                        {idx + 1}
                      </button>
                    )
                  })
                })()}
              </div>

              {/* Next page button */}
              <button
                onClick={() => {
                  const nextPageStart = Math.floor(currentIdx / 7) * 7 + 7
                  handleJumpToQuestion(Math.min(nextPageStart, items.length - 1))
                }}
                disabled={currentIdx >= items.length - 7}
                style={{
                  width: 28, height: 28, borderRadius: '4px', border: '1px solid var(--color-border)',
                  cursor: currentIdx >= items.length - 7 ? 'default' : 'pointer',
                  padding: 0, fontSize: 12, fontWeight: 600,
                  background: currentIdx >= items.length - 7 ? 'var(--color-bg)' : 'var(--color-surface)',
                  color: currentIdx >= items.length - 7 ? 'var(--color-text-muted)' : 'var(--color-text)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                title="Next page"
              >
                ›
              </button>
            </div>
          </div>

          {isLastQuestion ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              {submitError && (
                <div style={{ fontSize: 12, color: 'var(--color-danger)' }}>{submitError}</div>
              )}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn btn-primary"
                style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
              >
                <Send size={15} /> {submitting ? 'Submitting…' : 'Submit Assessment'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="btn btn-primary"
            >
              Next <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Style helpers ────────────────────────────────────────────────────────────

const outerStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'var(--color-bg)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px 16px',
}

const cardStyle: React.CSSProperties = {
  background: 'var(--color-surface)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  padding: '36px 40px',
  width: '100%',
  maxWidth: 520,
  boxShadow: 'var(--shadow-md)',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--color-text-muted)',
  marginBottom: 6,
}

function InfoRow({ label, value, danger }: { label: string; value: React.ReactNode; danger?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: danger ? 'var(--color-danger)' : 'var(--color-text)' }}>
        {value}
      </div>
    </div>
  )
}
