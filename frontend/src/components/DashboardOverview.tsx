import { useState } from 'react'
import type { Activity, Member, Notification, Project, Task } from '../types'
import { formatDate } from '../utils/date'
import { getMemberName } from '../utils/member'
import { PresencePill } from './PresencePill'

type Props = {
  userName: string
  selectedProject?: Project
  tasks: Task[]
  members: Array<Member | string>
  activities: Activity[]
  notifications: Notification[]
  onOpenTasks: () => void
  onOpenMembers: () => void
}

export const DashboardOverview = ({
  userName,
  selectedProject,
  tasks,
  members,
  activities,
  notifications,
  onOpenTasks,
  onOpenMembers,
}: Props) => {
  const [renderedAt] = useState(() => Date.now())
  const dueSoonCount = tasks.filter((task) => {
    if (!task.dueDate || task.status === 'done') return false
    const due = new Date(task.dueDate).getTime()
    return due >= renderedAt && due - renderedAt <= 7 * 86_400_000
  }).length

  const stats = [
    { label: 'Total Tasks', value: tasks.length, hint: 'All tasks in project', icon: '□', tone: 'purple' },
    { label: 'In Progress', value: tasks.filter((task) => task.status === 'in-progress').length, hint: 'Tasks in progress', icon: '▣', tone: 'amber' },
    { label: 'Completed', value: tasks.filter((task) => task.status === 'done').length, hint: 'Tasks completed', icon: '✓', tone: 'green' },
    { label: 'Due Soon', value: dueSoonCount, hint: 'Tasks due this week', icon: '◷', tone: 'blue' },
  ]

  return (
    <section className="dashboard-overview">
      <div className="hero-actions-row">
        <article className="project-hero">
          <div className="project-hero-copy">
            <p className="hero-greeting">Good to see you, {userName}!</p>
            <h1>{selectedProject?.title || 'Select a project'}</h1>
            <p>{selectedProject?.description || 'Create or choose a project to begin.'}</p>

            {selectedProject && (
              <div className="hero-members">
                <PresencePill
                  users={members.map((member, index) => ({
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
              <span />
              <span />
              <span />
              <div className="mini-row mini-row-short" />
              <div className="mini-chart">
                <i />
                <i />
                <i />
              </div>
              <div className="mini-row" />
            </div>
            <div className="mini-leaf" />
          </div>
        </article>

        {selectedProject && (
          <aside className="quick-actions">
            <h2>Quick Actions</h2>
            <button type="button" className="quick-primary" onClick={onOpenTasks}>
              <span>+</span>
              Create New Task
            </button>
            <button type="button" className="quick-secondary" onClick={onOpenMembers}>
              Invite Member
            </button>
          </aside>
        )}
      </div>

      {selectedProject && (
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
