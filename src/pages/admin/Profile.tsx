import { useState, useEffect } from 'react'
import { ShieldCheck, Mail, UserRound, CalendarClock } from 'lucide-react'
import { adminApi } from '../../services/api'

interface CurrentUser {
  id: string
  email: string
  first_name: string
  last_name: string
  role?: string
  last_access?: string
}

export default function AdminProfile() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true)
        setError(null)
        const userData = await adminApi.getCurrentUser()
        setUser(userData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user profile')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      
      if (diffMinutes < 1) return 'Just now'
      if (diffMinutes < 60) return `${diffMinutes}m ago`
      
      const diffHours = Math.floor(diffMinutes / 60)
      if (diffHours < 24) return `${diffHours}h ago`
      
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return '-'
    }
  }

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1>Admin Profile</h1>
          <p>Account information and administrator role details</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p className="text-muted">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div>
        <div className="page-header">
          <h1>Admin Profile</h1>
          <p>Account information and administrator role details</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--color-danger-light)' }}>
          <p style={{ color: 'var(--color-danger)' }}>Error: {error || 'User profile not found'}</p>
        </div>
      </div>
    )
  }
  return (
    <div>
      <div className="page-header">
        <h1>Admin Profile</h1>
        <p>Account information and administrator role details</p>
      </div>

      <div className="two-col-equal">
        <div className="card">
          <h3 className="mb-4">Profile Details</h3>
          <div className="flex items-center gap-3 mb-3">
            <UserRound size={18} />
            <div>
              <div className="text-sm text-muted">Name</div>
              <div className="font-semibold">{user.first_name} {user.last_name}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <Mail size={18} />
            <div>
              <div className="text-sm text-muted">Email</div>
              <div className="font-semibold">{user.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck size={18} />
            <div>
              <div className="text-sm text-muted">Role</div>
              <div className="font-semibold" style={{ textTransform: 'capitalize' }}>{user.role || 'Administrator'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CalendarClock size={18} />
            <div>
              <div className="text-sm text-muted">Last Login</div>
              <div className="font-semibold">{formatDate(user.last_access)}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4">Access Scope</h3>
          <ul className="strengths-list">
            <li>Manage domains and subdomains</li>
            <li>Create, edit, archive, and activate questions</li>
            <li>Use question preview and test grading sandbox</li>
            <li>Configure and monitor grading infrastructure (backend phase)</li>
            <li>Manage role permissions and platform settings (backend phase)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
