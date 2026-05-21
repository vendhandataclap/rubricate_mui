import { useState, useEffect } from 'react'
import { Plus, Edit2, Mail, Phone, Building2, Send, RefreshCw, Eye, UserCheck, UserX, Trash2 } from 'lucide-react'
import { adminApi } from '../../services/api'
import type { Recruiter, Domain } from '../../types'

type RecruiterStatus = 'active' | 'inactive' | 'invited' | 'pending'

interface ExtendedRecruiter extends Omit<Recruiter, 'status'> {
  status: RecruiterStatus
  invited_at?: string | null
  accepted_at?: string | null
}

export default function Recruiters() {
  const [recruiters, setRecruiters] = useState<ExtendedRecruiter[]>([])
  const [domains,    setDomains]    = useState<Domain[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedRecruiter, setSelectedRecruiter] = useState<ExtendedRecruiter | null>(null)
  const [confirmRecruiter, setConfirmRecruiter] = useState<ExtendedRecruiter | null>(null)
  const [confirmAction, setConfirmAction] = useState<'activate' | 'deactivate' | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [deleteConfirmRecruiter, setDeleteConfirmRecruiter] = useState<ExtendedRecruiter | null>(null)
  const [deleteConfirmLoading, setDeleteConfirmLoading] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])

  useEffect(() => {
    adminApi.getDomains().then(({ domains: ds }) => setDomains(ds)).catch(() => {})
    loadRecruiters()
  }, [])

  const loadRecruiters = () => {
    adminApi.getRecruiters().then(list => {
      setRecruiters(list as ExtendedRecruiter[])
    }).catch(() => {})
  }

  const handleOpenForm = (recruiter?: ExtendedRecruiter) => {
    if (recruiter) {
      setEditingId(recruiter.id)
      const parts = recruiter.full_name.split(/\s+/)
      setFirstName(parts[0] || '')
      setLastName(parts.slice(1).join(' ') || '')
      setEmail(recruiter.email)
      setPhone(recruiter.phone || '')
      setCompany(recruiter.company || '')
      setSelectedDomains(recruiter.domain_ids)
    } else {
      setEditingId(null)
      setFirstName('')
      setLastName('')
      setEmail('')
      setPhone('')
      setCompany('')
      setSelectedDomains([])
    }
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingId(null)
  }

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      alert('First name, last name, and email are required')
      return
    }
    if (!company.trim()) {
      alert('Company ID is required')
      return
    }

    if (editingId) {
      try {
        setSaving(true)
        await adminApi.updateRecruiter(editingId, {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          email: email.trim(),
          phone: phone.trim() || undefined,
        })
        loadRecruiters()
      } catch (err: any) {
        alert(err?.message || 'Failed to update recruiter')
        return
      } finally {
        setSaving(false)
      }
    } else {
      try {
        setSaving(true)
        await adminApi.createRecruiter({
          company_id: company.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
        })
        loadRecruiters()
      } catch (err: any) {
        alert(err?.message || 'Failed to add recruiter')
        return
      } finally {
        setSaving(false)
      }
    }

    handleCloseForm()
  }

  const openStatusConfirm = (recruiter: ExtendedRecruiter) => {
    const nextAction = recruiter.status === 'inactive' ? 'activate' : 'deactivate'
    setConfirmRecruiter(recruiter)
    setConfirmAction(nextAction)
  }

  const closeStatusConfirm = () => {
    if (confirmLoading) return
    setConfirmRecruiter(null)
    setConfirmAction(null)
  }

  const handleConfirmStatusAction = async () => {
    if (!confirmRecruiter || !confirmAction) return
    try {
      setConfirmLoading(true)
      if (confirmAction === 'activate') {
        await adminApi.updateRecruiter(confirmRecruiter.id, { status: 'active', is_active: true })
      } else {
        await adminApi.deleteRecruiter(confirmRecruiter.id)
      }
      loadRecruiters()
      setSelectedRecruiter((prev) => {
        if (!prev || prev.id !== confirmRecruiter.id) return prev
        return { ...prev, status: confirmAction === 'activate' ? 'active' : 'inactive' }
      })
      setConfirmRecruiter(null)
      setConfirmAction(null)
    } catch (err: any) {
      alert(err?.message || `Failed to ${confirmAction} recruiter`)
    } finally {
      setConfirmLoading(false)
    }
  }

  const handleResendInvite = async (id: string) => {
    try {
      await adminApi.resendInvitation(id)
      alert('Invitation resent successfully')
    } catch (err: any) {
      alert(err?.message || 'Failed to resend invitation')
    }
  }

  const handleDeleteRecruiter = (recruiter: ExtendedRecruiter) => {
    setDeleteConfirmRecruiter(recruiter)
  }

  const closeDeleteConfirmModal = () => {
    if (deleteConfirmLoading) return
    setDeleteConfirmRecruiter(null)
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmRecruiter) return

    try {
      setDeleteConfirmLoading(true)
      await adminApi.deleteRecruiter(deleteConfirmRecruiter.id)
      loadRecruiters()
      if (selectedRecruiter?.id === deleteConfirmRecruiter.id) {
        setSelectedRecruiter(null)
      }
      setDeleteConfirmRecruiter(null)
    } catch (err: any) {
      alert(err?.message || 'Failed to delete recruiter')
    } finally {
      setDeleteConfirmLoading(false)
    }
  }

  const toggleDomain = (domainId: string) => {
    if (selectedDomains.includes(domainId)) {
      setSelectedDomains(selectedDomains.filter(d => d !== domainId))
    } else {
      setSelectedDomains([...selectedDomains, domainId])
    }
  }

  const statusLabel = (s: RecruiterStatus) => {
    switch (s) {
      case 'invited': return 'Invited'
      case 'active':  return 'Active'
      case 'inactive': return 'Inactive'
      default:        return 'Pending'
    }
  }

  const statusClass = (s: RecruiterStatus) => {
    switch (s) {
      case 'active':  return 'badge active'
      case 'invited': return 'badge draft'
      case 'inactive': return 'badge archived'
      default:        return 'badge draft'
    }
  }

  const formatDate = (iso?: string | null) => {
    if (!iso) return '—'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString()
  }

  return (
    <div>
      <div className="page-header">
        <h1>Recruiters</h1>
        <p>Manage expert recruiters and their assigned domains</p>
      </div>

      <div className="flex justify-between items-center mb-4">
        <span className="text-muted">{recruiters.length} recruiters</span>
        <button className="btn btn-primary" onClick={() => handleOpenForm()}>
          <Plus size={16} /> Add Recruiter
        </button>
      </div>

      {showForm && (
        <div className="card mb-4" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-primary)' }}>
          <h3 style={{ marginBottom: 16, marginTop: 0 }}>
            {editingId ? 'Edit Recruiter' : 'Add New Recruiter'}
          </h3>

          {!editingId && (
            <div className="signin-hint" style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--color-primary-light)', borderRadius: 6, fontSize: 13 }}>
              <Send size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              An invitation email will be sent to the recruiter. After they accept,
              login credentials will be emailed automatically.
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input
                className="form-input"
                placeholder="First name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input
                className="form-input"
                placeholder="Last name"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email *</label>
              <input
                className="form-input"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                className="form-input"
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Company ID *</label>
              <input
                className="form-input"
                placeholder="Company ID"
                value={company}
                onChange={e => setCompany(e.target.value)}
              />
            </div>
          </div>

          {domains.length > 0 && (
            <div className="form-group">
              <label>Assigned Domains (optional)</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {domains.map(d => (
                  <button
                    key={d.id}
                    onClick={() => toggleDomain(d.id)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 6,
                      border: '1px solid',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s',
                      backgroundColor: selectedDomains.includes(d.id)
                        ? 'var(--color-primary)'
                        : 'var(--color-surface)',
                      borderColor: selectedDomains.includes(d.id)
                        ? 'var(--color-primary)'
                        : 'var(--color-border)',
                      color: selectedDomains.includes(d.id)
                        ? 'white'
                        : 'var(--color-text)',
                    }}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="btn-group" style={{ marginTop: 20 }}>
            <button className="btn btn-secondary" onClick={handleCloseForm}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving
                ? 'Saving...'
                : editingId
                  ? 'Update Recruiter'
                  : 'Add & Send Invitation'
              }
            </button>
          </div>
        </div>
      )}

      {recruiters.length === 0 ? (
        <div className="empty-state">
          <h3>No recruiters yet</h3>
          <p className="text-muted">Add your first recruiter to get started.</p>
        </div>
      ) : (
        <div className="table-container">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: 820 }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Invited</th>
                  <th>Accepted</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recruiters.map(recruiter => (
                  <tr key={recruiter.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            background: 'var(--color-primary-light)',
                            color: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        >
                          {recruiter.full_name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()}
                        </span>
                        <div>
                          <div className="font-semibold" style={{ fontSize: 14 }}>
                            {recruiter.full_name}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                            {recruiter.company || '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{recruiter.email}</td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{recruiter.phone || '—'}</td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{recruiter.company || '—'}</td>
                    <td>
                      <span className={statusClass(recruiter.status)}>{statusLabel(recruiter.status)}</span>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{formatDate(recruiter.invited_at)}</td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{formatDate(recruiter.accepted_at)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setSelectedRecruiter(recruiter)}
                          title="View recruiter"
                        >
                          <Eye size={16} /> View
                        </button>
                        {recruiter.status === 'invited' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleResendInvite(recruiter.id)}
                            title="Resend invitation"
                          >
                            <RefreshCw size={16} />
                          </button>
                        )}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenForm(recruiter)}
                          title="Edit recruiter"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className={`btn btn-sm ${recruiter.status === 'inactive' ? 'btn-secondary' : 'btn-danger'}`}
                          onClick={() => openStatusConfirm(recruiter)}
                          title={recruiter.status === 'inactive' ? 'Activate recruiter' : 'Deactivate recruiter'}
                          style={recruiter.status === 'inactive' ? { color: 'var(--color-success)', borderColor: 'var(--color-success)' } : undefined}
                        >
                          {recruiter.status === 'inactive' ? <UserCheck size={14} /> : <UserX size={14} />}
                          {recruiter.status === 'inactive' ? 'Activate' : 'Disable'}
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteRecruiter(recruiter)}
                          title="Delete recruiter"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedRecruiter && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 30,
          }}
          onClick={() => setSelectedRecruiter(null)}
        >
          <div
            className="card"
            style={{ width: '520px', maxWidth: '90%', boxShadow: 'var(--shadow-lg)', position: 'relative' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Recruiter Details</h3>
            <div style={{ display: 'grid', gap: 12, fontSize: 14 }}>
              <div><strong>Name:</strong> {selectedRecruiter.full_name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={16} /> {selectedRecruiter.email}
              </div>
              {selectedRecruiter.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Phone size={16} /> {selectedRecruiter.phone}
                </div>
              )}
              {selectedRecruiter.company && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building2 size={16} /> {selectedRecruiter.company}
                </div>
              )}
              <div>
                <strong>Status:</strong> <span className={statusClass(selectedRecruiter.status)}>{statusLabel(selectedRecruiter.status)}</span>
              </div>
              <div><strong>Invited:</strong> {formatDate(selectedRecruiter.invited_at)}</div>
              <div><strong>Accepted:</strong> {formatDate(selectedRecruiter.accepted_at)}</div>
              {selectedRecruiter.domain_ids.length > 0 && (
                <div>
                  <strong>Domains:</strong>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    {selectedRecruiter.domain_ids.map(domainId => {
                      const domain = domains.find(d => d.id === domainId)
                      return (
                        <span key={domainId} className="badge info">{domain?.name || domainId}</span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="btn-group" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedRecruiter(null)}>
                Close
              </button>
              <button
                className={`btn ${selectedRecruiter.status === 'inactive' ? 'btn-secondary' : 'btn-danger'}`}
                onClick={() => openStatusConfirm(selectedRecruiter)}
                style={selectedRecruiter.status === 'inactive' ? { color: 'var(--color-success)', borderColor: 'var(--color-success)' } : undefined}
              >
                {selectedRecruiter.status === 'inactive' ? 'Activate' : 'Deactivate'}
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  setSelectedRecruiter(null)
                  handleDeleteRecruiter(selectedRecruiter)
                }}
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmRecruiter && confirmAction && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.48)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
          }}
          onClick={closeStatusConfirm}
        >
          <div
            className="card"
            style={{ width: '460px', maxWidth: '92%', boxShadow: 'var(--shadow-lg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: 10 }}>
              {confirmAction === 'activate' ? 'Activate Recruiter' : 'Deactivate Recruiter'}
            </h3>
            <p className="text-muted" style={{ marginBottom: 18 }}>
              {confirmAction === 'activate'
                ? `Are you sure you want to activate ${confirmRecruiter.full_name}?`
                : `Are you sure you want to deactivate ${confirmRecruiter.full_name}?`}
            </p>
            <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={closeStatusConfirm} disabled={confirmLoading}>
                Cancel
              </button>
              <button
                className={`btn ${confirmAction === 'activate' ? 'btn-secondary' : 'btn-danger'}`}
                style={confirmAction === 'activate' ? { color: 'var(--color-success)', borderColor: 'var(--color-success)' } : undefined}
                onClick={handleConfirmStatusAction}
                disabled={confirmLoading}
              >
                {confirmLoading
                  ? 'Processing...'
                  : confirmAction === 'activate'
                    ? 'Yes, Activate'
                    : 'Yes, Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmRecruiter && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.48)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
          }}
          onClick={closeDeleteConfirmModal}
        >
          <div
            className="card"
            style={{ width: '460px', maxWidth: '92%', boxShadow: 'var(--shadow-lg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: 10 }}>
              Delete Recruiter
            </h3>
            <p className="text-muted" style={{ marginBottom: 18 }}>
              Are you sure you want to permanently delete <strong>{deleteConfirmRecruiter.full_name}</strong> and their associated user account? This action cannot be undone.
            </p>
            <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={closeDeleteConfirmModal} disabled={deleteConfirmLoading}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                disabled={deleteConfirmLoading}
              >
                {deleteConfirmLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
