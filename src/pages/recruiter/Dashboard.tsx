import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardCheck, Clock, CheckCircle, TrendingUp, AlertTriangle, Users, Eye, X, ArrowLeft, Mail } from 'lucide-react'
import { recruiterApi, adminApi } from '../../services/api'
import type { Assessment, Expert, Subdomain } from '../../types'

type Tab = 'recent' | 'completed'

function getTierLabel(expert: Expert): string {
  const details = (expert as any).userdetails || {}
  const level = expert.seniority_level || details.experience || details.experience_level
  if (level) {
    const label = String(level).replace(/_/g, ' ')
    return label.charAt(0).toUpperCase() + label.slice(1)
  }
  if (expert.years_experience < 2) return 'Junior (inferred)'
  if (expert.years_experience <= 7) return 'Mid (inferred)'
  return 'Senior (inferred)'
}

export default function RecruiterDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('recent')
  const [isMobile, setIsMobile] = useState(false)

  const [experts,      setExperts]      = useState<Expert[]>([])
  const [assessments,  setAssessments]  = useState<Assessment[]>([])
  const [subdomains,   setSubdomains]   = useState<Subdomain[]>([])
  const [domainMap,    setDomainMap]    = useState<Record<string, string>>({})
  const [subMap,       setSubMap]       = useState<Record<string, string>>({})
  const [loadingData,  setLoadingData]  = useState(true)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    handleResize()
    window.addEventListener('resize', handleResize)

    Promise.allSettled([
      recruiterApi.getExperts()
        .then(({ experts }) => setExperts(experts))
        .catch((err) => {
          console.error('[RecruiterDashboard] Failed to load experts', err)
        }),
      recruiterApi.getAssessments({ status: 'graded,reviewed', limit: 100 })
        .then(r => setAssessments(r.assessments))
        .catch((err) => {
          console.error('[RecruiterDashboard] Failed to load assessments', err)
        }),
      adminApi.getDomains()
        .then(({ domains, subdomains: ss }) => {
          setSubdomains(ss)
          const dMap: Record<string, string> = {}
          domains.forEach(d => { dMap[d.id] = d.name })
          const sMap: Record<string, string> = {}
          ss.forEach(s => { sMap[s.id] = s.name })
          setDomainMap(dMap)
          setSubMap(sMap)
        })
        .catch((err) => {
          console.error('[RecruiterDashboard] Failed to load domains/subdomains', err)
        }),
    ]).finally(() => setLoadingData(false))

      return () => window.removeEventListener('resize', handleResize)
  }, [])

  const recentApplications  = experts.filter(e => e.onboarding_status === 'profile_complete')
  const completedAssessments = assessments.filter(
    a => a.status === 'graded' || a.status === 'reviewed'
  )

  // Derive stats from live data
  const stats = {
    pendingReview:        assessments.filter(a => a.status === 'graded').length,
    completedReviews:     assessments.filter(a => a.status === 'reviewed').length,
    totalAssessments:     assessments.length,
    recentApplications:  recentApplications.length,
    passRate: (() => {
      const g = assessments.filter(a => a.ai_recommendation)
      return g.length ? Math.round(g.filter(a => a.ai_recommendation === 'pass').length / g.length * 100) : 0
    })(),
    avgScore: (() => {
      const scores = assessments.map(a => a.percentage).filter((p): p is number => p !== null)
      return scores.length ? Math.round(scores.reduce((s, p) => s + p, 0) / scores.length) : 0
    })(),
    flagRate: (() => {
      const g = assessments.filter(a => a.status === 'graded' || a.status === 'reviewed')
      return g.length ? Math.round(g.filter(a => (a.flag_count ?? 0) > 0).length / g.length * 100) : 0
    })(),
  }

  const navigateAssessmentOverview = () => {
    navigate('/recruiter/assignments')
  }

  return (
    <div>
      <div className="page-header">
        <h1>Recruiter Dashboard</h1>
        <p>Review assessments and manage expert applications
          {loadingData && <span className="text-muted" style={{ fontSize: 13, marginLeft: 8 }}>Loading…</span>}
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card" onClick={navigateAssessmentOverview} style={{ cursor: 'pointer' }}>
          <div className="stat-icon danger"><Clock size={22} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.pendingReview}</div>
            <div className="stat-label">Pending Review</div>
          </div>
        </div>
        <div className="stat-card" onClick={navigateAssessmentOverview} style={{ cursor: 'pointer' }}>
          <div className="stat-icon success"><CheckCircle size={22} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.completedReviews}</div>
            <div className="stat-label">Completed Reviews</div>
          </div>
        </div>
        <div className="stat-card" onClick={navigateAssessmentOverview} style={{ cursor: 'pointer' }}>
          <div className="stat-icon primary"><ClipboardCheck size={22} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalAssessments}</div>
            <div className="stat-label">Total Assessments</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><TrendingUp size={22} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.passRate}%</div>
            <div className="stat-label">Pass Rate</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info"><TrendingUp size={22} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.avgScore}%</div>
            <div className="stat-label">Avg Score</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><AlertTriangle size={22} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.flagRate}%</div>
            <div className="stat-label">Flag Rate</div>
          </div>
        </div>
      </div>

      {/* Tabs – segmented pill style */}
      <div style={{ display: 'flex', background: 'var(--color-bg)', borderRadius: 10, padding: 4, gap: 4, marginBottom: 24 }}>
        {([
          { key: 'recent', icon: <Users size={15} />, label: `Recent Applications (${recentApplications.length})` },
          { key: 'completed', icon: <ClipboardCheck size={15} />, label: `Completed Assessments (${completedAssessments.length})` },
        ] as const).map(({ key, icon, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 7,
              border: 'none',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
              background: activeTab === key ? 'var(--color-surface)' : 'transparent',
              color: activeTab === key ? 'var(--color-text)' : 'var(--color-text-secondary)',
              boxShadow: activeTab === key ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
            }}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'recent' ? (
        <RecentApplicationsTab
          experts={recentApplications}
          domainMap={domainMap}
          subMap={subMap}
          isMobile={isMobile}
        />
      ) : (
        <CompletedAssessmentsTab assessments={completedAssessments} navigate={navigate} />
      )}
    </div>
  )
}

