import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertTriangle, X, ChevronLeft } from 'lucide-react'
import { adminApi, type Project, type ProjectTask } from '../../services/api'

export default function CompanyUserProjects() {
  const navigate = useNavigate()
  const { userEmail } = useParams<{ userEmail: string }>()

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [tasksError, setTasksError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!userEmail) {
        setError('User email not provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const result = await adminApi.getProjectsByCreator(userEmail, { limit: 200, offset: 0 })
        setProjects(result.items)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load projects')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userEmail])

  const handleViewProject = async (project: Project) => {
    setSelectedProject(project)
    setProjectTasks([])
    setTasksError(null)

    try {
      setTasksLoading(true)
      const projectId = String(project.ls_project_id ?? project.id ?? '')
      const result = await adminApi.getTasksByProject(projectId, { limit: 200, offset: 0 })
      setProjectTasks(result.items)
    } catch (err) {
      setTasksError(err instanceof Error ? err.message : 'Failed to load project tasks')
    } finally {
      setTasksLoading(false)
    }
  }

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <button
            onClick={() => navigate('/admin/company-users')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              padding: '8px 4px',
              marginRight: '8px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <ChevronLeft size={18} />
            Back
          </button>
          <h1 style={{ display: 'inline' }}>Projects</h1>
          <p>Loading projects for {userEmail}...</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p className="text-muted">Loading projects...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="page-header">
          <button
            onClick={() => navigate('/admin/company-users')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              padding: '8px 4px',
              marginRight: '8px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <ChevronLeft size={18} />
            Back
          </button>
          <h1 style={{ display: 'inline' }}>Projects</h1>
          <p>Error loading projects</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--color-danger-light)' }}>
          <p style={{ color: 'var(--color-danger)' }}>Error: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <button
          onClick={() => navigate('/admin/company-users')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-primary)',
            cursor: 'pointer',
            padding: '8px 4px',
            marginRight: '8px',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <ChevronLeft size={18} />
          Back
        </button>
        <h1 style={{ display: 'inline' }}>Projects</h1>
        <p>{userEmail} • {projects.length} project{projects.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="card">
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0, marginBottom: 0 }}>Projects Created by {userEmail}</h3>
        </div>

        {projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <AlertTriangle size={40} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p className="text-muted">No projects found for this user</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Project Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Project ID</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project, idx) => {
                  const rowBg = idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)'
                  return (
                    <tr
                      key={String(project.id)}
                      style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: rowBg }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-surface)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = rowBg
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{String(project.project_name ?? project.id ?? '-')}</td>
                      <td style={{ padding: '12px 16px' }}>{String(project.ls_project_id ?? '-')}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor: project.status === 'active' ? 'var(--color-success-light)' : 'var(--color-warning-light)',
                            color: project.status === 'active' ? 'var(--color-success-hover)' : 'var(--color-warning-dark)',
                            textTransform: 'capitalize',
                          }}
                        >
                          {String(project.status ?? 'active')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => handleViewProject(project)}
                        >
                          View Tasks
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

      {selectedProject && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedProject(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(1000px, 96vw)',
              maxHeight: '85vh',
              overflow: 'auto',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <h3 style={{ margin: 0 }}>Project Tasks</h3>
                <p style={{ margin: '6px 0 0', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                  {String(selectedProject.project_name ?? selectedProject.id ?? 'Project')} • {projectTasks.length} task{projectTasks.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  background: 'transparent',
                  color: 'var(--color-text)',
                  padding: '6px 8px',
                  cursor: 'pointer',
                }}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {tasksLoading ? (
              <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                <p className="text-muted">Loading tasks...</p>
              </div>
            ) : tasksError ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', background: 'var(--color-danger-light)' }}>
                <p style={{ color: 'var(--color-danger)' }}>Error: {tasksError}</p>
              </div>
            ) : projectTasks.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                <p className="text-muted">No tasks found for this project</p>
              </div>
            ) : (
              <div style={{ padding: '12px 16px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>LS Task ID</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Done By</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Status</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Completed At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectTasks.map((task, idx) => {
                      const rowBg = idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)'
                      const completedAt = task.completed_at ?? task.date_updated ?? task.date_created ?? null
                      const formatted = completedAt ? new Date(String(completedAt)).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'

                      return (
                        <tr key={`task-${String(task.id)}`} style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: rowBg }}>
                          <td style={{ padding: '10px 12px' }}>{String(task.ls_task_id ?? '-')}</td>
                          <td style={{ padding: '10px 12px' }}>{String(task.done_by ?? '-')}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600,
                                backgroundColor: 'var(--color-success-light)',
                                color: 'var(--color-success-hover)',
                                textTransform: 'capitalize',
                              }}
                            >
                              {String(task.status ?? 'completed')}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--color-text-muted)' }}>{formatted}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
