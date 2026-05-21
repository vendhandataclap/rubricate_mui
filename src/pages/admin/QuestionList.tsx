import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Archive, CheckCircle, ChevronLeft, ChevronRight, Upload, Download, X, ArrowLeft } from 'lucide-react'
import { adminApi } from '../../services/api'
import type { Question, QuestionStatus, QuestionType, DifficultyTier, Domain } from '../../types'

const PER_PAGE_OPTIONS = [10, 20, 50, 100]

export default function QuestionList() {
  const navigate = useNavigate()

  // Filters
  const [search,       setSearch]       = useState('')
  const [domainFilter, setDomainFilter] = useState('')
  const [typeFilter,   setTypeFilter]   = useState('')
  const [tierFilter,   setTierFilter]   = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page,         setPage]         = useState(1)
  const [pageSize,     setPageSize]     = useState(20)

  // Data
  const [questions, setQuestions] = useState<Question[]>([])
  const [total,     setTotal]     = useState(0)
  const [domainNames, setDomainNames] = useState<Record<string, string>>({})
  const [subNames,    setSubNames]    = useState<Record<string, string>>({})
  const [loading, setLoading]         = useState(true)
  const [error,   setError]           = useState<string | null>(null)

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  const [filterDomains, setFilterDomains] = useState<Domain[]>([])

  // Import modal
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState<{ total_rows?: number; created?: number; failed?: number; created_questions?: any[]; failed_questions?: any[] } | null>(null)

  // Load domains for filter dropdown
  useEffect(() => {
    adminApi.getDomains().then(({ domains }) => setFilterDomains(domains)).catch(() => {})
  }, [])

  const fetchQuestions = useCallback(() => {
    setLoading(true)
    setError(null)
    adminApi.getQuestions({
      domain:     domainFilter || undefined,
      type:       typeFilter   || undefined,
      difficulty: tierFilter   || undefined,
      status:     statusFilter || undefined,
      search:     search       || undefined,
      page,
      limit:    pageSize,
      per_page: pageSize,
      pagination: 1,
    }).then(({ questions: qs, total: t, domainNames: dn, subNames: sn }) => {
      setQuestions(qs)
      setTotal(t)
      setDomainNames(prev => ({ ...prev, ...dn }))
      setSubNames(prev    => ({ ...prev, ...sn }))
      setSelected(new Set())
    }).catch(err => {
      setError(err.message ?? 'Failed to load questions')
    }).finally(() => setLoading(false))
  }, [domainFilter, typeFilter, tierFilter, statusFilter, search, page, pageSize])

  useEffect(() => { fetchQuestions() }, [fetchQuestions])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  /** Build the page-button list with ellipsis condensing. */
  const buildPageWindows = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const delta = 2
    const left  = Math.max(2, page - delta)
    const right = Math.min(totalPages - 1, page + delta)
    const pages: (number | '…')[] = [1]
    if (left > 2)  pages.push('…')
    for (let i = left; i <= right; i++) pages.push(i)
    if (right < totalPages - 1) pages.push('…')
    pages.push(totalPages)
    return pages
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) { next.delete(id) } else { next.add(id) }
    setSelected(next)
  }

  const toggleAll = () => {
    if (selected.size === questions.length) setSelected(new Set())
    else setSelected(new Set(questions.map(q => q.id)))
  }

  const bulkAction = async (action: 'activate' | 'archive') => {
    const ids = Array.from(selected)
    if (!ids.length) return
    setBulkLoading(true)
    try {
      await adminApi.bulkUpdate(ids, action)
      fetchQuestions()
    } catch (err: any) {
      alert(`Bulk ${action} failed: ${err.message}`)
    } finally {
      setBulkLoading(false)
    }
  }

  const handleImport = async () => {
    if (!importFile) return
    setImportLoading(true)
    try {
      const result = await adminApi.importQuestions(importFile)
      setImportResult(result)
      // Refresh questions after successful import
      if (result.created && result.created > 0) {
        setTimeout(() => fetchQuestions(), 1000)
      }
    } catch (err: any) {
      alert(`Import failed: ${err.message}`)
      setImportResult(null)
    } finally {
      setImportLoading(false)
    }
  }

  const downloadSample = (format: 'csv' | 'json') => {
    const filename = `questions-sample.${format}`
    const link = document.createElement('a')
    link.href = `/samples/${filename}`
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const resetImport = () => {
    setImportFile(null)
    setImportResult(null)
    if (importResult && importResult.created && importResult.created > 0) {
      setShowImportModal(false)
    }
  }

  useEffect(() => {
    if (!showImportModal) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowImportModal(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showImportModal])

  const formatType = (type: QuestionType) =>
    type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  const getDomainName  = (id: string) => domainNames[id]  ?? id
  const getSubName     = (id: string | null) => id ? (subNames[id] ?? '') : '—'

  // Reset page when any filter changes
  const onFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
      setter(e.target.value)
      setPage(1)
    }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Question Bank</h1>
          <p>Manage assessment questions across all domains</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => { setShowImportModal(true); resetImport() }}>
            <Upload size={18} /> Import
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/admin/questions/new')}>
            <Plus size={18} /> New Question
          </button>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search questions..."
            value={search}
            onChange={onFilterChange(setSearch)}
          />
          <select className="form-select" style={{ width: 160 }} value={domainFilter} onChange={onFilterChange(setDomainFilter)}>
            <option value="">All Domains</option>
            {filterDomains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select className="form-select" style={{ width: 180 }} value={typeFilter} onChange={onFilterChange(setTypeFilter)}>
            <option value="">All Types</option>
            <option value="open_text">Open Text</option>
            <option value="comparison">Comparison</option>
            <option value="error_identification">Error Identification</option>
            <option value="ranking">Ranking</option>
            <option value="multiple_choice">Multiple Choice</option>
          </select>
          <select className="form-select" style={{ width: 140 }} value={tierFilter} onChange={onFilterChange(setTierFilter)}>
            <option value="">All Tiers</option>
            <option value="no_experience">No experience</option>
            <option value="junior">Junior</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
          </select>
          <select className="form-select" style={{ width: 140 }} value={statusFilter} onChange={onFilterChange(setStatusFilter)}>
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {selected.size > 0 && (
          <div style={{ padding: '10px 20px', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="text-sm font-semibold">{selected.size} selected</span>
            <button className="btn btn-sm btn-secondary" disabled={bulkLoading} onClick={() => bulkAction('archive')}>
              <Archive size={14} /> Archive
            </button>
            <button className="btn btn-sm btn-secondary" disabled={bulkLoading} onClick={() => bulkAction('activate')}>
              <CheckCircle size={14} /> Activate
            </button>
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 20px', color: 'var(--color-danger)', background: 'var(--color-danger-light)', borderBottom: '1px solid var(--color-border)' }}>
            {error} — showing cached data
          </div>
        )}

        <table>
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <input type="checkbox" checked={selected.size === questions.length && questions.length > 0} onChange={toggleAll} />
              </th>
              <th>Domain</th>
              <th>Subdomain</th>
              <th>Type</th>
              <th>Tier</th>
              <th>Status</th>
              <th>Max Score</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="empty-state">Loading questions…</td></tr>
            ) : questions.length === 0 ? (
              <tr><td colSpan={8} className="empty-state">No questions match your filters</td></tr>
            ) : (
              questions.map(q => (
                <tr key={q.id} className="clickable" onClick={() => navigate(`/admin/questions/${q.id}/edit`)}>
                  <td onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(q.id)} onChange={() => toggleSelect(q.id)} />
                  </td>
                  <td className="font-semibold">{getDomainName(q.domain_id)}</td>
                  <td className="text-muted">{getSubName(q.subdomain_id)}</td>
                  <td>{formatType(q.question_type)}</td>
                  <td><span className={`badge ${q.difficulty_tier}`}>{q.difficulty_tier}</span></td>
                  <td><span className={`badge ${q.status}`}>{q.status}</span></td>
                  <td>{q.max_score}</td>
                  <td className="text-muted text-sm">{q.created_at ? new Date(q.created_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="table-footer">
          <span>
            {loading ? 'Loading…' : `Showing ${total === 0 ? 0 : Math.min((page - 1) * pageSize + 1, total)}–${Math.min(page * pageSize, total)} of ${total}`}
          </span>
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={16} /> Prev
            </button>
            {buildPageWindows().map((p, i) =>
              p === '…'
                ? <span key={`ellipsis-${i}`} style={{ padding: '0 6px', alignSelf: 'center', color: 'var(--color-text-muted)' }}>…</span>
                : <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p as number)}>{p}</button>
            )}
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next <ChevronRight size={16} />
            </button>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 12, color: 'var(--color-text-muted)', fontSize: 13 }}>
              Per page:
              <select
                className="form-select"
                style={{ width: 72, height: 32, padding: '0 6px', fontSize: 13 }}
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
              >
                {PER_PAGE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </span>
          </div>
        </div>
      </div>

      {showImportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowImportModal(false)}>
          <div style={{ background: 'white', borderRadius: 8, padding: 32, maxWidth: 500, width: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowImportModal(false)}>
                <ArrowLeft size={14} /> Back
              </button>
              <h2>Import Questions</h2>
              <button onClick={() => setShowImportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <X size={24} />
              </button>
            </div>

            {!importResult ? (
              <>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}>Upload a CSV or JSON file with your questions. Download a sample file to see the expected format.</p>

                <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => downloadSample('csv')}>
                    <Download size={16} /> CSV Sample
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => downloadSample('json')}>
                    <Download size={16} /> JSON Sample
                  </button>
                </div>

                <div style={{ 
                  border: '2px dashed var(--color-border)', 
                  borderRadius: 8, 
                  padding: 32, 
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: importFile ? 'var(--color-primary-light)' : 'var(--color-bg-secondary)',
                  marginBottom: 20
                }}>
                  <input
                    type="file"
                    accept=".csv,.json"
                    onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                    style={{ display: 'none' }}
                    id="import-file"
                  />
                  <label htmlFor="import-file" style={{ cursor: 'pointer', display: 'block' }}>
                    <Upload size={32} style={{ margin: '0 auto 8px', opacity: 0.7 }} />
                    <p style={{ margin: 0, fontWeight: 500 }}>{importFile ? importFile.name : 'Click to select file'}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85em', color: 'var(--color-text-muted)' }}>or drag and drop (CSV/JSON)</p>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => setShowImportModal(false)}>Cancel</button>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleImport} 
                    disabled={!importFile || importLoading}
                  >
                    {importLoading ? 'Importing...' : 'Import'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ 
                    padding: 16, 
                    borderRadius: 8, 
                    background: importResult.failed && importResult.failed > 0 ? 'var(--color-warning-light)' : 'var(--color-success-light)',
                    marginBottom: 12
                  }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>
                      {importResult.created ? `✓ ${importResult.created} questions imported successfully` : 'No questions were created'}
                    </p>
                    {importResult.failed && importResult.failed > 0 && (
                      <p style={{ margin: '8px 0 0', color: 'var(--color-danger)' }}>
                        ⚠ {importResult.failed} questions failed to import
                      </p>
                    )}
                  </div>

                  {importResult.created_questions && importResult.created_questions.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <h4 style={{ marginTop: 0 }}>Created ({importResult.created_questions.length})</h4>
                      <div style={{ maxHeight: 200, overflowY: 'auto', background: 'var(--color-bg-secondary)', padding: 12, borderRadius: 4, fontSize: '0.9em' }}>
                        {importResult.created_questions.map((q: any, i: number) => (
                          <div key={i} style={{ padding: '8px 0', borderBottom: i < importResult.created_questions!.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                            <span style={{ fontWeight: 500 }}>Row {q.row}:</span> {q.prompt_preview}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {importResult.failed_questions && importResult.failed_questions.length > 0 && (
                    <div>
                      <h4 style={{ marginTop: 0 }}>Failed ({importResult.failed_questions.length})</h4>
                      <div style={{ maxHeight: 200, overflowY: 'auto', background: 'var(--color-danger-light)', padding: 12, borderRadius: 4, fontSize: '0.9em' }}>
                        {importResult.failed_questions.map((q: any, i: number) => (
                          <div key={i} style={{ padding: '8px 0', borderBottom: i < importResult.failed_questions!.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                            <span style={{ fontWeight: 600, color: 'var(--color-danger)' }}>Row {q.row}:</span> {q.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => setShowImportModal(false)}>Close</button>
                  {importResult.failed && importResult.failed > 0 && (
                    <button className="btn btn-primary" onClick={resetImport}>Import Another File</button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}