// ── Recent Applications Tab ──
function RecentApplicationsTab({
  experts,
  domainMap,
  subMap,
  isMobile,
}: {
  experts: Expert[]
  domainMap: Record<string, string>
  subMap: Record<string, string>
  isMobile: boolean
}) {
  const [activeExpert, setActiveExpert] = useState<Expert | null>(null)

  if (experts.length === 0) {
    return (
      <div className="empty-state">
        <h3>No pending applications</h3>
        <p className="text-muted">All expert applications have been processed.</p>
      </div>
    )
  }

  return (
    <>
      <div className="table-container">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Recent Applications</h3>
          <span className="text-muted" style={{ fontSize: 13 }}>Showing {experts.length}</span>
        </div>

        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 12px 16px' }}>
            {experts.map(expert => {
              const details = (expert as any).userdetails || {}
              const title = details.title || expert.full_name || '—'
              const email = details.email || expert.email || '—'
              const domainDisplay =
                domainMap[details.domain] ||
                domainMap[expert.primary_domain_id] ||
                details.domain ||
                expert.primary_domain_name ||
                (expert as any)._domain_name ||
                expert.primary_domain_id ||
                '—'
              const subdomainDisplay =
                details.subdomain ||
                details.Subdomain ||
                subMap[details.subdomain] ||
                subMap[details.Subdomain] ||
                subMap[expert.subdomain_id as string] ||
                expert.subdomain_name ||
                expert.subdomain_id ||
                '—'
              const availability = details.availability || '—'
              const completion = typeof details.profile_completed === 'number' ? details.profile_completed : 0
              const tierLabel = getTierLabel(expert)

              return (
                <div key={expert.id} className="card" style={{ padding: 14 }}>
                  <div className="flex" style={{ justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div className="font-semibold" style={{ fontSize: 15 }}>{title}</div>
                      <div className="text-xs text-muted" style={{ wordBreak: 'break-all', marginTop: 2 }}>{email}</div>
                      <div className="text-sm" style={{ marginTop: 6 }}>
                        <strong>Domain:</strong> {domainDisplay}
                      </div>
                      <div className="text-sm" style={{ marginTop: 2 }}>
                        <strong>Subdomain:</strong> {subdomainDisplay}
                      </div>
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span className="badge draft">{tierLabel}</span>
                        <span className="text-xs text-muted">{availability}</span>
                      </div>
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 90, height: 6, background: 'var(--color-border)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${completion}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.2s' }} />
                        </div>
                        <span className="text-xs text-muted">{completion}%</span>
                      </div>
                    </div>
                    <div style={{ alignSelf: 'center' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setActiveExpert(expert)}
                        style={{ padding: '8px 12px', fontSize: 13 }}
                      >
                        <Eye size={14} /> View
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Email</th>
                  <th>Domain</th>
                  <th>Subdomain</th>
                  <th>Availability</th>
                  <th>Completion</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {experts.map(expert => {
                  const details = (expert as any).userdetails || {}
                  const title = details.title || expert.full_name || '—'
                  const email = details.email || expert.email || '—'
                  const domainDisplay =
                    domainMap[details.domain] ||
                    domainMap[expert.primary_domain_id] ||
                    details.domain ||
                    expert.primary_domain_name ||
                    (expert as any)._domain_name ||
                    expert.primary_domain_id ||
                    '—'
                  const subdomainDisplay =
                    details.subdomain ||
                    details.Subdomain ||
                    subMap[details.subdomain] ||
                    subMap[details.Subdomain] ||
                    subMap[expert.subdomain_id as string] ||
                    expert.subdomain_name ||
                    expert.subdomain_id ||
                    '—'
                  const availability = details.availability || '—'
                  const completion = typeof details.profile_completed === 'number' ? details.profile_completed : 0
                  const tierLabel = getTierLabel(expert)
                  const initials = expert.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
                  return (
                    <tr key={expert.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="application-avatar">{initials}</div>
                          <div style={{ minWidth: 0 }}>
                            <div className="font-semibold" style={{ textTransform: 'capitalize' }}>{title}</div>
                            <div className="text-xs text-muted" style={{ wordBreak: 'break-all' }}>{email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm" style={{ wordBreak: 'break-all' }}>{email}</div>
                      </td>
                      <td>
                        <div className="font-semibold" style={{ fontSize: 13 }}>{domainDisplay}</div>
                      </td>
                      <td>
                        <div className="text-sm" style={{ wordBreak: 'break-all' }}>{subdomainDisplay}</div>
                      </td>
                      <td>
                        <span className="badge draft">{tierLabel}</span>
                        <div className="text-xs text-muted" style={{ marginTop: 4 }}>{availability}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 70, height: 6, background: 'var(--color-border)', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${completion}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.2s' }} />
                          </div>
                          <span className="text-xs text-muted">{completion}%</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setActiveExpert(expert)}
                          style={{ padding: '8px 12px', fontSize: 13 }}
                        >
                          <Eye size={14} /> View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeExpert && (
        <ExpertViewModal
          expert={activeExpert}
          domainMap={domainMap}
          subMap={subMap}
          onClose={() => setActiveExpert(null)}
        />
      )}
    </>
  )
}

// ── Expert View Modal ──
function ExpertViewModal({
  expert,
  domainMap,
  subMap,
  onClose,
}: {
  expert: Expert
  domainMap: Record<string, string>
  subMap: Record<string, string>
  onClose: () => void
}) {
  const details = (expert as any).userdetails || {}
  const profileCompletion = typeof details.profile_completed === 'number' ? details.profile_completed : 0
  const domainDisplay =
    domainMap[details.domain] ||
    domainMap[expert.primary_domain_id] ||
    details.domain ||
    expert.primary_domain_name ||
    (expert as any)._domain_name ||
    expert.primary_domain_id ||
    '—'
  const subdomainDisplay =
    details.subdomain ||
    details.Subdomain ||
    subMap[details.subdomain] ||
    subMap[details.Subdomain] ||
    subMap[expert.subdomain_id as string] ||
    expert.subdomain_name ||
    expert.subdomain_id ||
    '—'

  const parseListValue = (value: unknown) => {
    if (value === null || value === undefined || value === '') return '-'
    if (Array.isArray(value)) return value.length ? value.join(', ') : '-'
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) return parsed.length ? parsed.join(', ') : '-'
        if (parsed && typeof parsed === 'object') return JSON.stringify(parsed)
      } catch {
        return value
      }
      return value
    }
    return String(value)
  }

  const parseArrayObject = (raw: unknown) => {
    if (Array.isArray(raw)) return raw
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }
    return []
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15,23,42,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: 14,
          width: '100%', maxWidth: 740,
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 48px rgba(0,0,0,0.20)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              style={{ marginBottom: 10 }}
            >
              <ArrowLeft size={14} /> Back
            </button>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
              Expert Details
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13,
              }}>
                {expert.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
              <div>
                <span className="font-semibold" style={{ fontSize: 14, display: 'block' }}>{expert.full_name}</span>
                <a
                  href={`mailto:${expert.email}`}
                  style={{ color: 'var(--color-primary)', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Mail size={12} /> {expert.email}
                </a>
              </div>
              <span className="badge draft" style={{ marginLeft: 4 }}>
                {(expert.onboarding_status || 'active').replace(/_/g, ' ')}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-text-secondary)' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px' }}>
          <div style={{ marginBottom: '24px', background: 'var(--color-surface)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>Profile Completion</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)' }}>{profileCompletion}%</div>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  backgroundColor: 'var(--color-primary)',
                  width: `${profileCompletion}%`,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '14px', color: 'var(--color-text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
              Basic Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Title', value: details.title },
                { label: 'Email', value: details.email || expert.email },
                { label: 'Country', value: details.country },
                { label: 'City', value: details.city },
                { label: 'Country Code', value: details.country_code },
                { label: 'Experience', value: details.experience ?? details.experience_level ?? (expert.years_experience ? `${expert.years_experience} years` : null) },
                { label: 'Availability', value: details.availability },
                { label: 'Overview', value: details.overview },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'var(--color-surface)', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                  <div style={{ fontWeight: 500, fontSize: '14px', wordBreak: 'break-word' }}>
                    {value === null || value === undefined || value === '' ? '-' : String(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '14px', color: 'var(--color-text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
              Skills & Expertise
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Labeling Types', value: details.labeling_types },
                { label: 'Data Types', value: details.data_types },
                { label: 'Labeling Software', value: details.labeling_software },
                { label: 'General Annotation Tasks', value: details.general_annotation_tasks },
                { label: 'Domain Expert Tasks', value: details.domain_expert_tasks },
                { label: 'Language Tasks', value: details.language_tasks },
                { label: 'Languages', value: details.languages },
                { label: 'Industries', value: details.industries },
                { label: 'Domain', value: domainDisplay },
                { label: 'Subdomain', value: subdomainDisplay },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'var(--color-surface)', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                  <div style={{ fontWeight: 500, fontSize: '14px', wordBreak: 'break-word' }}>{parseListValue(value)}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '14px', color: 'var(--color-text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
              Files & Links
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Resume File', value: details.resume_file },
                { label: 'Photo File', value: details.photo_file },
                { label: 'Portfolio Links', value: details.portfolio_links },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'var(--color-surface)', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                  <div style={{ fontWeight: 500, fontSize: '14px', wordBreak: 'break-word' }}>{parseListValue(value)}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '14px', color: 'var(--color-text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
              Users Collection
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Email', value: expert.email },
                { label: 'Phone', value: expert.phone || details.phone },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'var(--color-surface)', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                  <div style={{ fontWeight: 500, fontSize: '14px', wordBreak: 'break-word' }}>{parseListValue(value)}</div>
                </div>
              ))}
            </div>

            {(() => {
              const items = parseArrayObject((expert as any).education)
              if (!items.length) {
                return (
                  <div style={{ marginTop: '12px', background: 'var(--color-surface)', borderRadius: '8px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Education</div>
                    <div style={{ fontWeight: 500, fontSize: '14px' }}>-</div>
                  </div>
                )
              }
              return (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Education</div>
                  {items.map((edu: any, i: number) => (
                    <div key={i} style={{ background: 'var(--color-surface)', borderRadius: '8px', padding: '12px 14px', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{edu.institution || '-'}</div>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        {[edu.degree, edu.field, edu.startYear ? `${edu.startYear}${edu.endYear ? ` - ${edu.endYear}` : ''}` : null, edu.grade ? `Grade: ${edu.grade}` : null].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}

            {(() => {
              const items = parseArrayObject((expert as any).work_experience)
              if (!items.length) {
                return (
                  <div style={{ marginTop: '12px', background: 'var(--color-surface)', borderRadius: '8px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Work Experience</div>
                    <div style={{ fontWeight: 500, fontSize: '14px' }}>-</div>
                  </div>
                )
              }
              return (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Work Experience</div>
                  {items.map((job: any, i: number) => (
                    <div key={i} style={{ background: 'var(--color-surface)', borderRadius: '8px', padding: '12px 14px', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{job.company || '-'} - {job.role || '-'}</div>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        {[job.startDate ? `${job.startDate}${job.ongoing ? ' - Present' : (job.endDate ? ` - ${job.endDate}` : '')}` : null, job.description].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}

            {(() => {
              const items = parseArrayObject((expert as any).labeling_experience)
              if (!items.length) {
                return (
                  <div style={{ marginTop: '12px', background: 'var(--color-surface)', borderRadius: '8px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Labeling Experience</div>
                    <div style={{ fontWeight: 500, fontSize: '14px' }}>-</div>
                  </div>
                )
              }
              return (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Labeling Experience</div>
                  {items.map((exp: any, i: number) => (
                    <div key={i} style={{ background: 'var(--color-surface)', borderRadius: '8px', padding: '12px 14px', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{exp.title || '-'}</div>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        {[exp.dataType, Array.isArray(exp.labelingTypes) ? exp.labelingTypes.join(', ') : exp.labelingTypes, exp.subjectMatter, exp.startDate ? `${exp.startDate}${exp.ongoing ? ' - Present' : (exp.endDate ? ` - ${exp.endDate}` : '')}` : null].filter(Boolean).join(' · ')}
                      </div>
                      {exp.description && <div style={{ fontSize: '13px', marginTop: '4px' }}>{exp.description}</div>}
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
          background: 'var(--color-bg)',
          borderRadius: '0 0 14px 14px',
        }}>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

// ── Completed Assessments Tab ──
function CompletedAssessmentsTab({
  assessments,
  navigate,
}: {
  assessments: Assessment[]
  navigate: (path: string) => void
}) {
  const [recFilter, setRecFilter] = useState('')
  const [domainFilter, setDomainFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = assessments.filter(a => {
    if (recFilter && a.ai_recommendation !== recFilter) return false
    if (domainFilter && a.domain_id !== domainFilter) return false
    if (statusFilter === 'pending' && a.recruiter_decision !== null) return false
    if (statusFilter === 'decided' && a.recruiter_decision === null) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    // Pending decisions first, then by submission date
    if (a.recruiter_decision === null && b.recruiter_decision !== null) return -1
    if (a.recruiter_decision !== null && b.recruiter_decision === null) return 1
    return new Date(b.submitted_at ?? b.created_at).getTime() - new Date(a.submitted_at ?? a.created_at).getTime()
  })

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <select className="form-select" style={{ width: 170 }} value={recFilter} onChange={e => setRecFilter(e.target.value)}>
          <option value="">All Recommendations</option>
          <option value="pass">Pass</option>
          <option value="review">Review</option>
          <option value="fail">Fail</option>
        </select>
        <select className="form-select" style={{ width: 170 }} value={domainFilter} onChange={e => setDomainFilter(e.target.value)}>
          <option value="">All Domains</option>
          {Array.from(new Map(assessments.map(a => [a.domain_id, (a as any)._domain_name ?? a.domain_id])).entries())
            .filter(([id]) => id).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <select className="form-select" style={{ width: 170 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Decisions</option>
          <option value="pending">Pending Decision</option>
          <option value="decided">Decided</option>
        </select>
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state">
          <h3>No assessments match filters</h3>
        </div>
      ) : (
        sorted.map(assessment => {
          const recClass = assessment.ai_recommendation ?? 'review'
          return (
            <div
              key={assessment.id}
              className={`card mb-3 assessment-row-${recClass}`}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/recruiter/assessments/${assessment.id}`)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="application-avatar">
                    {assessment.expert?.full_name.split(' ').map(n => n[0]).join('').toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <div className="font-semibold">{assessment.expert?.full_name ?? 'Unknown'}</div>
                    <div className="text-sm text-muted">
                      {assessment.domain_id} · {assessment.difficulty_tier} · {assessment.question_count} questions
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div style={{ textAlign: 'right' }}>
                    <div className="font-bold" style={{ fontSize: 20, color: (assessment.percentage ?? 0) > 70 ? 'var(--color-success)' : (assessment.percentage ?? 0) > 40 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                      {assessment.percentage ?? 0}%
                    </div>
                    <div className="text-xs text-muted">{assessment.total_score}/{assessment.max_possible_score}</div>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    {assessment.ai_recommendation && (
                      <span className={`badge ${assessment.ai_recommendation}`}>
                        AI: {assessment.ai_recommendation.toUpperCase()}
                      </span>
                    )}
                    {assessment.recruiter_decision ? (
                      <span className={`badge ${assessment.recruiter_decision}`}>
                        {assessment.recruiter_decision === 'more_info' ? 'More Info' : assessment.recruiter_decision}
                      </span>
                    ) : (
                      <span className="badge draft">Pending</span>
                    )}
                  </div>

                  {assessment.flag_count > 0 && (
                    <span className="flag-badge">
                      <AlertTriangle size={14} /> {assessment.flag_count} flag{assessment.flag_count > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}