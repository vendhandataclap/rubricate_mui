/**
 * PreInstruction.tsx — Pre-test instructions screen
 * 
 * Displays:
 * - Assignment overview
 * - Total question count
 * - Time expectations
 * - Rules (no refresh, auto-submit, etc.)
 * - "Start Assignment" button
 */
import { AlertTriangle, CheckCircle2, Clock, BookOpen, ChevronRight } from 'lucide-react'

interface PreInstructionProps {
  assessmentTitle: string
  questionCount: number
  difficulty: string
  domain: string
  totalTimeLimit?: number // in minutes
  isExpired: boolean
  expireDate: string
  onStart: () => void
  isLoading?: boolean
}

export default function PreInstruction({
  assessmentTitle,
  questionCount,
  difficulty,
  domain,
  totalTimeLimit,
  isExpired,
  expireDate,
  onStart,
  isLoading = false,
}: PreInstructionProps) {
  if (isExpired) {
    return (
      <div style={outerStyle}>
        <div style={{ ...cardStyle, maxWidth: 560 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-primary)', marginBottom: 4 }}>
              Rubricate
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Assessment Platform</div>
          </div>

          <div style={{
            background: 'var(--color-danger-light)', border: '1px solid var(--color-danger-light)',
            borderRadius: 'var(--radius-md)', padding: '24px 20px',
            textAlign: 'center',
          }}>
            <AlertTriangle size={48} style={{ color: 'var(--color-danger)', marginBottom: 16, display: 'block' }} />
            <h2 style={{ color: 'var(--color-danger)', marginBottom: 8 }}>Assessment Expired</h2>
            <p style={{ color: 'var(--color-danger)', fontSize: 14 }}>
              This assessment expired on {new Date(expireDate).toLocaleDateString()}. 
              Please contact your recruiter to request a new assessment.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const calcTotalTime = totalTimeLimit || questionCount * 15 // Default 15 min per question
  const hours = Math.floor(calcTotalTime / 60)
  const minutes = calcTotalTime % 60

  let timeStr = ''
  if (hours > 0) {
    timeStr = `${hours} hour${hours > 1 ? 's' : ''} ${minutes > 0 ? `${minutes} min` : ''}`
  } else {
    timeStr = `${minutes} min`
  }

  return (
    <div style={outerStyle}>
      <div style={{ ...cardStyle, maxWidth: 620 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-primary)', marginBottom: 4 }}>
            Rubricate
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Assessment Platform</div>
        </div>

        {/* Assessment Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'var(--color-primary-light)', color: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <BookOpen size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: 'var(--color-text)' }}>
              {domain} Assessment
            </h1>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 2 }}>
              {assessmentTitle}
            </p>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              Difficulty: <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{difficulty}</span>
            </p>
          </div>
        </div>

        {/* Assessment Details */}
        <div style={{
          background: 'var(--color-bg)', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)', padding: '20px 24px',
          marginBottom: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px',
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 6 }}>
              Total Questions
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>
              {questionCount}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 6 }}>
              Expected Time
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={16} /> {timeStr}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 6 }}>
              Question Types
            </div>
            <div style={{ fontSize: 14, color: 'var(--color-text)' }}>
              Multiple formats
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 6 }}>
              Expires
            </div>
            <div style={{ fontSize: 14, color: 'var(--color-text)' }}>
              {new Date(expireDate).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Rules Section */}
        <div style={{
          background: 'var(--color-bg)', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)', padding: '20px 24px',
          marginBottom: 32,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: 'var(--color-text)' }}>
            Important Rules
          </h3>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            <li style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0, color: 'var(--color-success)', marginTop: 2 }} />
              <span>
                <strong>No page refresh:</strong> Refreshing during the assessment will interrupt your timer.
              </span>
            </li>
            <li style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0, color: 'var(--color-success)', marginTop: 2 }} />
              <span>
                <strong>Auto-submit on timeout:</strong> Your assessment will automatically submit when time expires.
              </span>
            </li>
            <li style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0, color: 'var(--color-success)', marginTop: 2 }} />
              <span>
                <strong>All answers auto-save:</strong> Your responses are saved automatically as you type.
              </span>
            </li>
            <li style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0, color: 'var(--color-success)', marginTop: 2 }} />
              <span>
                <strong>Complete your best work:</strong> Once submitted, you cannot edit your responses.
              </span>
            </li>
            <li style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0, color: 'var(--color-success)', marginTop: 2 }} />
              <span>
                <strong>Avoid tab switching:</strong> you will be not allowed to attend the assignment
              </span>
            </li>
          </ul>
        </div>

        {/* CTA Section */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16, textAlign: 'center' }}>
            Ready to get started? Click the button below to begin the assessment.
          </p>
          <button
            onClick={onStart}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px 20px',
              fontSize: 15,
              fontWeight: 600,
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'background 0.2s',
            }}
           
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = 'var(--color-primary)'
            }}
          >
            {isLoading ? 'Starting Assessment…' : <>
              Start Assignment
              <ChevronRight size={18} />
            </>}
          </button>
        </div>

        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center', margin: 0 }}>
          Your responses and timer will be tracked throughout this assessment.
        </p>
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
  padding: '20px',
}

const cardStyle: React.CSSProperties = {
  background: 'var(--color-surface)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  padding: '40px 36px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
}
