import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, HelpCircle, AlertTriangle, Flag, Zap, Brain, MessageSquare, ChevronDown, ChevronUp, Edit2, Save, Mic, BarChart3 } from 'lucide-react'
import { recruiterApi } from '../../services/api'
import type { Assessment, AssessmentResponse, GradingRecord, GradingReport, RecruiterDecision } from '../../types'

type ScoreViewKey = 'overall' | 'profile' | 'assessment'

export default function AssessmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const backToAssignments = location.pathname.startsWith('/admin')
    ? '/admin/assignments'
    : '/recruiter/assignments'

  const [assessment, setAssessment]   = useState<Assessment | null>(null)
  const [responses,  setResponses]    = useState<AssessmentResponse[]>([])
  const [loading,    setLoading]      = useState(true)
  const [fetchError, setFetchError]   = useState<string | null>(null)
  const [gradingRecord, setGradingRecord] = useState<GradingRecord | null>(null)
  const [gradingReports, setGradingReports] = useState<GradingReport[]>([])

  const [decision,         setDecision]         = useState<RecruiterDecision>(null)
  const [notes,            setNotes]            = useState('')
  const [showConfirm,      setShowConfirm]      = useState(false)
  const [pendingDecision,  setPendingDecision]  = useState<RecruiterDecision>(null)
  const [submitting,       setSubmitting]       = useState(false)
  const [submitError,      setSubmitError]      = useState<string | null>(null)

  const [grading,      setGrading]      = useState(false)
  const [gradeError,   setGradeError]   = useState<string | null>(null)
  const [gradeSuccess, setGradeSuccess] = useState(false)

  const [overrides, setOverrides] = useState<Record<string, number | null>>({})
  const [recruiterFeedbacks, setRecruiterFeedbacks] = useState<Record<string, string>>({})

  // Score editing mode (can be toggled even after a decision is made)
  const [editingScores,   setEditingScores]   = useState(false)
  const [savingScores,    setSavingScores]    = useState(false)
  const [saveScoresError, setSaveScoresError] = useState<string | null>(null)
  const [saveScoresOk,    setSaveScoresOk]    = useState(false)
  const [decisionOpen,    setDecisionOpen]    = useState(true)

  // Fetch assessment detail from backend
  useEffect(() => {
    if (!id) return
    recruiterApi.getAssessmentDetail(id)
      .then(({ assessment: a, responses: r, grading, grading_reports }) => {
        setAssessment(a)
        setResponses(r)
        setGradingRecord(grading ?? null)
        setGradingReports(grading_reports ?? [])
        setDecision(a.recruiter_decision)
        setNotes(a.recruiter_notes ?? '')
        const init: Record<string, number | null> = {}
        const initFeedback: Record<string, string> = {}
        r.forEach(resp => {
          init[resp.id] = resp.override_score
          initFeedback[resp.id] = resp.recruiter_feedback ?? ''
        })
        setOverrides(init)
        setRecruiterFeedbacks(initFeedback)
      })
      .catch(err => setFetchError(err.message ?? 'Failed to load assessment'))
      .finally(() => setLoading(false))
  }, [id])


  useEffect(() => {
      if (!showConfirm) return

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setShowConfirm(false)
        }
      }

      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }, [showConfirm])

  if (loading) return (
    <div className="empty-state"><p>Loading assessment…</p></div>
  )

  if (fetchError || !assessment) return (
    <div className="empty-state">
      <h3>Assessment not found</h3>
      {fetchError && <p className="text-sm text-muted mt-1">{fetchError}</p>}
      <button className="btn btn-secondary mt-3" onClick={() => navigate(backToAssignments)}>Back to Assignments</button>
    </div>
  )

  // Calculate real-time total with overrides, normalised to out of 60
  const calculateTotal = () => {
    const rawTotal = responses.reduce((sum, r) => {
      const score = overrides[r.id] ?? r.ai_score ?? 0
      return sum + score
    }, 0)
    const rawMax = responses.length * (responses[0]?.question?.max_score ?? 10)
    return rawMax > 0 ? Math.round((rawTotal / rawMax) * 60 * 100) / 100 : 0
  }

  const currentTotal = calculateTotal()
  const currentPct = Math.round((currentTotal / 60) * 100)

  const handleOverride = (responseId: string, value: string, maxScore: number) => {
    const num = value === '' ? null : Math.max(0, Math.min(maxScore, Number(value)))
    setOverrides(prev => ({ ...prev, [responseId]: num }))
  }

  const handleSaveScores = async () => {
    if (!id) return
    setSavingScores(true)
    setSaveScoresError(null)
    setSaveScoresOk(false)
    try {
      const overridesList = responses.map(resp => ({
        response_id: resp.id,
        score: overrides[resp.id] ?? undefined,
        feedback: recruiterFeedbacks[resp.id] || undefined,
      })).filter(o => o.score !== undefined || o.feedback !== undefined)
      await recruiterApi.updateScores(id, { score_overrides: overridesList })
      setSaveScoresOk(true)
      setEditingScores(false)
      setTimeout(() => setSaveScoresOk(false), 3000)
    } catch (err: any) {
      setSaveScoresError(err.message ?? 'Failed to save scores')
    } finally {
      setSavingScores(false)
    }
  }

  const confirmDecision = (d: RecruiterDecision) => {
    setPendingDecision(d)
    setShowConfirm(true)
  }

  const executeDecision = async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const overridesList: { response_id: string; score?: number; feedback?: string }[] = Object.entries(overrides)
        .filter(([, v]) => v !== null)
        .map(([response_id, score]) => ({
          response_id,
          score: score!,
          feedback: recruiterFeedbacks[response_id] || undefined,
        }))
      // Also include responses that have feedback but no score override
      Object.entries(recruiterFeedbacks).forEach(([response_id, feedback]) => {
        if (feedback && !overridesList.find(o => o.response_id === response_id)) {
          overridesList.push({ response_id, feedback })
        }
      })
      await recruiterApi.submitDecision(id!, {
        decision: pendingDecision,
        notes,
        score_overrides: overridesList,
      })
      setDecision(pendingDecision)
      setShowConfirm(false)
    } catch (err: any) {
      setSubmitError(err.message ?? 'Failed to submit decision')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGradeNow = async () => {
    setGrading(true)
    setGradeError(null)
    setGradeSuccess(false)
    try {
      await recruiterApi.triggerGrading(id!)
      setGradeSuccess(true)
      const { assessment: a, responses: r, grading, grading_reports } = await recruiterApi.getAssessmentDetail(id!)
      setAssessment(a)
      setResponses(r)
      setGradingRecord(grading ?? null)
      setGradingReports(grading_reports ?? [])
      const init: Record<string, number | null> = {}
      const initFeedback: Record<string, string> = {}
      r.forEach(resp => {
        init[resp.id] = resp.override_score
        initFeedback[resp.id] = resp.recruiter_feedback ?? ''
      })
      setOverrides(init)
      setRecruiterFeedbacks(initFeedback)
    } catch (err: any) {
      setGradeError(err.message ?? 'Grading failed')
    } finally {
      setGrading(false)
    }
  }

  const pctColor = currentPct > 70 ? 'var(--color-success)' : currentPct > 40 ? 'var(--color-warning)' : 'var(--color-danger)'
  const barClass = currentPct > 70 ? 'high' : currentPct > 40 ? 'medium' : 'low'
  const assessmentMode = String(assessment.assessment_mode ?? '').toLowerCase()
  const isVoiceAssessment = assessmentMode === 'voice' || assessmentMode === 'communication'

  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
        <div className="back-link" style={{ marginBottom: 0 }} onClick={() => navigate(backToAssignments)}>
          <ArrowLeft size={16} /> Back to Assignments
        </div>
        {assessment.status === 'submitted' && (
          <div className="flex items-center gap-2">
            {gradeError && <span className="text-sm text-danger">{gradeError}</span>}
            {gradeSuccess && <span className="text-sm" style={{ color: 'var(--color-success)' }}>Graded!</span>}
            <button className="btn btn-secondary" onClick={handleGradeNow} disabled={grading}>
              <Zap size={14} /> {grading ? 'Grading…' : 'Grade Now'}
            </button>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="mb-4" style={{ display: 'grid', gap: 24, marginTop: 16 }}>
        <div className="card">
            <div className="flex items-center gap-4 mb-4">
              <div className="application-avatar" style={{ width: 56, height: 56, fontSize: 20 }}>
                {assessment.expert?.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div>
                <h2 style={{ marginBottom: 2 }}>{assessment.expert?.full_name}</h2>
                <div className="text-sm text-muted">{assessment.expert?.email}</div>
                <div className="text-sm text-muted">
                  {(assessment as any)._domain_name ?? assessment.domain_id} · {assessment.difficulty_tier} · {assessment.expert?.years_experience} yrs experience
                  {assessment.assessment_mode ? ` · ${assessment.assessment_mode}` : ''}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              {/* <div className="detail-score-display" style={{ padding: 16 }}>
                <div className="score-number" style={{ color: pctColor }}>{currentPct}%</div>
                <div className="score-label">{currentTotal} / 60</div>
              </div> */}
              {/* <div style={{ flex: 1 }}>
                <div className="score-bar mb-2">
                  <div className={`score-bar-fill ${barClass}`} style={{ width: `${currentPct}%` }} />
                </div>
                <div className="flex justify-between">
                  {assessment.ai_recommendation && (
                    <span className={`badge ${assessment.ai_recommendation}`}>
                      AI: {assessment.ai_recommendation.toUpperCase()}
                    </span>
                  )}
                  {assessment.flag_count > 0 && (
                    <span className="flag-badge">
                      <Flag size={14} /> {assessment.flag_count} flagged
                    </span>
                  )}
                </div>
              </div> */}
            </div>
          

            {isVoiceAssessment ? (
              <VoiceAssessmentReport
                assessment={assessment}
                gradingReports={gradingReports}
              />
            ) : (
              gradingRecord && (
                <ScoreOverviewCard
                  gradingRecord={gradingRecord}
                  assessment={assessment}
                  responses={responses}
                  responseCount={responses.length}
                />
              )
            )}
        </div>

        {/* Recruiter Decision Accordion */}
        <div className="card">
          <button
            type="button"
            onClick={() => setDecisionOpen(prev => !prev)}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textAlign: 'left',
            }}
          >
            <div>
              <h3 className="mb-1">Recruiter Decision</h3>
              {decision && (
                <span className={`badge ${decision}`} style={{ fontSize: 12, padding: '4px 10px' }}>
                  {decision === 'approved' ? 'Pass' : decision === 'rejected' ? 'Fail' : 'More Info Requested'}
                </span>
              )}
            </div>
            {decisionOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {decisionOpen && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
              {decision ? (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`badge ${decision}`} style={{ fontSize: 14, padding: '6px 14px' }}>
                      {decision === 'approved' ? '✓ Pass' : decision === 'rejected' ? '✗ Fail' : '⏳ More Info Requested'}
                    </span>
                  </div>

                  {assessment.decided_at && (
                    <div className="text-xs text-muted mb-2">
                      Reviewed: {new Date(assessment.decided_at).toLocaleString()}
                    </div>
                  )}

                  {notes && (
                    <div className="mt-2 mb-3">
                      <div className="text-sm font-semibold mb-1">Recruiter Notes</div>
                      <p className="text-sm text-muted">{notes}</p>
                    </div>
                  )}

                  {/* Change decision */}
                  <div style={{
                    borderTop: '1px solid var(--color-border)',
                    paddingTop: '12px',
                    marginTop: '8px',
                  }}>
                    <div className="text-xs text-muted mb-2">Change Decision</div>
                    <div className="flex gap-2 mb-3">
                      <button className="btn btn-success" onClick={() => confirmDecision('approved')} style={{ opacity: decision === 'approved' ? 0.5 : 1 }}>
                        <CheckCircle size={14} /> Pass
                      </button>
                      <button className="btn btn-danger" onClick={() => confirmDecision('rejected')} style={{ opacity: decision === 'rejected' ? 0.5 : 1 }}>
                        <XCircle size={14} /> Fail
                      </button>
                      <button className="btn btn-warning" onClick={() => confirmDecision('more_info')} style={{ opacity: decision === 'more_info' ? 0.5 : 1 }}>
                        <HelpCircle size={14} /> More Info
                      </button>
                    </div>
                    <div className="form-group">
                      <label>Update Notes</label>
                      <textarea
                        className="form-textarea"
                        rows={3}
                        placeholder="Update notes..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                      />
                    </div>
                  </div>
              </div>

              ) : (
                <>
                  <div className="mb-4" style={{
                    background: 'rgba(99, 102, 241, 0.05)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: '6px',
                    padding: '12px',
                  }}>
                    <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      <strong>Next Steps:</strong>
                      <ol style={{ margin: '8px 0 0 20px', paddingLeft: 0 }}>
                        <li>Review each question below</li>
                        <li>Edit scores if needed (override the AI score)</li>
                        <li>Add recruiter feedback for each response</li>
                        <li>Set Pass or Fail below</li>
                      </ol>
                    </div>
                  </div>
                  <div className="flex gap-2 mb-4">
                    <button className="btn btn-success" onClick={() => confirmDecision('approved')}>
                      <CheckCircle size={16} /> Pass
                    </button>
                    <button className="btn btn-danger" onClick={() => confirmDecision('rejected')}>
                      <XCircle size={16} /> Fail
                    </button>
                    <button className="btn btn-warning" onClick={() => confirmDecision('more_info')}>
                      <HelpCircle size={16} /> More Info
                    </button>
                  </div>

                  <div className="form-group">
                    <label>Internal Notes</label>
                    <textarea
                      className="form-textarea"
                      rows={4}
                      placeholder="Add notes about this assessment..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Per-question breakdown */}
      {!isVoiceAssessment && (
        <>
          <div className="flex justify-between items-center mb-3">
            <h3>Question-by-Question Breakdown</h3>
            <div className="flex items-center gap-2">
              {saveScoresOk && <span className="text-sm" style={{ color: 'var(--color-success)' }}>Scores saved!</span>}
              {saveScoresError && <span className="text-sm text-danger">{saveScoresError}</span>}
              {decision && !editingScores && (
                <button className="btn btn-secondary" onClick={() => setEditingScores(true)}>
                  <Edit2 size={14} /> Edit Scores
                </button>
              )}
              {editingScores && (
                <>
                  <button className="btn btn-secondary" onClick={() => setEditingScores(false)} disabled={savingScores}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleSaveScores} disabled={savingScores}>
                    <Save size={14} /> {savingScores ? 'Saving…' : 'Save Changes'}
                  </button>
                </>
              )}
            </div>
          </div>
          {responses.map((resp, idx) => (
            <ResponseCard
              key={resp.id}
              response={resp}
              index={idx}
              overrideScore={overrides[resp.id]}
              recruiterFeedback={recruiterFeedbacks[resp.id] ?? ''}
              onOverride={(val) => handleOverride(resp.id, val, resp.question?.max_score ?? 10)}
              onFeedbackChange={(val) => setRecruiterFeedbacks(prev => ({ ...prev, [resp.id]: val }))}
              isReviewed={!!decision && !editingScores}
            />
          ))}
        </>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowConfirm(false)} disabled={submitting}>
              <ArrowLeft size={14} /> Back
            </button>
            <h2>Confirm Decision</h2>
            <p>
              Are you sure you want to mark {assessment.expert?.full_name}'s assessment as <strong>
                {pendingDecision === 'approved' ? 'Pass' : pendingDecision === 'rejected' ? 'Fail' : 'More Info Requested'}
              </strong>?
            </p>
            <p className="text-xs text-muted" style={{ marginTop: 4 }}>
              This will update the candidate's assessment status.
            </p>
            {submitError && <p className="text-sm text-danger mb-3">{submitError}</p>}
            <div className="btn-group">
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)} disabled={submitting}>Cancel</button>
              <button
                className={`btn ${pendingDecision === 'approved' ? 'btn-success' : pendingDecision === 'rejected' ? 'btn-danger' : 'btn-warning'}`}
                onClick={executeDecision}
                disabled={submitting}
              >
                {submitting ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ScoreOverviewCard({
  gradingRecord,
  assessment,
  responses,
  responseCount,
}: {
  gradingRecord: GradingRecord
  assessment: Assessment
  responses: AssessmentResponse[]
  responseCount: number
}) {
  const [activeView, setActiveView] = useState<ScoreViewKey>('overall')

  const profileScoring = gradingRecord.meta?.profile_component_scoring_result
  const profileStrengths = Array.isArray(profileScoring?.strengths) ? profileScoring.strengths : []
  const profileGaps = Array.isArray(profileScoring?.gaps) ? profileScoring.gaps : []
  const overallScore = Number(gradingRecord.overall_score ?? 0)
  const profileScore = Number(gradingRecord.profile_component_score ?? 0)
  const assessmentScore = Number(gradingRecord.assessment_component_score ?? 0)
  const responseSubmittedAt = responses
    .map(item => item.submitted_at)
    .filter((value): value is string => Boolean(value))
    .sort()
  const submittedAt = assessment.submitted_at ?? (responseSubmittedAt.length > 0 ? responseSubmittedAt[responseSubmittedAt.length - 1] : null)
  const startedAt = assessment.started_at
  const computedTimeTakenMinutes = submittedAt && startedAt
    ? Math.round((new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 60000)
    : null
  const directusTimeTakenMinutes = typeof assessment.time_taken_minutes === 'number'
    ? assessment.time_taken_minutes
    : null
  const timeTakenMinutes = directusTimeTakenMinutes ?? computedTimeTakenMinutes

  const getView = (view: ScoreViewKey) => {
    if (view === 'profile') {
      return {
        title: 'Profile Grading',
        subtitle: 'Resume & evaluation',
        score: profileScore,
        maxScore: 40,
        accent: 'var(--color-primary)',
        description: profileScoring?.summary ?? 'Profile scoring is based on background, experience, and skill fit.',
      }
    }

    if (view === 'assessment') {
      return {
        title: 'Assessment Grading',
        subtitle: 'Test performance',
        score: assessmentScore,
        maxScore: 60,
        accent: 'var(--color-success)',
        description: `Assessment grading reflects performance across ${responseCount} response${responseCount === 1 ? '' : 's'}.`,
      }
    }

    return {
      title: 'Overall Score',
      subtitle: 'Combined score',
      score: overallScore,
      maxScore: 100,
      accent: 'var(--color-success)',
      description: 'Default combined view across profile grading and assessment performance.',
    }
  }

  const active = getView(activeView)
  const scorePct = active.maxScore > 0 ? Math.max(0, Math.min(100, Math.round((active.score / active.maxScore) * 100))) : 0

  return (
    <div className="card score-overview-card">
      <div className="score-overview-header">
        <div>
          <h3 style={{ marginBottom: 4 }}>Score Overview</h3>
          <div className="text-xs text-muted">Switch between overall, profile, and assessment scoring.</div>
        </div>

        <div className="score-view-tabs" role="tablist" aria-label="Score overview tabs">
          <button
            type="button"
            className={`score-view-tab score-view-tab--overall ${activeView === 'overall' ? 'active' : ''}`}
            onClick={() => setActiveView('overall')}
          >
            Overall
          </button>
          <button
            type="button"
            className={`score-view-tab score-view-tab--profile ${activeView === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveView('profile')}
          >
            Profile Grading
          </button>
          <button
            type="button"
            className={`score-view-tab score-view-tab--assessment ${activeView === 'assessment' ? 'active' : ''}`}
            onClick={() => setActiveView('assessment')}
          >
            Assessment Grading
          </button>
        </div>
      </div>

      <div className="score-overview-grid">
        <div className="score-overview-chart">
          <div
            className="score-donut"
            style={{
              background: `conic-gradient(${active.accent} ${scorePct}%, rgba(148, 163, 184, 0.2) 0%)`,
            }}
          >
            <div className="score-donut-inner">
              <div style={{ textAlign: 'center' }}>
                <div className="score-donut-value">{active.score}</div>
                <div className="score-donut-label">Score</div>
              </div>
            </div>
          </div>
          <div className="text-xs text-muted" style={{ textAlign: 'center' }}>{active.subtitle}</div>
          <div className="text-xs" style={{ color: active.accent, fontWeight: 700, textAlign: 'center' }}>
            {scorePct}% of {active.maxScore}
          </div>
        </div>

        <div className="score-view-panel">
          <div className="score-summary-row">
            <div>
              <div className="text-sm" style={{ fontWeight: 700 }}>{active.title}</div>
              <div className="text-xs text-muted">{active.description}</div>
            </div>
            <div style={{ fontWeight: 700, color: active.accent }}>{active.score} / {active.maxScore}</div>
          </div>

          {activeView === 'overall' && (
            <div className="score-view-body">
              <div className="score-summary-row">
                <div>
                  <div className="text-sm" style={{ fontWeight: 600 }}>Profile Grading</div>
                  <div className="text-xs text-muted">Resume & evaluation</div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{profileScore} / 40</div>
              </div>
              <div style={{ height: 1, background: 'var(--color-border)' }} />
              <div className="score-summary-row">
                <div>
                  <div className="text-sm" style={{ fontWeight: 600 }}>Assessment Grading</div>
                  <div className="text-xs text-muted">Test performance</div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--color-success)' }}>{assessmentScore} / 60</div>
              </div>
              <div style={{ height: 1, background: 'var(--color-border)' }} />
              <div className="score-total-pill">
                <div>
                  <div className="text-xs" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Overall</div>
                  <div className="text-xs text-muted">Combined score</div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--color-success)' }}>{overallScore} / 100</div>
              </div>
            </div>
          )}

          {activeView === 'profile' && (
            <div className="score-view-body">
              {profileScoring ? (
                <>
                  <div className="score-breakdown-grid">
                    <div className="score-mini-card">
                      <div className="text-xs text-muted">Experience</div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{profileScoring.experience_score} / 25</div>
                    </div>
                    <div className="score-mini-card">
                      <div className="text-xs text-muted">Skills</div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{profileScoring.skills_score} / 15</div>
                    </div>
                    <div className="score-mini-card">
                      <div className="text-xs text-muted">Profile Total</div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{profileScoring.total_score} / 40</div>
                    </div>
                  </div>

                  {profileScoring.summary && (
                    <p className="text-sm" style={{ margin: 0 }}>{profileScoring.summary}</p>
                  )}

                  {(profileStrengths.length > 0 || profileGaps.length > 0) && (
                    <div className="two-col-equal">
                      <div>
                        <div className="text-sm" style={{ color: 'var(--color-success)', fontWeight: 600, marginBottom: 4 }}>Strengths</div>
                        {profileStrengths.length ? (
                          <ul className="strengths-list">
                            {profileStrengths.map((item, idx) => <li key={`profile-strength-${idx}`}>{item}</li>)}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted">-</p>
                        )}
                      </div>
                      <div>
                        <div className="text-sm" style={{ color: 'var(--color-danger)', fontWeight: 600, marginBottom: 4 }}>Gaps</div>
                        {profileGaps.length ? (
                          <ul className="gaps-list">
                            {profileGaps.map((item, idx) => <li key={`profile-gap-${idx}`}>{item}</li>)}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted">-</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted">
                    Confidence: {profileScoring.confidence || 'UNKNOWN'}
                    {profileScoring.graded_at ? ` · Graded ${new Date(profileScoring.graded_at).toLocaleString()}` : ''}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted">Profile scoring details are not available for this assessment.</p>
              )}
            </div>
          )}

          {activeView === 'assessment' && (
            <div className="score-view-body">
              {submittedAt && (
                <div className="text-xs text-muted">
                  Submitted: {new Date(submittedAt).toLocaleString()} ·
                  Time taken: {timeTakenMinutes !== null ? `${timeTakenMinutes} min` : '?'}
                </div>
              )}

              <div className="score-breakdown-grid">
                <div className="score-mini-card">
                  <div className="text-xs text-muted">Responses graded</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{responseCount}</div>
                </div>
                <div className="score-mini-card">
                  <div className="text-xs text-muted">Assessment score</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{assessmentScore} / 60</div>
                </div>
                {/* <div className="score-mini-card">
                  <div className="text-xs text-muted">Overall context</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{overallScore} / 100</div>
                </div> */}
              </div>

              {assessment.ai_summary && (
                <div>
                  <div className="text-sm" style={{ fontWeight: 700, marginBottom: 6 }}>AI Summary</div>
                  <p className="text-sm" style={{ margin: 0 }}>{assessment.ai_summary}</p>
                </div>
              )}

              <div className="two-col-equal">
                <div>
                  <h4 className="mb-2" style={{ color: 'var(--color-success)' }}>Strengths</h4>
                  {assessment.strengths && assessment.strengths.length > 0 ? (
                    <ul className="strengths-list">
                      {assessment.strengths.map((item, index) => <li key={`assessment-strength-${index}`}>{item}</li>)}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted">No strengths recorded.</p>
                  )}
                </div>
                <div>
                  <h4 className="mb-2" style={{ color: 'var(--color-danger)' }}>Gaps</h4>
                  {assessment.gaps && assessment.gaps.length > 0 ? (
                    <ul className="gaps-list">
                      {assessment.gaps.map((item, index) => <li key={`assessment-gap-${index}`}>{item}</li>)}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted">No gaps recorded.</p>
                  )}
                </div>
              </div>

              <p className="text-sm" style={{ margin: 0 }}>
                Assessment grading reflects the test component. Use this view when you want to inspect the candidate’s performance on the submitted responses.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function VoiceAssessmentReport({
  assessment,
  gradingReports,
}: {
  assessment: Assessment
  gradingReports: GradingReport[]
}) {
  const report = [...gradingReports].sort((a, b) => {
    const aDate = new Date(a.graded_at ?? a.date_created ?? 0).getTime()
    const bDate = new Date(b.graded_at ?? b.date_created ?? 0).getTime()
    return bDate - aDate
  })[0]

  const [expandedDimensions, setExpandedDimensions] = useState<Set<number>>(new Set())

  const toggleDimension = (idx: number) => {
    setExpandedDimensions(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  if (!report) {
    return (
      <div className="card voice-report">
        <div className="voice-report-empty">
          <div className="voice-report-empty-icon"><Mic size={18} /></div>
          <div>
            <div className="voice-report-empty-title">Voice report not available yet</div>
            <div className="text-xs text-muted">The assessment report will appear after grading completes.</div>
          </div>
        </div>
      </div>
    )
  }

  const recommendationRaw = String(report.hiring_recommendation ?? assessment.ai_recommendation ?? 'review').toLowerCase()
  const isRecommendPass = recommendationRaw === 'pass' || recommendationRaw === 'strong_pass'
  const isRecommendFail = recommendationRaw === 'fail' || recommendationRaw === 'strong_fail'
  const recommendationLabel = isRecommendPass ? 'Pass' : isRecommendFail ? 'Fail' : 'Needs Review'
  const recommendationTone = isRecommendPass ? 'success' : isRecommendFail ? 'danger' : 'warning'

  const overallScoreValue = report.overall_score !== null && report.overall_score !== undefined
    ? Number(report.overall_score)
    : (assessment as any).percentage_score ?? (assessment as any).percentage ?? 0
  const overallScore = Number.isFinite(overallScoreValue) ? overallScoreValue : 0
  const scorePct = Math.max(0, Math.min(100, Math.round(overallScore)))
  const strengthList = report.strengths ?? []
  const improvementList = report.areas_for_improvement ?? []
  const dimensionScores = report.dimension_scores ?? []

  const formatLabel = (value: string) =>
    value
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())

  return (
    <div className="card voice-report">
      <div className="voice-report-hero">
        <div className="voice-report-title">
          <div className="voice-report-kicker">
            <span className="voice-report-kicker-icon"><Mic size={14} /></span>
            Voice assessment
          </div>
          <h3>Voice and Communication Report</h3>
          <p className="voice-report-summary">
            {report.summary ?? 'Summary not available for this assessment.'}
          </p>
        </div>
        <div className="voice-score-tile">
          <div className="voice-score-ring" style={{
            background: `conic-gradient(var(--voice-accent) ${scorePct}%, rgba(15, 23, 42, 0.15) 0%)`,
          }}>
            <div className="voice-score-ring-inner">
              <div className="voice-score-value">{overallScore}</div>
              <div className="voice-score-label">Overall score</div>
            </div>
          </div>
          <div className={`voice-pill voice-pill--${recommendationTone}`}>{recommendationLabel}</div>
        </div>
      </div>

      <div className="voice-report-meta">
        <div className="voice-meta-card">
          <div className="voice-meta-label">Assessment type</div>
          <div className="voice-meta-value">{report.assessment_type ?? assessment.assessment_mode ?? 'n/a'}</div>
        </div>
        <div className="voice-meta-card">
          <div className="voice-meta-label">Model</div>
          <div className="voice-meta-value">{report.grading_model ?? 'n/a'}</div>
        </div>
        <div className="voice-meta-card">
          <div className="voice-meta-label">Session</div>
          <div className="voice-meta-value">{report.session_id ?? 'n/a'}</div>
        </div>
        <div className="voice-meta-card">
          <div className="voice-meta-label">Graded</div>
          <div className="voice-meta-value">
            {report.graded_at ? new Date(report.graded_at).toLocaleString() : 'n/a'}
          </div>
        </div>
      </div>

      <div className="voice-report-grid">
        <div className="voice-panel voice-panel--strengths">
          <div className="voice-panel-title">Strengths</div>
          {strengthList.length > 0 ? (
            <ul className="voice-panel-list">
              {strengthList.map((item, idx) => (
                <li key={`voice-strength-${idx}`}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No strengths recorded.</p>
          )}
        </div>
        <div className="voice-panel voice-panel--improve">
          <div className="voice-panel-title">Areas for improvement</div>
          {improvementList.length > 0 ? (
            <ul className="voice-panel-list">
              {improvementList.map((item, idx) => (
                <li key={`voice-improve-${idx}`}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No improvement areas recorded.</p>
          )}
        </div>
      </div>

      <div className="voice-dimension-header">
        <div className="voice-dimension-title">
          <BarChart3 size={16} /> Dimension scores
        </div>
        <div className="text-xs text-muted">Click a card to view evidence &amp; reasoning.</div>
      </div>

      {dimensionScores.length > 0 ? (
        <div className="voice-dimension-grid">
          {dimensionScores.map((dimension, idx) => {
            const score = Number(dimension.score ?? 0)
            const weightPct = Math.round((dimension.weight ?? 0) * 100)
            const barPct = Math.max(0, Math.min(100, Math.round(score)))
            return (
              <div className="voice-dimension-card" key={`voice-dimension-${idx}`}>
                <div
                  className="voice-dimension-top"
                  style={{ cursor: (dimension.evidence || dimension.reasoning) ? 'pointer' : 'default' }}
                  onClick={() => { if (dimension.evidence || dimension.reasoning) toggleDimension(idx) }}
                >
                  <div className="voice-dimension-name">{formatLabel(dimension.name || 'Dimension')}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="voice-dimension-score">{score}</div>
                    {(dimension.evidence || dimension.reasoning) && (
                      expandedDimensions.has(idx)
                        ? <ChevronUp size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                        : <ChevronDown size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                    )}
                  </div>
                </div>
                <div className="voice-dimension-bar">
                  <span style={{ width: `${barPct}%` }} />
                </div>
                <div className="voice-dimension-meta">
                  <span>Weight {weightPct}%</span>
                  <span>{barPct}% score</span>
                </div>
                {expandedDimensions.has(idx) && dimension.evidence && (
                  <div className="voice-dimension-block">
                    <div className="voice-dimension-label">Evidence</div>
                    <p>{dimension.evidence}</p>
                  </div>
                )}
                {expandedDimensions.has(idx) && dimension.reasoning && (
                  <div className="voice-dimension-block">
                    <div className="voice-dimension-label">Reasoning</div>
                    <p>{dimension.reasoning}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="voice-dimension-empty">Dimension scores are not available for this report.</div>
      )}
    </div>
  )
}

function ResponseCard({
  response,
  index,
  overrideScore,
  recruiterFeedback,
  onOverride,
  onFeedbackChange,
  isReviewed,
}: {
  response: AssessmentResponse
  index: number
  overrideScore: number | null
  recruiterFeedback: string
  onOverride: (val: string) => void
  onFeedbackChange: (val: string) => void
  isReviewed: boolean
}) {
  const question = response.question
  const maxScore = question?.max_score ?? 10
  const displayScore = overrideScore ?? response.ai_score ?? 0
  const isOverridden = overrideScore !== null && overrideScore !== response.ai_score
  const [showReasoning, setShowReasoning] = useState(false)
  const [showFeedbackInput, setShowFeedbackInput] = useState(!!recruiterFeedback)

  return (
    <div className={`question-response-card ${response.is_flagged ? 'flagged' : ''}`}>
      {/* Editable/Reviewed Status */}
      <div style={{
        background: isReviewed ? 'rgba(107, 114, 128, 0.1)' : 'rgba(16, 185, 129, 0.1)',
        border: isReviewed ? '1px solid rgba(107, 114, 128, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: '4px',
        padding: '8px 12px',
        marginBottom: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div className="text-xs" style={{ color: isReviewed ? 'var(--color-text-secondary)' : 'var(--color-success)', fontWeight: 600 }}>
          {isReviewed ? '🔒 Locked (Decision made)' : '✏️ Editable'}
        </div>
        {!isReviewed && (
          <div className="text-xs" style={{ color: 'var(--color-success)' }}>
            Edit score & add feedback below
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-3">
        <div>
          <span className="text-sm font-semibold">Question {index + 1}</span>
          {question && (
            <span className="text-sm text-muted"> · {question.question_type.replace(/_/g, ' ')} · {question.difficulty_tier}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {response.is_flagged && (
            <span className="flag-badge">
              <AlertTriangle size={14} /> {response.flag_reason}
            </span>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Score:</span>
            <input
              type="number"
              className="score-override-input"
              value={overrideScore ?? response.ai_score ?? ''}
              onChange={e => onOverride(e.target.value)}
              min={0}
              max={maxScore}
              disabled={isReviewed}
              style={{
                width: '60px',
                padding: '6px 8px',
                border: isReviewed ? '1px solid var(--color-border)' : '2px solid var(--color-primary)',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 600,
                background: isReviewed ? 'var(--color-bg-muted)' : 'var(--color-bg)',
                cursor: isReviewed ? 'not-allowed' : 'text',
              }}
            />
            <span className="text-sm text-muted">/ {maxScore}</span>
            {isOverridden && (
              <span className="badge" style={{ fontSize: 10, background: 'rgba(99, 102, 241, 0.2)', color: 'var(--color-primary)', padding: '2px 6px' }}>
                Modified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Question text */}
      {question && (
        <div className="mb-3">
          <div className="text-xs font-semibold text-muted mb-1">QUESTION</div>
          <div className="rich-text-content text-sm" dangerouslySetInnerHTML={{ __html: question.prompt }} />
        </div>
      )}

      {/* Expert response */}
      <div className="mb-3">
        <div className="text-xs font-semibold text-muted mb-1">EXPERT'S RESPONSE</div>
        <div className="context-block" style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>
          {response.response_text}
        </div>
      </div>

      {/* AI Score & Feedback Section */}
      {response.ai_score !== null && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05))',
          border: '1px solid rgba(99, 102, 241, 0.15)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '12px',
        }}>
          <div className="flex items-center gap-2 mb-2">
            <Brain size={16} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-primary)' }}>AI Evaluation</span>
            <span style={{
              marginLeft: 'auto',
              background: response.ai_score >= 75 ? 'rgba(16, 185, 129, 0.15)' : response.ai_score >= 40 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: response.ai_score >= 75 ? 'var(--color-success)' : response.ai_score >= 40 ? 'var(--color-warning)' : 'var(--color-danger)',
              padding: '3px 10px',
              borderRadius: '99px',
              fontSize: 12,
              fontWeight: 700,
            }}>
              Score: {response.ai_score}/{maxScore}
            </span>
          </div>

          {/* AI Feedback */}
          {response.ai_feedback && (
            <div className="mb-2">
              <div className="text-xs font-semibold text-muted mb-1">FEEDBACK</div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)', margin: 0 }}>{response.ai_feedback}</p>
            </div>
          )}

          {/* AI Reasoning - Expandable */}
          {response.ai_reasoning && (
            <div>
              <button
                onClick={() => setShowReasoning(!showReasoning)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  padding: '4px 0',
                }}
              >
                {showReasoning ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showReasoning ? 'Hide Reasoning' : 'Show AI Reasoning'}
              </button>
              {showReasoning && (
                <div style={{
                  marginTop: 8,
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.5)',
                  borderRadius: '6px',
                  border: '1px solid rgba(99, 102, 241, 0.1)',
                }}>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                    {response.ai_reasoning}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recruiter Feedback Section */}
      {!isReviewed && (
        <div style={{ marginTop: 8 }}>
          {!showFeedbackInput ? (
            <button
              onClick={() => setShowFeedbackInput(true)}
              style={{
                background: 'none',
                border: '1px dashed var(--color-border)',
                borderRadius: '6px',
                padding: '8px 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                width: '100%',
                justifyContent: 'center',
              }}
            >
              <MessageSquare size={13} /> Add Recruiter Feedback
            </button>
          ) : (
            <div>
              <div className="text-xs font-semibold text-muted mb-1">RECRUITER FEEDBACK</div>
              <textarea
                value={recruiterFeedback}
                onChange={e => onFeedbackChange(e.target.value)}
                placeholder="Add your feedback for this response..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Show saved recruiter feedback in reviewed state */}
      {isReviewed && recruiterFeedback && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          borderRadius: '6px',
          padding: '12px',
          marginTop: 8,
        }}>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare size={14} style={{ color: 'var(--color-success)' }} />
            <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--color-success)' }}>Recruiter Feedback</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)', margin: 0 }}>{recruiterFeedback}</p>
        </div>
      )}
    </div>
  )
}
