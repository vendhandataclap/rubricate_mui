import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, Loader2 } from 'lucide-react'
import { adminApi } from '../../services/api'
import type { Question } from '../../types'

export default function TestSandbox() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [question,    setQuestion]    = useState<Question | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [fetchError,  setFetchError]  = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    adminApi.getQuestion(id)
      .then(setQuestion)
      .catch(err => setFetchError(err.message ?? 'Failed to load question'))
      .finally(() => setLoading(false))
  }, [id])

  const [sampleAnswer, setSampleAnswer] = useState('')
  const [isGrading, setIsGrading] = useState(false)
  const [result, setResult] = useState<{
    score: number
    feedback: string
    reasoning: string
    flagged: boolean
    flagReason?: string
  } | null>(null)

  if (loading) return <div className="empty-state"><p>Loading question…</p></div>

  if (fetchError || !question) {
    return (
      <div className="empty-state">
        <h3>Question not found</h3>
        {fetchError && <p className="text-muted mt-1">{fetchError}</p>}
        <button className="btn btn-secondary mt-3" onClick={() => navigate('/admin/questions')}>Back to Questions</button>
      </div>
    )
  }

  if (question.status !== 'active') {
    return (
      <div className="empty-state">
        <h3>Test grading is only available for active questions</h3>
        <p className="text-muted mt-2">Activate this question first to use the test sandbox.</p>
        <button className="btn btn-secondary mt-3" onClick={() => navigate(`/admin/questions/${id}/edit`)}>Back to Edit</button>
      </div>
    )
  }

  const runTestGrade = () => {
    if (!sampleAnswer.trim()) return
    setIsGrading(true)
    setResult(null)

    // Simulate AI grading with mock response
    setTimeout(() => {
      const score = Math.min(question.max_score, Math.max(0, Math.round(Math.random() * question.max_score)))
      const pct = score / question.max_score

      setResult({
        score,
        feedback: pct > 0.7
          ? 'Strong response demonstrating solid understanding of the key concepts. The answer addresses the main criteria in the rubric with specific examples and clear reasoning.'
          : pct > 0.4
          ? 'Adequate response covering the basic concepts but lacking depth in some areas. Further elaboration on specific techniques and practical examples would improve the score.'
          : 'Response shows limited understanding of the topic. Key concepts from the rubric were not adequately addressed. Significant gaps in technical knowledge demonstrated.',
        reasoning: `Evaluated against rubric criteria. ${pct > 0.5 ? 'Most criteria were met with varying degrees of completeness.' : 'Several criteria were not sufficiently addressed.'} Response length: ${sampleAnswer.length} characters.`,
        flagged: pct < 0.3,
        flagReason: pct < 0.3 ? 'Score below minimum threshold — may indicate misunderstood question or low-effort response' : undefined,
      })
      setIsGrading(false)
    }, 2000)
  }

  return (
    <div>
      <div className="detail-header">
        <div>
          <div className="back-link" onClick={() => navigate(`/admin/questions/${id}/edit`)}>
            <ArrowLeft size={16} /> Back to Edit
          </div>
          <h1>Test Grading Sandbox</h1>
          <p>{(question as any)._domain_name ?? question.domain_id}{question.subdomain_id ? ` · ${(question as any)._subdomain_name ?? question.subdomain_id}` : ''}</p>
        </div>
      </div>

      <div className="two-col-layout">
        <div>
          <div className="card mb-4">
            <h3 className="mb-3">Question</h3>
            <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: question.prompt }} />

            {question.context_a && (
              <div className="mt-3">
                <div className="context-label">{question.question_type === 'comparison' ? 'Option A' : 'Context'}</div>
                <div className="context-block">{question.context_a}</div>
              </div>
            )}
            {question.context_b && (
              <div className="mt-3">
                <div className="context-label">Option B</div>
                <div className="context-block">{question.context_b}</div>
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="mb-3">Sample Answer</h3>
            <textarea
              className="form-textarea"
              rows={10}
              placeholder="Paste a sample answer to test the grading rubric..."
              value={sampleAnswer}
              onChange={e => setSampleAnswer(e.target.value)}
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-sm text-muted">{sampleAnswer.length} characters</span>
              <button
                className="btn btn-primary"
                onClick={runTestGrade}
                disabled={isGrading || !sampleAnswer.trim()}
              >
                {isGrading ? <><Loader2 size={16} className="spinner" /> Grading...</> : <><Play size={16} /> Run Test Grade</>}
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="card mb-4">
            <h3 className="mb-3">Grading Rubric</h3>
            <div className="context-block" style={{ whiteSpace: 'pre-wrap' }}>{question.grading_rubric}</div>
            <div className="mt-2 text-sm text-muted">Max Score: {question.max_score}</div>
          </div>

          {result && (
            <div className="sandbox-result">
              <h3 className="mb-3">Grading Result</h3>

              <div className="detail-score-display mb-3">
                <div className="score-number" style={{ color: result.score / question.max_score > 0.7 ? 'var(--color-success)' : result.score / question.max_score > 0.4 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                  {result.score}/{question.max_score}
                </div>
                <div className="score-label">{Math.round((result.score / question.max_score) * 100)}%</div>
              </div>

              <div className="score-bar mb-3">
                <div
                  className={`score-bar-fill ${result.score / question.max_score > 0.7 ? 'high' : result.score / question.max_score > 0.4 ? 'medium' : 'low'}`}
                  style={{ width: `${(result.score / question.max_score) * 100}%` }}
                />
              </div>

              {result.flagged && (
                <div className="flag-badge mb-3">⚠ Flagged: {result.flagReason}</div>
              )}

              <div className="mb-3">
                <div className="text-sm font-semibold mb-2">Feedback</div>
                <p className="text-sm">{result.feedback}</p>
              </div>

              <div>
                <div className="text-sm font-semibold mb-2">Internal Reasoning</div>
                <p className="text-sm text-muted">{result.reasoning}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
