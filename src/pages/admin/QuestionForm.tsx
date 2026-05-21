import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, Eye, FlaskConical, Plus, X, ArrowLeft } from 'lucide-react'
import { adminApi } from '../../services/api'
import type { QuestionType, DifficultyTier, Domain, Subdomain } from '../../types'

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'open_text', label: 'Open Text' },
  { value: 'comparison', label: 'Comparison' },
  { value: 'error_identification', label: 'Error ID' },
  { value: 'ranking', label: 'Ranking' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
]

const TIERS: DifficultyTier[] = ['no_experience', 'junior', 'mid', 'senior']

export default function QuestionForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [loadingQuestion, setLoadingQuestion] = useState(isEdit)
  const [saving,    setSaving]    = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [domains,    setDomains]    = useState<Domain[]>([])
  const [subdomains, setSubdomains] = useState<Subdomain[]>([])

  // Load domains + subdomains from API
  useEffect(() => {
    adminApi.getDomains()
      .then(({ domains: ds, subdomains: ss }) => { setDomains(ds); setSubdomains(ss) })
      .catch(() => {/* keep empty on error */})
  }, [])

  const [domainId,       setDomainId]       = useState('')
  const [subdomainId,    setSubdomainId]     = useState('')
  const [questionType,   setQuestionType]   = useState<QuestionType>('open_text')
  const [difficultyTier, setDifficultyTier] = useState<DifficultyTier>('mid')
  const [prompt,         setPrompt]         = useState('')
  const [contextA,       setContextA]       = useState('')
  const [contextB,       setContextB]       = useState('')
  const [rubric,         setRubric]         = useState('')
  const [maxScore,       setMaxScore]       = useState(10)
  const [timeLimit,      setTimeLimit]      = useState(15)
  const [minLength,      setMinLength]      = useState(200)
  const [tags,           setTags]           = useState<string[]>([])
  const [tagInput,       setTagInput]       = useState('')
  const [existingStatus, setExistingStatus] = useState<string>('draft')

  const [choices, setChoices] = useState([
    { id: '1', text: '', is_correct: false },
    { id: '2', text: '', is_correct: false },
  ])

  const [rankingItems, setRankingItems] = useState([
    { id: '1', text: '', correct_order: 1 },
    { id: '2', text: '', correct_order: 2 },
    { id: '3', text: '', correct_order: 3 },
  ])

  // Load existing question from API when editing
  useEffect(() => {
    if (!isEdit || !id) return
    adminApi.getQuestion(id)
      .then(q => {
        setDomainId(q.domain_id)
        setSubdomainId(q.subdomain_id ?? '')
        setQuestionType(q.question_type)
        setDifficultyTier(q.difficulty_tier)
        setPrompt(q.prompt)
        setContextA(q.context_a ?? '')
        setContextB(q.context_b ?? '')
        setRubric(q.grading_rubric)
        setMaxScore(q.max_score)
        setTimeLimit(q.time_limit_minutes)
        setMinLength(q.min_response_length)
        setTags(q.tags ?? [])
        setExistingStatus(q.status)
        if (q.choices?.length) setChoices(q.choices as any)
        if (q.ranking_items?.length) setRankingItems(q.ranking_items as any)
      })
      .catch(() => {/* keep defaults on error */})
      .finally(() => setLoadingQuestion(false))
  }, [id, isEdit])

  const filteredSubdomains = subdomains.filter(s => s.domain_id === domainId)

  useEffect(() => {
    if (!filteredSubdomains.find(s => s.id === subdomainId)) {
      setSubdomainId('')
    }
  }, [domainId])

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) {
      setTags([...tags, t])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag))

  const addChoice = () => {
    setChoices([...choices, { id: String(choices.length + 1), text: '', is_correct: false }])
  }

  const updateChoice = (idx: number, text: string) => {
    setChoices(choices.map((c, i) => i === idx ? { ...c, text } : c))
  }

  const setCorrectChoice = (idx: number) => {
    setChoices(choices.map((c, i) => ({ ...c, is_correct: i === idx })))
  }

  const addRankingItem = () => {
    setRankingItems([...rankingItems, { id: String(rankingItems.length + 1), text: '', correct_order: rankingItems.length + 1 }])
  }

  const updateRankingItem = (idx: number, text: string) => {
    setRankingItems(rankingItems.map((r, i) => i === idx ? { ...r, text } : r))
  }

  const handleSave = async (activate: boolean) => {
    setSaving(true)
    setSaveError(null)
    try {
      const payload = {
        prompt,
        grading_rubric: rubric,
        question_type:  questionType,
        difficulty_tier: difficultyTier,
        status:         activate ? 'active' as const : 'draft' as const,
        domain_id:      domainId,
        subdomain_id:   subdomainId || null,
        context_a:      contextA || undefined,
        context_b:      contextB || undefined,
        choices:        questionType === 'multiple_choice' ? choices : undefined,
        ranking_items:  questionType === 'ranking'         ? rankingItems : undefined,
        tags,
        max_score:      maxScore,
        time_limit_minutes: timeLimit,
        min_response_length: minLength,
      }
      if (isEdit && id) {
        await adminApi.updateQuestion(id, payload)
      } else {
        await adminApi.createQuestion(payload)
      }
      navigate('/admin/questions')
    } catch (err: any) {
      setSaveError(err.message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const showContext  = questionType === 'comparison' || questionType === 'error_identification'
  const showContextB = questionType === 'comparison'

  if (loadingQuestion) {
    return (
      <div className="empty-state">
        <p>Loading question…</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/questions')} style={{ marginBottom: 10 }}>
            <ArrowLeft size={14} /> Back
          </button>
          <h1>{isEdit ? 'Edit Question' : 'Create Question'}</h1>
          <p>{isEdit ? `Editing question ${id}` : 'Add a new question to the bank'}</p>
        </div>
        <div className="btn-group">
          {isEdit && existingStatus === 'active' && (
            <>
              <button className="btn btn-secondary" onClick={() => navigate(`/admin/questions/${id}/preview`)}>
                <Eye size={16} /> Preview
              </button>
              <button className="btn btn-secondary" onClick={() => navigate(`/admin/questions/${id}/test`)}>
                <FlaskConical size={16} /> Test Grade
              </button>
            </>
          )}
        </div>
      </div>

      <div className="two-col-layout">
        {/* Left column: Content */}
        <div>
          <div className="card">
            <h3 className="mb-4">Question Content</h3>

            <div className="form-row mb-3">
              <div className="form-group">
                <label>Domain</label>
                <select className="form-select" value={domainId} onChange={e => setDomainId(e.target.value)}>
                  <option value="">Select domain...</option>
                  {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Subdomain</label>
                <select className="form-select" value={subdomainId} onChange={e => setSubdomainId(e.target.value)} disabled={!domainId}>
                  <option value="">Select subdomain...</option>
                  {filteredSubdomains.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Question Type</label>
              <div className="segmented-control">
                {QUESTION_TYPES.map(t => (
                  <button
                    key={t.value}
                    className={`segment-option ${questionType === t.value ? 'selected' : ''}`}
                    onClick={() => setQuestionType(t.value)}
                    type="button"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Difficulty Tier</label>
              <div className="radio-group">
                {TIERS.map(t => (
                  <button
                    key={t}
                    className={`radio-option ${difficultyTier === t ? 'selected' : ''}`}
                    onClick={() => setDifficultyTier(t)}
                    type="button"
                  >
                    {t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Prompt</label>
              <textarea
                className="form-textarea"
                rows={6}
                placeholder="Enter the question prompt (supports HTML)..."
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
              />
            </div>

            {showContext && (
              <div className="form-group">
                <label>{showContextB ? 'Context A / Option A' : 'Context'}</label>
                <textarea
                  className="form-textarea"
                  rows={6}
                  placeholder="Enter context material..."
                  value={contextA}
                  onChange={e => setContextA(e.target.value)}
                />
              </div>
            )}

            {showContextB && (
              <div className="form-group">
                <label>Context B / Option B</label>
                <textarea
                  className="form-textarea"
                  rows={6}
                  placeholder="Enter second context material..."
                  value={contextB}
                  onChange={e => setContextB(e.target.value)}
                />
              </div>
            )}

            {questionType === 'multiple_choice' && (
              <div className="form-group">
                <label>Answer Choices</label>
                {choices.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-2 mb-2">
                    <input
                      type="radio"
                      name="correct"
                      checked={c.is_correct}
                      onChange={() => setCorrectChoice(i)}
                    />
                    <input
                      className="form-input"
                      placeholder={`Choice ${i + 1}`}
                      value={c.text}
                      onChange={e => updateChoice(i, e.target.value)}
                    />
                  </div>
                ))}
                <button className="btn btn-sm btn-ghost" onClick={addChoice} type="button">
                  <Plus size={14} /> Add Choice
                </button>
              </div>
            )}

            {questionType === 'ranking' && (
              <div className="form-group">
                <label>Items to Rank (in correct order)</label>
                {rankingItems.map((r, i) => (
                  <div key={r.id} className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-muted" style={{ width: 24 }}>{i + 1}.</span>
                    <input
                      className="form-input"
                      placeholder={`Item ${i + 1}`}
                      value={r.text}
                      onChange={e => updateRankingItem(i, e.target.value)}
                    />
                  </div>
                ))}
                {rankingItems.length < 5 && (
                  <button className="btn btn-sm btn-ghost" onClick={addRankingItem} type="button">
                    <Plus size={14} /> Add Item
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Configuration & Rubric */}
        <div>
          <div className="card mb-4">
            <h3 className="mb-4">Grading Rubric</h3>
            <div className="form-group">
              <label>Rubric</label>
              <textarea
                className="form-textarea"
                rows={8}
                placeholder="Define how this question should be graded. Include point allocation for each criterion..."
                value={rubric}
                onChange={e => setRubric(e.target.value)}
              />
              <p className="text-xs text-muted mt-2">
                Tip: Be specific about point allocation. Example: "Award 3 points for X. Award 4 points for Y. Award 3 points for Z."
              </p>
            </div>
          </div>

          <div className="card mb-4">
            <h3 className="mb-4">Configuration</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Max Score</label>
                <input type="number" className="form-input" value={maxScore} onChange={e => setMaxScore(Number(e.target.value))} min={1} max={100} />
              </div>
              <div className="form-group">
                <label>Time Limit (min)</label>
                <input type="number" className="form-input" value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} min={1} max={120} />
              </div>
            </div>
            <div className="form-group">
              <label>Min Response Length (chars)</label>
              <input type="number" className="form-input" value={minLength} onChange={e => setMinLength(Number(e.target.value))} min={0} max={2000} />
            </div>
          </div>

          <div className="card mb-4">
            <h3 className="mb-4">Tags</h3>
            <div className="form-group">
              <div className="flex gap-2">
                <input
                  className="form-input"
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <button className="btn btn-secondary btn-sm" onClick={addTag} type="button">Add</button>
              </div>
              <div className="tags-container mt-2">
                {tags.map(tag => (
                  <span key={tag} className="tag">
                    {tag}
                    <span className="tag-remove" onClick={() => removeTag(tag)}><X size={12} /></span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/admin/questions')}>Cancel</button>
            <button className="btn btn-secondary" onClick={() => handleSave(false)} disabled={saving || !prompt || !rubric || !domainId}>
              <Save size={16} /> {saving ? 'Saving…' : 'Save as Draft'}
            </button>
            <button className="btn btn-primary" onClick={() => handleSave(true)} disabled={saving || !prompt || !rubric || !domainId}>
              <Save size={16} /> {saving ? 'Saving…' : 'Save & Activate'}
            </button>
          </div>
          {saveError && (
            <p style={{ color: 'var(--color-danger)', fontSize: 13, marginTop: 8, textAlign: 'right' }}>
              {saveError}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
