import type { CSSProperties } from 'react'

type EvaluationResult = {
  score?: number | string | null
  strengths?: unknown
  weaknesses?: unknown
  recommendation?: string | null
}

type GradingRecord = {
  status?: string | null
  evaluation_result?: EvaluationResult | string | null
  [key: string]: any
}

type GradingSectionProps = {
  grading: GradingRecord | null | undefined
  loading?: boolean
}

function normalizeList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (item == null ? '' : String(item).trim()))
      .filter(Boolean)
  }

  if (typeof value === 'string') {
    const raw = value.trim()
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (item == null ? '' : String(item).trim()))
          .filter(Boolean)
      }
    } catch {
      // Ignore parse errors and fallback to single string item.
    }
    return [raw]
  }

  return []
}

function parseEvaluationResult(value: unknown): EvaluationResult | null {
  if (!value) return null

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (parsed && typeof parsed === 'object') return parsed as EvaluationResult
      return null
    } catch {
      return null
    }
  }

  if (typeof value === 'object') {
    return value as EvaluationResult
  }

  return null
}

function getStatusMeta(status: string) {
  const normalized = status.trim().toLowerCase()
  if (normalized === 'evaluated') {
    return {
      label: 'Evaluated',
      color: 'var(--color-success)',
      background: 'rgba(16, 185, 129, 0.12)',
    }
  }

  return {
    label: status || 'Pending',
    color: 'var(--color-text-muted)',
    background: 'rgba(148, 163, 184, 0.15)',
  }
}

const skeletonLine: CSSProperties = {
  height: '12px',
  borderRadius: '6px',
  background: 'linear-gradient(90deg, rgba(148,163,184,0.18) 25%, rgba(148,163,184,0.28) 37%, rgba(148,163,184,0.18) 63%)',
  backgroundSize: '400% 100%',
  animation: 'gradingShimmer 1.4s ease infinite',
}

const MOCK_EVALUATION: EvaluationResult = {
  score: 85,
  strengths: [
    'Strong domain understanding and relevant project exposure',
    'Clear communication with concise technical explanations',
    'Good consistency in profile and skills alignment',
  ],
  weaknesses: [
    'Limited depth in edge-case handling examples',
    'Recommendation quality can improve with more measurable outcomes',
  ],
  recommendation: 'Proceed to next review stage with focused technical interview on advanced scenario depth.',
}

export default function GradingSection({ grading, loading = false }: GradingSectionProps) {
  const evaluation = parseEvaluationResult(grading?.evaluation_result)
  const usingMock = !evaluation
  const resolvedEvaluation = evaluation || MOCK_EVALUATION
  const strengths = normalizeList(resolvedEvaluation?.strengths)
  const weaknesses = normalizeList(resolvedEvaluation?.weaknesses)
  const recommendation = resolvedEvaluation?.recommendation ? String(resolvedEvaluation.recommendation).trim() : ''
  const score = resolvedEvaluation?.score
  const resolvedStatus = usingMock ? 'evaluated' : String(grading?.status || 'pending')
  const statusMeta = getStatusMeta(resolvedStatus)

  return (
    <div style={{ marginBottom: '24px' }}>
      <style>
        {`@keyframes gradingShimmer { 0% { background-position: 100% 0; } 100% { background-position: 0 0; } }`}
      </style>

      <h3
        style={{
          marginBottom: '14px',
          color: 'var(--color-text-muted)',
          fontSize: '11px',
          textTransform: 'uppercase',
          fontWeight: 700,
          letterSpacing: '0.08em',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '8px',
        }}
      >
        LLM Evaluation
      </h3>

      {loading ? (
        <div style={{ background: 'var(--color-surface)', borderRadius: '8px', padding: '14px' }}>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div style={{ ...skeletonLine, width: '36%' }} />
            <div style={{ ...skeletonLine, width: '92%' }} />
            <div style={{ ...skeletonLine, width: '78%' }} />
            <div style={{ ...skeletonLine, width: '85%' }} />
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--color-surface)', borderRadius: '8px', padding: '14px' }}>
          <div style={{ display: 'grid', gap: '14px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 12px' }}>
              {usingMock && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: 'var(--color-warning-dark)',
                    background: 'var(--color-warning-light)',
                  }}
                >
                  Mock Data
                </span>
              )}

              <span style={{ fontSize: '13px', fontWeight: 700 }}>Score:</span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: 'var(--color-success)',
                  borderRadius: '999px',
                  padding: '4px 10px',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                {score == null || score === '' ? '-' : String(score)} / 100
              </span>

              <span style={{ marginLeft: '4px', fontSize: '13px', fontWeight: 700 }}>Status:</span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: statusMeta.color,
                  background: statusMeta.background,
                }}
              >
                {statusMeta.label}
              </span>
            </div>

            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Strengths</div>
              {strengths.length ? (
                <ul style={{ margin: 0, paddingLeft: '18px', display: 'grid', gap: '4px' }}>
                  {strengths.map((item, idx) => (
                    <li key={`strength-${idx}`} style={{ fontSize: '14px' }}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-muted)' }}>-</p>
              )}
            </div>

            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Weaknesses</div>
              {weaknesses.length ? (
                <ul style={{ margin: 0, paddingLeft: '18px', display: 'grid', gap: '4px' }}>
                  {weaknesses.map((item, idx) => (
                    <li key={`weakness-${idx}`} style={{ fontSize: '14px' }}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-muted)' }}>-</p>
              )}
            </div>

            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Recommendation</div>
              <p style={{ margin: 0, fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                {recommendation || '-'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
