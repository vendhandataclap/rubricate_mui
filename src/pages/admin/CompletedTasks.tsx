import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, X } from 'lucide-react'
import { adminApi, type CompletedTask } from '../../services/api'

interface TaskGroup {
  key: string
  doneBy: string
  tasks: CompletedTask[]
}

export default function CompletedTasks() {
  const [tasks, setTasks] = useState<CompletedTask[]>([])
  const [selectedGroup, setSelectedGroup] = useState<TaskGroup | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await adminApi.getCompletedTasks({ limit: 200, offset: 0 })
        setTasks(result.items)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load completed tasks')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const taskCount = useMemo(() => tasks.length, [tasks])

  const groupedTasks = useMemo<TaskGroup[]>(() => {
    const groups = new Map<string, TaskGroup>()

    for (const task of tasks) {
      const doneByRaw = String(task.done_by ?? '').trim()
      const doneBy = doneByRaw || 'Unassigned'
      const key = doneBy.toLowerCase()

      const current = groups.get(key)
      if (current) {
        current.tasks.push(task)
      } else {
        groups.set(key, { key, doneBy, tasks: [task] })
      }
    }

    return Array.from(groups.values()).sort((a, b) => b.tasks.length - a.tasks.length)
  }, [tasks])

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1>Completed Tasks</h1>
          <p>Loading tasks with status completed...</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p className="text-muted">Loading completed tasks...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="page-header">
          <h1>Completed Tasks</h1>
          <p>Tasks filtered by status completed</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--color-danger-light)' }}>
          <p style={{ color: 'var(--color-danger)' }}>Error: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="card">
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ marginTop: 0, marginBottom: 0 }}>Completed Tasks</h3>
          <span className="text-muted" style={{ fontSize: '14px' }}>
            Showing {taskCount} tasks
          </span>
        </div>

        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <AlertTriangle size={40} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p className="text-muted">No completed tasks found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Expert Email ID</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Count of Task Completed</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {groupedTasks.map((group, idx) => {
                  const rowBg = idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)'

                  return (
                    <tr
                      key={`group-${group.key}`}
                      style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: rowBg }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-surface)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = rowBg
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{group.doneBy}</td>
                      <td style={{ padding: '12px 16px' }}>{group.tasks.length}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => setSelectedGroup(group)}
                        >
                          View
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

      {selectedGroup && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedGroup(null)}
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
                <h3 style={{ margin: 0 }}>Completed Tasks Details</h3>
                <p style={{ margin: '6px 0 0', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                  {selectedGroup.doneBy} • {selectedGroup.tasks.length} task{selectedGroup.tasks.length > 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setSelectedGroup(null)}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  background: 'transparent',
                  color: 'var(--color-text)',
                  padding: '6px 8px',
                  cursor: 'pointer',
                }}
                aria-label="Close details"
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '12px 16px 16px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>LS Task ID</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Project ID</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '12px' }}>Completed At</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedGroup.tasks.map((task, idx) => {
                    const rowBg = idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)'
                    const completedAt = task.completed_at ?? task.date_updated ?? task.date_created ?? null
                    const formatted = completedAt ? new Date(String(completedAt)).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'
                    return (
                      <tr key={`modal-task-${selectedGroup.key}-${String(task.id)}`} style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: rowBg }}>
                        <td style={{ padding: '10px 12px' }}>{String(task.ls_task_id ?? '-')}</td>
                        <td style={{ padding: '10px 12px' }}>{String(task.project_id ?? '-')}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--color-text-muted)' }}>{formatted}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
