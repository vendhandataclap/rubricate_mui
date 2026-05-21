import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, ArrowLeft } from 'lucide-react'
import { adminApi, ApiError } from '../../services/api'
import type { CompanyUser } from '../../types'

export default function CompanyUserEdit() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [user, setUser] = useState<CompanyUser | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('active')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      if (!id) return
      try {
        setLoading(true)
        setError(null)
        const row = await adminApi.getCompanyUser(id)
        setUser(row)
        setName(row.name || '')
        setEmail(row.email || '')
        setStatus((row.status || 'active').toLowerCase())
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to load company user'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [id])

  const handleSave = async () => {
    if (!id) return
    if (!name.trim()) {
      alert('Name is required')
      return
    }
    if (!email.trim()) {
      alert('Email is required')
      return
    }

    try {
      setSaving(true)
      const updated = await adminApi.updateCompanyUser(id, {
        name: name.trim(),
        email: email.trim(),
        status,
      })
      setUser(updated)
      alert('Company user updated successfully')
      navigate('/admin/company-users')
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update company user'
      alert(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1>Edit Company User</h1>
          <p>Loading user details...</p>
        </div>
        <div className="card"><p className="text-muted">Loading...</p></div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="page-header">
          <h1>Edit Company User</h1>
          <p>Update company user profile details.</p>
        </div>
        <div className="card" style={{ borderColor: 'var(--color-danger-light)', background: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
          <strong>Failed to load user:</strong> {error}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>Edit Company User</h1>
        <p>Update company user profile details.</p>
      </div>

      <div style={{ marginBottom: 12 }}>
        <button className="btn btn-secondary" onClick={() => navigate('/admin/company-users')}>
          <ArrowLeft size={14} /> Back to Company Users
        </button>
      </div>

      <div className="card">
        <div className="form-row">
          <div className="form-group">
            <label>Name</label>
            <input
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Company</label>
            <input className="form-input" value={user?.company || ''} disabled />
          </div>
          <div className="form-group">
            <label>Role</label>
            <input className="form-input" value={user?.role || ''} disabled />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Status</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="btn-group" style={{ marginTop: 10 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/company-users')}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
