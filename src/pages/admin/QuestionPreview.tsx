import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { adminApi } from '../../services/api'
import type { Question } from '../../types'

export default function QuestionPreview() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [question,   setQuestion]   = useState<Question | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    adminApi.getQuestion(id)
      .then(setQuestion)
      .catch(err => setFetchError(err.message ?? 'Failed to load question'))
      .finally(() => setLoading(false))
  }, [id])

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

  const showContext = question.question_type === 'comparison' || question.question_type === 'error_identification'
  const showContextB = question.question_type === 'comparison'

  return (
    <div>
      <div className="detail-header">
        <div>
          <div className="back-link" onClick={() => navigate(`/admin/questions/${id}/edit`)}>
            <ArrowLeft size={16} /> Back to Edit
          </div>
          <h1>Question Preview</h1>
          <p>{(question as any)._domain_name ?? question.domain_id}{question.subdomain_id ? ` · ${(question as any)._subdomain_name ?? question.subdomain_id}` : ''}</p>
        </div>
      </div>

      <div className="preview-banner">Preview Mode — This is how experts will see this question</div>

      <div className="card" style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Question prompt */}
        <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: question.prompt }} />

        {/* Context blocks */}
        {showContext && question.context_a && (
          <div>
            <div className="context-label">{showContextB ? 'Option A' : 'Context'}</div>
            <div className="context-block">{question.context_a}</div>
          </div>
        )}

        {showContextB && question.context_b && (
          <div>
            <div className="context-label">Option B</div>
            <div className="context-block">{question.context_b}</div>
          </div>
        )}

        {/* Multiple choice options (read-only) */}
        {question.question_type === 'multiple_choice' && question.choices && (
          <div className="mt-4">
            {question.choices.map((c, i) => (
              <label key={c.id} className="flex items-center gap-2 mb-2" style={{ padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'default' }}>
                <input type="radio" name="preview_choice" disabled />
                <span>{c.text}</span>
              </label>
            ))}
          </div>
        )}

        {/* Ranking items (read-only) */}
        {question.question_type === 'ranking' && question.ranking_items && (
          <div className="mt-4">
            {question.ranking_items.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3 mb-2" style={{ padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
                <span className="text-muted font-semibold">{i + 1}</span>
                <span>{r.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Response area (read-only) */}
        <div className="mt-4">
          <textarea
            className="form-textarea"
            rows={6}
            placeholder="Expert would type their response here..."
            disabled
            style={{ background: 'var(--color-bg)', cursor: 'not-allowed' }}
          />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-muted">Minimum {question.min_response_length} characters</span>
            <span className="text-xs text-muted">0 / {question.min_response_length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
