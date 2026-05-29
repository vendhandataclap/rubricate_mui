import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
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

        const result = await adminApi.getCompletedTasks({
          limit: 200,
          offset: 0,
        })

        setTasks(result.items)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load completed tasks'
        )
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
        groups.set(key, {
          key,
          doneBy,
          tasks: [task],
        })
      }
    }

    return Array.from(groups.values()).sort(
      (a, b) => b.tasks.length - a.tasks.length
    )
  }, [tasks])

  if (loading) {
    return (
      <div className="card">
        <h2>Completed Tasks</h2>

        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: '#888',
          }}
        >
          Loading completed tasks...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <h2>Completed Tasks</h2>

        <div
          style={{
            padding: '40px',
            borderRadius: '12px',
            background: '#1a0f0f',
            color: '#ff6b6b',
          }}
        >
          Error: {error}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* MAIN CARD */}
      <div
        style={{
          background: '#050505',
          border: '1px solid #151515',
          borderRadius: '18px',
          padding: '24px',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '30px',
                color: '#fff',
              }}
            >
              Completed Tasks
            </h2>

            <p
              style={{
                marginTop: '6px',
                color: '#777',
                fontSize: '14px',
              }}
            >
              Track all completed expert tasks
            </p>
          </div>

          <div
            style={{
              background: '#111',
              border: '1px solid #222',
              padding: '10px 16px',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            {taskCount} Tasks
          </div>
        </div>

        {/* EMPTY */}
        {tasks.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: '#777',
            }}
          >
            <AlertTriangle
              size={42}
              style={{
                opacity: 0.3,
                marginBottom: '12px',
              }}
            />

            <p>No completed tasks found</p>
          </div>
        ) : (
          <div
            style={{
              overflowX: 'auto',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: '0 10px',
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '12px',
                      color: '#666',
                      fontSize: '12px',
                    }}
                  >
                    Expert Email
                  </th>

                  <th
                    style={{
                      textAlign: 'left',
                      padding: '12px',
                      color: '#666',
                      fontSize: '12px',
                    }}
                  >
                    Completed Count
                  </th>

                  <th
                    style={{
                      textAlign: 'center',
                      padding: '12px',
                      color: '#666',
                      fontSize: '12px',
                    }}
                  >
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {groupedTasks.map((group) => (
                  <tr
                    key={group.key}
                    style={{
                      background: '#0d0d0d',
                    }}
                  >
                    <td
                      style={{
                        padding: '18px',
                        borderTopLeftRadius: '14px',
                        borderBottomLeftRadius: '14px',
                        color: '#fff',
                        fontWeight: 600,
                      }}
                    >
                      {group.doneBy}
                    </td>

                    <td
                      style={{
                        padding: '18px',
                        color: '#aaa',
                      }}
                    >
                      {group.tasks.length}
                    </td>

                    <td
                      style={{
                        padding: '18px',
                        textAlign: 'center',
                        borderTopRightRadius: '14px',
                        borderBottomRightRadius: '14px',
                      }}
                    >
                      <button
                        onClick={() => setSelectedGroup(group)}
                        style={{
                          background: '#fff',
                          color: '#000',
                          border: 'none',
                          padding: '8px 18px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '13px',
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL */}
      {selectedGroup && (
        <div
          onClick={() => setSelectedGroup(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.78)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '24px',
          }}
        >
          {/* MODAL CARD */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '1100px',
              maxHeight: '85vh',
              overflow: 'hidden',
              background: '#0b0b0b',
              border: '1px solid #1d1d1d',
              borderRadius: '24px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* MODAL HEADER */}
            <div
              style={{
                padding: '22px 26px',
                borderBottom: '1px solid #1a1a1a',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    color: '#fff',
                    fontSize: '24px',
                  }}
                >
                  Completed Task Details
                </h2>

                <p
                  style={{
                    marginTop: '8px',
                    color: '#777',
                    fontSize: '14px',
                  }}
                >
                  {selectedGroup.doneBy} •{' '}
                  {selectedGroup.tasks.length} tasks
                </p>
              </div>

              <button
                onClick={() => setSelectedGroup(null)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  border: '1px solid #222',
                  background: '#111',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div
              style={{
                overflowY: 'auto',
                padding: '20px',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'separate',
                  borderSpacing: '0 10px',
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '12px',
                        color: '#666',
                        fontSize: '12px',
                      }}
                    >
                      LS Task ID
                    </th>

                    <th
                      style={{
                        textAlign: 'left',
                        padding: '12px',
                        color: '#666',
                        fontSize: '12px',
                      }}
                    >
                      Project ID
                    </th>

                    <th
                      style={{
                        textAlign: 'left',
                        padding: '12px',
                        color: '#666',
                        fontSize: '12px',
                      }}
                    >
                      Completed At
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {selectedGroup.tasks.map((task) => {
                    const completedAt =
                      task.completed_at ??
                      task.date_updated ??
                      task.date_created

                    const formatted = completedAt
                      ? new Date(
                          String(completedAt)
                        ).toLocaleString()
                      : '-'

                    return (
                      <tr
                        key={String(task.id)}
                        style={{
                          background: '#111',
                        }}
                      >
                        <td
                          style={{
                            padding: '16px',
                            borderTopLeftRadius: '12px',
                            borderBottomLeftRadius: '12px',
                            color: '#fff',
                          }}
                        >
                          {String(task.ls_task_id ?? '-')}
                        </td>

                        <td
                          style={{
                            padding: '16px',
                            color: '#ddd',
                          }}
                        >
                          {String(task.project_id ?? '-')}
                        </td>

                        <td
                          style={{
                            padding: '16px',
                            borderTopRightRadius: '12px',
                            borderBottomRightRadius: '12px',
                            color: '#888',
                          }}
                        >
                          {formatted}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  )
}