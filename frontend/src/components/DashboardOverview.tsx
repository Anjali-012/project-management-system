import { useEffect, useMemo, useState } from 'react'
import { createApiClient } from '../api/client'
import type { Activity, AuthState, Notification, Project, ProjectMember, ProjectRole, Task } from '../types'
import { formatDate } from '../utils/date'
import { getMemberName } from '../utils/member'
import { getProjectCapabilities } from '../utils/permissions'
import { PresencePill } from './PresencePill/PresencePill'

type Props = {
  auth: AuthState
  projects: Project[]
  notifications: Notification[]
  onOpenTasks: () => void
  onOpenMembers: () => void
}

export const DashboardOverview = ({
  auth,
  projects,
  notifications,
  onOpenTasks,
  onOpenMembers,
}: Props) => {
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [tasks, setTasks] = useState<Task[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)
  const [scopedProjectRole, setScopedProjectRole] = useState<ProjectRole | null>(null)

  const { request } = useMemo(() => createApiClient(auth.token), [auth.token])

  useEffect(() => {
    const url = projectFilter === 'all'
      ? '/api/dashboard'
      : `/api/dashboard?projectId=${projectFilter}`
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    request<{ data: { tasks: Task[]; activities: Activity[] } }>(url)
      .then((body) => {
        if (cancelled) return
        setTasks(body.data.tasks)
        setActivities(body.data.activities.slice(0, 8))
      })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [projectFilter, request])

  useEffect(() => {
    if (projectFilter === 'all') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScopedProjectRole(null)
      return
    }

    let cancelled = false
    request<{ data: ProjectMember[] }>(`/api/projects/${projectFilter}/members`)
      .then((body) => {
        if (cancelled) return
        const me = body.data.find((member) => member._id === auth.user.id)
        setScopedProjectRole(me?.projectRole ?? null)
      })
      .catch(() => {
        if (!cancelled) setScopedProjectRole(null)
      })

    return () => { cancelled = true }
  }, [auth.user.id, projectFilter, request])

  const scopedCapabilities = getProjectCapabilities(
    projectFilter === 'all' ? null : scopedProjectRole,
    auth.user.role,
  )

  const [renderedAt] = useState(() => Date.now())
  const dueSoonCount = tasks.filter((task) => {
    if (!task.dueDate || task.status === 'done') return false
    const due = new Date(task.dueDate).getTime()
    return due >= renderedAt && due - renderedAt <= 7 * 86_400_000
  }).length

  const selectedProject = projects.find((p) => p._id === projectFilter)
  const displayMembers = selectedProject?.members ?? []

  const stats = [
    { label: 'Total Tasks', value: tasks.length, hint: 'All tasks in scope', icon: '□', tone: 'purple' },
    { label: 'In Progress', value: tasks.filter((t) => t.status === 'in-progress').length, hint: 'Tasks in progress', icon: '▣', tone: 'amber' },
    { label: 'Completed', value: tasks.filter((t) => t.status === 'done').length, hint: 'Tasks completed', icon: '✓', tone: 'green' },
    { label: 'Due Soon', value: dueSoonCount, hint: 'Tasks due this week', icon: '◷', tone: 'blue' },
  ]

  const heroTitle = projectFilter === 'all' ? 'All Projects' : (selectedProject?.title ?? 'Dashboard')
  const heroDesc = projectFilter === 'all'
    ? 'Showing combined data across all your projects.'
    : (selectedProject?.description || 'No description yet.')

  const showCreateTask = projectFilter !== 'all' && scopedCapabilities.canCreateTask
  const showInviteMember = projectFilter !== 'all' && scopedCapabilities.canManageMembers

  return (
    <section className="dashboard-overview">
      <div className="hero-actions-row">
        <article className="project-hero">
          <div className="project-hero-copy">
            <p className="hero-greeting">Good to see you, {auth.user.name}!</p>
            <h1>{heroTitle}</h1>
            <p>{heroDesc}</p>

            {selectedProject && (
              <div className="hero-members">
                <PresencePill
                  users={displayMembers.map((member, index) => ({
                    id: typeof member === 'string' ? `${member}-${index}` : member.id || member._id || `${index}`,
                    name: getMemberName(member),
                  }))}
                />
                <span>{selectedProject.members.length} members</span>
              </div>
            )}
          </div>

          <div className="hero-illustration" aria-hidden="true">
            <div className="mini-window">
              <span /><span /><span />
              <div className="mini-row mini-row-short" />
              <div className="mini-chart"><i /><i /><i /></div>
              <div className="mini-row" />
            </div>
            <div className="mini-leaf" />
          </div>
        </article>

        <aside className="quick-actions">
          <h2>Quick Actions</h2>
          <label className="project-selector" style={{ marginBottom: '0.75rem' }}>
            <span>Scope</span>
            <div className="project-selector-control">
              <i className="project-selector-dot" />
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
              >
                <option value="all">All Projects</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.title}</option>
                ))}
              </select>
            </div>
          </label>
          {showCreateTask && (
            <button type="button" className="quick-primary" onClick={onOpenTasks}>
              <span>+</span>
              Create New Task
            </button>
          )}
          {showInviteMember && (
            <button type="button" className="quick-secondary" onClick={onOpenMembers}>
              Invite Member
            </button>
          )}
        </aside>
      </div>

      {loading ? (
        <p className="empty">Loading...</p>
      ) : (
        <>
          <div className="stats-grid">
            {stats.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <span className={`stat-icon stat-${stat.tone}`}>{stat.icon}</span>
                <div>
                  <h2>{stat.label}</h2>
                  <strong>{stat.value}</strong>
                  <p>{stat.hint}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="dashboard-summary-grid">
            <article className="summary-panel">
              <div className="summary-panel-head">
                <h2>Recent Tasks</h2>
                <button type="button" onClick={onOpenTasks}>View tasks</button>
              </div>
              <div className="summary-list">
                {tasks.slice(0, 4).length === 0 ? (
                  <p className="empty-inline">No tasks yet.</p>
                ) : (
                  tasks.slice(0, 4).map((task) => (
                    <div className="summary-item" key={task._id}>
                      <span className={`summary-status status-${task.status}`} />
                      <div>
                        <strong>{task.title}</strong>
                        <small>{task.assignedTo?.name || 'Unassigned'} · {task.status.replace('-', ' ')}</small>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="summary-panel">
              <div className="summary-panel-head">
                <h2>Recent Work</h2>
              </div>
              <div className="summary-list">
                {[...notifications.slice(0, 2), ...activities.slice(0, 2)].length === 0 ? (
                  <p className="empty-inline">No recent updates yet.</p>
                ) : (
                  <>
                    {notifications.slice(0, 2).map((notification) => (
                      <div className="summary-item" key={notification._id}>
                        <span className="summary-status status-notification" />
                        <div>
                          <strong>{notification.message}</strong>
                          <small>{formatDate(notification.createdAt)}</small>
                        </div>
                      </div>
                    ))}
                    {activities.slice(0, 2).map((activity) => (
                      <div className="summary-item" key={activity._id}>
                        <span className="summary-status status-activity" />
                        <div>
                          <strong>{activity.action.replaceAll('_', ' ')}</strong>
                          <small>{activity.user?.name || 'System'} · {formatDate(activity.createdAt)}</small>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </article>
          </div>
        </>
      )}
    </section>
  )
}
