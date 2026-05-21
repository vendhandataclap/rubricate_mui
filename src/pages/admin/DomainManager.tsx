import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { adminApi } from '../../services/api'
import type { Domain, Subdomain } from '../../types'

export default function DomainManager() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [subdomains, setSubdomains] = useState<Subdomain[]>([])
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)

  useEffect(() => {
    adminApi.getDomains()
      .then(({ domains: ds, subdomains: ss }) => { setDomains(ds); setSubdomains(ss) })
      .catch(() => {})
  }, [])

  const [showDomainForm, setShowDomainForm] = useState(false)
  const [showSubdomainForm, setShowSubdomainForm] = useState(false)
  const [domainName, setDomainName] = useState('')
  const [domainDesc, setDomainDesc] = useState('')
  const [subdomainName, setSubdomainName] = useState('')
  const [subdomainDesc, setSubdomainDesc] = useState('')
  
  // Edit states
  const [editingDomainId, setEditingDomainId] = useState<string | null>(null)
  const [editingSubdomainId, setEditingSubdomainId] = useState<string | null>(null)
  const [editDomainName, setEditDomainName] = useState('')
  const [editDomainDesc, setEditDomainDesc] = useState('')
  const [editSubdomainName, setEditSubdomainName] = useState('')
  const [editSubdomainDesc, setEditSubdomainDesc] = useState('')

  const selectedSubdomains = subdomains.filter(s => s.domain_id === selectedDomain)

  const addDomain = async () => {
    if (!domainName.trim()) return
    try {
      const newDomain = await adminApi.createDomain(domainName.trim(), domainDesc.trim())
      setDomains([...domains, newDomain])
      setDomainName('')
      setDomainDesc('')
      setShowDomainForm(false)
    } catch (err) {
      console.error('Failed to create domain:', err)
      alert('Failed to create domain')
    }
  }

  const updateDomain = async (domainId: string) => {
    if (!editDomainName.trim()) return
    try {
      const updated = await adminApi.updateDomain(domainId, editDomainName.trim(), editDomainDesc.trim())
      setDomains(domains.map(d => d.id === domainId ? updated : d))
      setEditingDomainId(null)
      setEditDomainName('')
      setEditDomainDesc('')
    } catch (err) {
      console.error('Failed to update domain:', err)
      alert('Failed to update domain')
    }
  }

  const deleteDomain = async (domainId: string) => {
    if (!window.confirm('Are you sure you want to delete this domain?')) return
    try {
      await adminApi.deleteDomain(domainId)
      setDomains(domains.filter(d => d.id !== domainId))
      setSubdomains(subdomains.filter(s => s.domain_id !== domainId))
      if (selectedDomain === domainId) setSelectedDomain(null)
    } catch (err) {
      console.error('Failed to delete domain:', err)
      alert('Failed to delete domain')
    }
  }

  const addSubdomain = async () => {
    if (!subdomainName.trim() || !selectedDomain) return
    try {
      const newSubdomain = await adminApi.createSubdomain(selectedDomain, subdomainName.trim(), subdomainDesc.trim())
      setSubdomains([...subdomains, newSubdomain])
      setSubdomainName('')
      setSubdomainDesc('')
      setShowSubdomainForm(false)
    } catch (err) {
      console.error('Failed to create subdomain:', err)
      alert('Failed to create subdomain')
    }
  }

  const updateSubdomain = async (subdomainId: string) => {
    if (!editSubdomainName.trim()) return
    try {
      const updated = await adminApi.updateSubdomain(subdomainId, editSubdomainName.trim(), editSubdomainDesc.trim())
      setSubdomains(subdomains.map(s => s.id === subdomainId ? updated : s))
      setEditingSubdomainId(null)
      setEditSubdomainName('')
      setEditSubdomainDesc('')
    } catch (err) {
      console.error('Failed to update subdomain:', err)
      alert('Failed to update subdomain')
    }
  }

  const deleteSubdomain = async (subdomainId: string) => {
    if (!window.confirm('Are you sure you want to delete this subdomain?')) return
    try {
      await adminApi.deleteSubdomain(subdomainId)
      setSubdomains(subdomains.filter(s => s.id !== subdomainId))
    } catch (err) {
      console.error('Failed to delete subdomain:', err)
      alert('Failed to delete subdomain')
    }
  }

  const startEditDomain = (domain: Domain) => {
    setEditingDomainId(domain.id)
    setEditDomainName(domain.name)
    setEditDomainDesc(domain.description || '')
  }

  const startEditSubdomain = (subdomain: Subdomain) => {
    setEditingSubdomainId(subdomain.id)
    setEditSubdomainName(subdomain.name)
    setEditSubdomainDesc(subdomain.description || '')
  }

  return (
    <div>
      <div className="page-header">
        <h1>Domains &amp; Subdomains</h1>
        <p>Manage the knowledge domains used for assessments</p>
      </div>

      <div className="two-col-equal">
        {/* Domains column */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3>Domains</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowDomainForm(true)}>
              <Plus size={16} /> Add Domain
            </button>
          </div>

          {showDomainForm && (
            <div className="card mb-3">
              <div className="form-group">
                <label>Name</label>
                <input className="form-input" placeholder="Domain name" value={domainName} onChange={e => setDomainName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input className="form-input" placeholder="Brief description" value={domainDesc} onChange={e => setDomainDesc(e.target.value)} />
              </div>
              <div className="btn-group">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowDomainForm(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={addDomain} disabled={!domainName.trim()}>Save</button>
              </div>
            </div>
          )}

          {domains.map(d => (
            <div key={d.id}>
              {editingDomainId === d.id ? (
                <div className="card mb-2">
                  <div className="form-group">
                    <label>Name</label>
                    <input className="form-input" value={editDomainName} onChange={e => setEditDomainName(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <input className="form-input" value={editDomainDesc} onChange={e => setEditDomainDesc(e.target.value)} />
                  </div>
                  <div className="btn-group">
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingDomainId(null)}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={() => updateDomain(d.id)} disabled={!editDomainName.trim()}>Save</button>
                  </div>
                </div>
              ) : (
                <div
                  className="card mb-2"
                  style={{
                    cursor: 'pointer',
                    borderColor: selectedDomain === d.id ? 'var(--color-primary)' : undefined,
                    borderWidth: selectedDomain === d.id ? 2 : 1,
                  }}
                  onClick={() => setSelectedDomain(d.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{d.name}</div>
                      <div className="text-sm text-muted">{d.description}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge info">{subdomains.filter(s => s.domain_id === d.id).length} subdomains</span>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => { e.stopPropagation(); startEditDomain(d) }}
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => { e.stopPropagation(); deleteDomain(d.id) }}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Subdomains column */}
        <div>
          {selectedDomain ? (
            <>
              <div className="flex justify-between items-center mb-3">
                <h3>Subdomains — {domains.find(d => d.id === selectedDomain)?.name}</h3>
                <button className="btn btn-primary btn-sm" onClick={() => setShowSubdomainForm(true)}>
                  <Plus size={16} /> Add Subdomain
                </button>
              </div>

              {showSubdomainForm && (
                <div className="card mb-3">
                  <div className="form-group">
                    <label>Name</label>
                    <input className="form-input" placeholder="Subdomain name" value={subdomainName} onChange={e => setSubdomainName(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <input className="form-input" placeholder="Brief description" value={subdomainDesc} onChange={e => setSubdomainDesc(e.target.value)} />
                  </div>
                  <div className="btn-group">
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowSubdomainForm(false)}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={addSubdomain} disabled={!subdomainName.trim()}>Save</button>
                  </div>
                </div>
              )}

              {selectedSubdomains.length === 0 ? (
                <div className="empty-state">
                  <h3>No subdomains yet</h3>
                  <p className="text-muted">Add subdomains to organize questions within this domain.</p>
                </div>
              ) : (
                selectedSubdomains.map(s => (
                  <div key={s.id}>
                    {editingSubdomainId === s.id ? (
                      <div className="card mb-2">
                        <div className="form-group">
                          <label>Name</label>
                          <input className="form-input" value={editSubdomainName} onChange={e => setEditSubdomainName(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>Description</label>
                          <input className="form-input" value={editSubdomainDesc} onChange={e => setEditSubdomainDesc(e.target.value)} />
                        </div>
                        <div className="btn-group">
                          <button className="btn btn-secondary btn-sm" onClick={() => setEditingSubdomainId(null)}>Cancel</button>
                          <button className="btn btn-primary btn-sm" onClick={() => updateSubdomain(s.id)} disabled={!editSubdomainName.trim()}>Save</button>
                        </div>
                      </div>
                    ) : (
                      <div className="card mb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold">{s.name}</div>
                            <div className="text-sm text-muted">{s.description}</div>
                            <div className="text-xs text-muted mt-2">Created: {new Date(s.created_at).toLocaleDateString()}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => startEditSubdomain(s)}
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => deleteSubdomain(s.id)}
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          ) : (
            <div className="empty-state">
              <h3>Select a Domain</h3>
              <p className="text-muted">Click a domain on the left to view and manage its subdomains.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
