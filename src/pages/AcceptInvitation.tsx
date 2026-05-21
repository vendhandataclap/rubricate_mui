import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { API_BASE_URL } from '../services/env'

export default function AcceptInvitation() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') || ''

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No invitation token provided.')
      return
    }

    const accept = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/recruiters/accept-invitation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const body = await res.json()
        if (res.ok && body.success) {
          setStatus('success')
          setMessage(body.message || 'Invitation accepted! Check your email for login credentials.')
        } else {
          setStatus('error')
          setMessage(body.message || 'Failed to accept invitation.')
        }
      } catch {
        setStatus('error')
        setMessage('Network error. Please try again later.')
      }
    }

    accept()
  }, [token])

  return (
    <div className="signin-wrapper">
      <div className="signin-card" style={{ textAlign: 'center' }}>
        <div className="signin-logo">Rubricate</div>

        {status === 'loading' && (
          <>
            <Loader2 size={48} className="spin" style={{ color: 'var(--color-primary)', margin: '28px auto' }} />
            <p>Accepting your invitation…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={48} style={{ color: 'var(--color-success)', margin: '28px auto' }} />
            <h2 style={{ margin: '12px 0' }}>You're in!</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>{message}</p>
            <button className="btn btn-primary" onClick={() => navigate('/signin')}>
              Go to Sign In
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={48} style={{ color: 'var(--color-danger)', margin: '28px auto' }} />
            <h2 style={{ margin: '12px 0' }}>Something went wrong</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>{message}</p>
            <button className="btn btn-secondary" onClick={() => navigate('/signin')}>
              Go to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  )
}
