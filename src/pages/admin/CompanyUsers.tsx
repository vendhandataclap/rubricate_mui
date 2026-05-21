import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, UserX, UserCheck, RefreshCw, ArrowLeft, Trash2 } from 'lucide-react'
import { adminApi, ApiError } from '../../services/api'
import type { CompanyUser } from '../../types'

export default function CompanyUsers() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<CompanyUser[]>([])
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(20)
  const [page, setPage] = useState(1)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [sessionRole, setSessionRole] = useState('')
  const [sessionCompany, setSessionCompany] = useState('')
  const [scopeLoading, setScopeLoading] = useState(true)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<CompanyUser | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [confirmUser, setConfirmUser] = useState<CompanyUser | null>(null)
  const [confirmNextStatus, setConfirmNextStatus] = useState<'active' | 'inactive' | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<CompanyUser | null>(null)
  const [deleteConfirmLoading, setDeleteConfirmLoading] = useState(false)

  const offset = (page - 1) * limit

  useEffect(() => {
    const delay = window.setTimeout(() => {
      const trimmed = search.trim()
      // Optional short-query guard to avoid noisy calls.
      if (trimmed.length > 0 && trimmed.length < 2) {
        setDebouncedSearch('')
        return
      }
      setDebouncedSearch(trimmed)
      setPage(1)
    }, 400)

    return () => window.clearTimeout(delay)
  }, [search])

  useEffect(() => {
    const loadScope = async () => {
      try {
        const me = await adminApi.getCurrentUser()
        const role = String(me.role || '').toLowerCase()
        const isCompanyRole = role.includes('company')
        const company = String(me.company || me.company_id || '').trim()

        setSessionRole(role)
        if (isCompanyRole) {
          setSessionCompany(company)
          setCompanyFilter(company)
        }
      } catch {
        // Scope fallback is unrestricted when /auth/me is unavailable.
      } finally {
        setScopeLoading(false)
      }
    }

    loadScope()
  }, [])

  const fetchCompanyUsers = useCallback(async () => {
    if (scopeLoading) return

    try {
      setLoading(true)
      setError(null)

      const isCompanyRole = sessionRole.includes('company')
      const effectiveCompanyFilter = isCompanyRole
        ? sessionCompany
        : companyFilter

      const result = await adminApi.getCompanyUsers({
        role: 'company',
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        company: effectiveCompanyFilter || undefined,
        limit,
        offset,
      })

      setUsers(result.items)
      setTotal(result.total)
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : 'Failed to load company users'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [companyFilter, debouncedSearch, limit, offset, scopeLoading, sessionCompany, sessionRole, statusFilter])

  useEffect(() => {
    fetchCompanyUsers()
  }, [fetchCompanyUsers])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const companyOptions = useMemo(() => {
    const fromRows = users.map(u => u.company).filter(Boolean)
    const scoped = sessionCompany ? [sessionCompany] : []
    return Array.from(new Set([...fromRows, ...scoped])).sort((a, b) => a.localeCompare(b))
  }, [sessionCompany, users])

  const formatDate = (value?: string | null) => {
    if (!value) return '—'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString()
  }

  const getStatusBadgeClass = (status?: string) => {
    if ((status || '').toLowerCase() === 'active') return 'badge active'
    return 'badge archived'
  }

  const handleToggleStatus = async (user: CompanyUser) => {
    const currentlyInactive = (user.status || '').toLowerCase() === 'inactive'
    const nextStatus = currentlyInactive ? 'active' : 'inactive'
    setConfirmUser(user)
    setConfirmNextStatus(nextStatus)
  }

  const closeConfirmModal = () => {
    if (confirmLoading) return
    setConfirmUser(null)
    setConfirmNextStatus(null)
  }

  const closeViewModal = () => {
    setShowViewModal(false)
  }

  const closeDeleteConfirmModal = () => {
    if (deleteConfirmLoading) return
    setDeleteConfirmUser(null)
  }

  const handleDeleteUser = (user: CompanyUser) => {
    setDeleteConfirmUser(user)
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmUser) return

    try {
      setDeleteConfirmLoading(true)
      await adminApi.deleteCompanyUser(deleteConfirmUser.id)
      await fetchCompanyUsers()
      setDeleteConfirmUser(null)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete company user'
      alert(message)
    } finally {
      setDeleteConfirmLoading(false)
    }
  }

  useEffect(() => {
    if (!showViewModal && !confirmUser && !deleteConfirmUser) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (confirmUser) {
        closeConfirmModal()
        return
      }
      if (deleteConfirmUser) {
        closeDeleteConfirmModal()
        return
      }
      if (showViewModal) {
        closeViewModal()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showViewModal, confirmUser, confirmLoading, deleteConfirmUser, deleteConfirmLoading])

  const handleConfirmToggle = async () => {
    if (!confirmUser || !confirmNextStatus) return
    const nextStatus = confirmNextStatus

    try {
      setConfirmLoading(true)
      const user = confirmUser
      const currentlyInactive = (user.status || '').toLowerCase() === 'inactive'
      if (currentlyInactive) {
        await adminApi.activateCompanyUser(user.id)
      } else {
        await adminApi.disableCompanyUser(user.id)
      }
      await fetchCompanyUsers()
      if (selectedUser?.id === user.id) {
        setSelectedUser(prev => prev ? { ...prev, status: nextStatus } : prev)
      }
      setConfirmUser(null)
      setConfirmNextStatus(null)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : `Failed to set user as ${nextStatus}`
      alert(message)
    } finally {
      setConfirmLoading(false)
    }
  }

  const openView = (user: CompanyUser) => {
    navigate(`/admin/company-users-projects/${encodeURIComponent(user.email)}`)
  }

  return (
    <div>
      <div className="page-header">
        <h1>Company Users</h1>
        <p>Manage users linked to companies and monitor account status.</p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        {sessionRole.includes('company') && sessionCompany && (
          <div
            style={{
              marginBottom: 12,
              padding: '10px 12px',
              borderRadius: 8,
              background: 'var(--color-primary-light)',
              border: '1px solid var(--color-primary-light)',
              color: 'var(--color-primary)',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Company-scoped view: {sessionCompany}
          </div>
        )}

        <div className="form-row" style={{ marginBottom: 12 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Search</label>
            <input
              className="form-input"
              placeholder="Search by name, email, or company"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row" style={{ marginBottom: 0 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Status</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => {
                setPage(1)
                setStatusFilter(e.target.value)
              }}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Company</label>
            <select
              className="form-select"
              value={companyFilter}
              disabled={sessionRole.includes('company') && !!sessionCompany}
              onChange={(e) => {
                setPage(1)
                setCompanyFilter(e.target.value)
              }}
            >
              <option value="">All companies</option>
              {companyOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Rows per page</label>
            <select
              className="form-select"
              value={String(limit)}
              onChange={(e) => {
                setPage(1)
                setLimit(Number(e.target.value))
              }}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <span className="text-muted">{total} company users</span>
        <button className="btn btn-secondary" onClick={fetchCompanyUsers} disabled={loading}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '30px 20px' }}>
          <p className="text-muted">Loading company users...</p>
        </div>
      ) : error ? (
        <div className="card" style={{ borderColor: 'var(--color-danger-light)', background: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
          <strong>Failed to load users:</strong> {error}
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <h3>No company users found</h3>
          <p className="text-muted">Try adjusting filters or search terms.</p>
        </div>
      ) : (
        <div className="table-container">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: 760 }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="font-semibold" style={{ fontSize: 14 }}>{user.name || '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        Assignments: {user.assignments_count ?? 0}
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{user.email || '—'}</td>
                    <td>
                      <span className={getStatusBadgeClass(user.status)}>
                        {(user.status || 'inactive').toLowerCase()}
                      </span>
                    </td>
                    <td>{formatDate(user.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => openView(user)}>
                          <Eye size={14} /> Tasks
                        </button>
                        <button
                          className={`btn btn-sm ${(user.status || '').toLowerCase() === 'inactive' ? 'btn-secondary' : 'btn-danger'}`}
                          onClick={() => handleToggleStatus(user)}
                          title={(user.status || '').toLowerCase() === 'inactive' ? 'Activate user' : 'Disable user'}
                          style={(user.status || '').toLowerCase() === 'inactive' ? { color: 'var(--color-success)', borderColor: 'var(--color-success)' } : undefined}
                        >
                          {(user.status || '').toLowerCase() === 'inactive' ? <UserCheck size={14} /> : <UserX size={14} />}
                          {(user.status || '').toLowerCase() === 'inactive' ? 'Activate' : 'Disable'}
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteUser(user)}
                          title="Delete user"
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

      <div className="card" style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="text-muted" style={{ fontSize: 13 }}>
          Page {page} of {totalPages}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>

      {showViewModal && selectedUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
          onClick={closeViewModal}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: 520 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
              <button className="btn btn-secondary btn-sm" onClick={closeViewModal}>
                <ArrowLeft size={14} /> Back
              </button>
              <h3 style={{ margin: 0 }}>Company User Details</h3>
              <button className="btn btn-secondary btn-sm" onClick={closeViewModal}>Close</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', rowGap: 10, columnGap: 10, fontSize: 14 }}>
              <strong>Name</strong><span>{selectedUser.name || '—'}</span>
              <strong>Email</strong><span>{selectedUser.email || '—'}</span>
              <strong>Company</strong><span>{selectedUser.company || '—'}</span>
              <strong>Role</strong><span>{selectedUser.role || '—'}</span>
              <strong>Status</strong><span>{selectedUser.status || '—'}</span>
              <strong>Created</strong><span>{formatDate(selectedUser.created_at)}</span>
              <strong>Last Active</strong><span>{formatDate(selectedUser.last_active)}</span>
              <strong>Assignments</strong><span>{selectedUser.assignments_count ?? 0}</span>
            </div>
          </div>
        </div>
      )}

      {confirmUser && confirmNextStatus && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.48)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: 16,
          }}
          onClick={closeConfirmModal}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: 460, boxShadow: 'var(--shadow-lg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="btn btn-secondary btn-sm" onClick={closeConfirmModal} disabled={confirmLoading}>
              <ArrowLeft size={14} /> Back
            </button>
            <h3 style={{ marginTop: 0, marginBottom: 10 }}>
              {confirmNextStatus === 'active' ? 'Activate Company User' : 'Disable Company User'}
            </h3>
            <p className="text-muted" style={{ marginBottom: 18 }}>
              {confirmNextStatus === 'active'
                ? `Are you sure you want to activate ${confirmUser.name || confirmUser.email || 'this user'}?`
                : `Are you sure you want to disable ${confirmUser.name || confirmUser.email || 'this user'}?`}
            </p>
            <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={closeConfirmModal} disabled={confirmLoading}>
                Cancel
              </button>
              <button
                className={`btn ${confirmNextStatus === 'active' ? 'btn-secondary' : 'btn-danger'}`}
                style={confirmNextStatus === 'active' ? { color: 'var(--color-success)', borderColor: 'var(--color-success)' } : undefined}
                onClick={handleConfirmToggle}
                disabled={confirmLoading}
              >
                {confirmLoading
                  ? 'Processing...'
                  : confirmNextStatus === 'active'
                    ? 'Yes, Activate'
                    : 'Yes, Disable'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.48)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: 16,
          }}
          onClick={closeDeleteConfirmModal}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: 460, boxShadow: 'var(--shadow-lg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="btn btn-secondary btn-sm" onClick={closeDeleteConfirmModal} disabled={deleteConfirmLoading}>
              <ArrowLeft size={14} /> Back
            </button>
            <h3 style={{ marginTop: 0, marginBottom: 10 }}>Delete Company User</h3>
            <p className="text-muted" style={{ marginBottom: 18 }}>
              Are you sure you want to permanently delete <strong>{deleteConfirmUser.name || deleteConfirmUser.email || 'this user'}</strong>? This action cannot be undone.
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
