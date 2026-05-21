import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Clock, CheckCircle, AlertTriangle, TrendingUp, Filter, ChevronRight, Check, Mail } from 'lucide-react'
import { recruiterApi, adminApi } from '../../services/api'
import type { Assessment, Domain, Subdomain } from '../../types'

type StatusFilter = 'all' | 'assigned' | 'in_progress' | 'submitted' | 'graded' | 'reviewed'
type RecommendationFilter = 'all' | 'pass' | 'review' | 'fail'
type DecisionFilter = 'all' | 'approved' | 'rejected' | 'more_info' | 'pending'

export default function Assignments() {
  const navigate = useNavigate()
  
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [domains, setDomains] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [recommendationFilter, setRecommendationFilter] = useState<RecommendationFilter>('all')
  const [decisionFilter, setDecisionFilter] = useState<DecisionFilter>('all')
  const [domainFilter, setDomainFilter] = useState<string>('all')
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null)
  const [sentEmailId, setSentEmailId] = useState<string | null>(null)

  const handleSendTestLink = async (id: string) => {
    setSendingEmailId(id)
    try {
      await recruiterApi.sendTestLink(id)
      setSentEmailId(id)
      setTimeout(() => setSentEmailId(eid => eid === id ? null : eid), 3000)
    } catch {
      // silent fail – button reverts
    } finally {
      setSendingEmailId(null)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load domains
        const { domains: domainsData } = await adminApi.getDomains()
        const domainMap = domainsData.reduce((acc, d) => {
          acc[d.id] = d.name
          return acc
        }, {} as Record<string, string>)
        setDomains(domainMap)

        // Load assessments
        const { assessments: assessmentsData } = await recruiterApi.getAssessments({
          limit: 500,
        })
        setAssessments(assessmentsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assessments')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string; icon: typeof Clock }> = {
      assigned: { bg: 'var(--color-warning-light)', text: 'var(--color-warning-dark)', icon: Clock },
      in_progress: { bg: 'var(--color-info-light)', text: 'var(--color-info)', icon: TrendingUp },
      submitted: { bg: 'var(--color-primary-light)', text: 'var(--color-primary-dark)', icon: AlertTriangle },
      graded: { bg: 'var(--color-danger-light)', text: 'var(--color-danger)', icon: AlertTriangle },
      reviewed: { bg: 'var(--color-success-light)', text: 'var(--color-success-hover)', icon: CheckCircle },
    }
    return colors[status] || { bg: 'var(--color-bg)', text: 'var(--color-text)', icon: Clock }
  }

  const getRecommendationColor = (rec: string | null) => {
    if (!rec) return { bg: 'var(--color-bg)', text: 'var(--color-text-muted)', label: '-' }
    const colors: Record<string, { bg: string; text: string; label: string }> = {
      pass: { bg: 'var(--color-success-light)', text: 'var(--color-success-hover)', label: '✓ Pass' },
      fail: { bg: 'var(--color-danger-light)', text: 'var(--color-danger)', label: '✗ Fail' },
      review: { bg: 'var(--color-warning-light)', text: 'var(--color-warning-dark)', label: '⚠ Review' },
    }
    return colors[rec] || { bg: 'var(--color-bg)', text: 'var(--color-text-muted)', label: rec }
  }

  const getDecisionColor = (dec: string | null) => {
    if (!dec) return { bg: 'var(--color-bg)', text: 'var(--color-text-muted)', label: 'Pending' }
    const colors: Record<string, { bg: string; text: string; label: string }> = {
      approved: { bg: 'var(--color-success-light)', text: 'var(--color-success-hover)', label: '✓ Pass' },
      rejected: { bg: 'var(--color-danger-light)', text: 'var(--color-danger)', label: '✗ Fail' },
      more_info: { bg: 'var(--color-warning-light)', text: 'var(--color-warning-dark)', label: '⏳ More Info' },
    }
    return colors[dec] || { bg: 'var(--color-bg)', text: 'var(--color-text-muted)', label: dec }
  }

  const filteredAssessments = assessments.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false
    if (recommendationFilter !== 'all' && a.ai_recommendation !== recommendationFilter) return false
    if (decisionFilter !== 'all') {
      if (decisionFilter === 'pending' && a.recruiter_decision !== null) return false
      if (decisionFilter !== 'pending' && a.recruiter_decision !== decisionFilter) return false
    }
    if (domainFilter !== 'all' && a.domain_id !== domainFilter) return false
    return true
  })

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1>Assessments</h1>
          <p>Manage and review expert assessments</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p className="text-muted">Loading assessments...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        {/* <div className="page-header">
          <h1>Assessments</h1>
          <p>Manage and review expert assessments</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--color-danger-light)' }}>
          <p style={{ color: 'var(--color-danger)' }}>Error: {error}</p>
        </div> */}
      </div>
    )
  }

  return (
    <div>
      {/* <div className="page-header">
        <h1>Assessments</h1>
        <p>Manage and review expert assessments</p>
      </div> */}

      <div className="card">
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ marginTop: 0, marginBottom: 0 }}>Assessments</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span className="text-muted" style={{ fontSize: '14px' }}>
              Showing {filteredAssessments.length} assessments
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-text)',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Status</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted">Submitted</option>
              <option value="graded">Graded</option>
              <option value="reviewed">Reviewed</option>
            </select>

            <select
              value={recommendationFilter}
              onChange={(e) => setRecommendationFilter(e.target.value as RecommendationFilter)}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-text)',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <option value="all">AI Recommendation</option>
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
              <option value="review">Review</option>
            </select>

            <select
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value as DecisionFilter)}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-text)',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <option value="all">Recruiter Decision</option>
              <option value="approved">Pass</option>
              <option value="rejected">Fail</option>
              <option value="more_info">More Info</option>
              <option value="pending">Pending</option>
            </select>

            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-text)',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Domains</option>
              {Object.entries(domains).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
            </div>
          </div>
        </div>

        {filteredAssessments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <AlertTriangle size={40} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p className="text-muted">No assignments found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px',
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Expert</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Domain</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Score</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Recommendation</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Decision</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Assigned</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssessments.map((assessment, idx) => {
                  const statusMeta = getStatusColor(assessment.status)
                  const recMeta = getRecommendationColor(assessment.ai_recommendation)
                  const decMeta = getDecisionColor(assessment.recruiter_decision)
                  const assignedDate = new Date(assessment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })

                  return (
                    <tr
                      key={assessment.id}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)' }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600 }}>{assessment.expert?.full_name || 'Unknown'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{assessment.expert?.email || '-'}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div>{domains[assessment.domain_id] || 'N/A'}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: statusMeta.bg,
                          color: statusMeta.text,
                          textTransform: 'capitalize',
                        }}>
                          <statusMeta.icon size={14} />
                          {assessment.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600 }}>
                          {assessment.total_score !== null ? `${assessment.total_score} / ${assessment.max_possible_score}` : '-'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          {assessment.percentage !== null ? `${assessment.percentage}%` : '-'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: recMeta.bg,
                          color: recMeta.text,
                        }}>
                          {recMeta.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: decMeta.bg,
                          color: decMeta.text,
                        }}>
                          {decMeta.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '13px' }}>{assignedDate}</div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => navigate(`/recruiter/assessments/${assessment.id}`)}
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                          >
                            <Eye size={13} /> View
                          </button>
                          {(assessment.status === 'assigned' || assessment.status === 'in_progress') && (
                            <>
                            <button
                              onClick={() => handleSendTestLink(assessment.id)}
                              title="Email test link to candidate"
                              disabled={sendingEmailId === assessment.id}
                              style={{
                                background: sentEmailId === assessment.id ? 'var(--color-success)' : 'var(--color-primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 10px',
                                cursor: sendingEmailId === assessment.id ? 'default' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px',
                                fontWeight: 500,
                                transition: 'all 0.15s',
                                opacity: sendingEmailId === assessment.id ? 0.7 : 1,
                              }}
                            >
                              {sentEmailId === assessment.id
                                ? <><Check size={13} /> Sent</>
                                : sendingEmailId === assessment.id
                                  ? <><Mail size={13} /> Sending…</>
                                  : <><Mail size={13} /> Email</>
                              }
                            </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
