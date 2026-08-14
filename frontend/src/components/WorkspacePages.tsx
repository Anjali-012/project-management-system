import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { createApiClient } from '../api/client'
import type {
  Activity,
  AuthState,
  Project,
  ProjectMember,
  ProjectRole,
  TaskFilters,
  TaskPriority,
  TaskStatus,
} from '../types'
import { formatDate } from '../utils/date'
import { getMemberId, getMemberName } from '../utils/member'
import {
  STATUS_LABELS,
  STATUS_ORDER,
  PRIORITY_LABELS,
  PRIORITY_ORDER,
} from '../constants'
import {
  getAssignableTaskMembers,
  getProjectCapabilities,
  type ProjectCapabilities,
} from '../utils/permissions'
import { TaskBoard } from './TaskBoard/TaskBoard'
import { CreateTaskModal } from './CreateTaskModal'
import { AddMemberModal } from './Members/AddMemberModal'
import type { TaskFormValues } from './TaskForm/TaskForm'
import taskStyles from './Tasks/Tasks.module.css'
import memberStyles from './Members/Members.module.css'
import { CreateProjectModal } from './CreateProjectModal/CreateProjectModal'

type ProjectForm = {
  title: string
  description: string
}

type ProjectsPageProps = {
  projects: Project[]
  selectedProjectId: string
  projectForm: ProjectForm
  setProjectForm: (form: ProjectForm) => void
  onCreateProject: (event: FormEvent) => void
  onSelectProject: (id: string) => void
  canCreateProject: boolean
}

export const ProjectsPage = ({
  projects,
  selectedProjectId,
  projectForm,
  setProjectForm,
  onCreateProject,
  onSelectProject,
  canCreateProject,
}: ProjectsPageProps) => {
  const [createOpen, setCreateOpen] = useState(false)

  const handleCreateProject = (event: FormEvent) => {
    onCreateProject(event)
    setCreateOpen(false)
  }

  return (
    <section className="section-page projects-page">
      {/* ── Page header ── */}
      <div className="page-header page-header-inline">
        <div>
          <p className="section-kicker">Projects</p>
          <h1>Manage and organize your projects.</h1>
        </div>

        {canCreateProject && (
          <button
            type="button"
            className="primary"
            onClick={() => setCreateOpen(true)}
          >
            + New Project
          </button>
        )}
      </div>

      {/* ── Project list ── */}
      <div className="project-card-grid">
        {projects.map((project, index) => (
          <button
            key={project._id}
            type="button"
            className={`project-card ${
              project._id === selectedProjectId ? 'selected' : ''
            }`}
            onClick={() => onSelectProject(project._id)}
          >
            <span className={`project-dot project-dot-${index % 4}`}>
              {project.title[0]?.toUpperCase() || 'P'}
            </span>

            <div>
              <strong>{project.title}</strong>
              <p>{project.description || 'No description yet.'}</p>
              <small>{project.members.length} members</small>
            </div>
          </button>
        ))}
      </div>

      {/* ── Create project modal ── */}
      {createOpen && canCreateProject && (
       <CreateProjectModal
  projectForm={projectForm}
  setProjectForm={setProjectForm}
  onCreateProject={handleCreateProject}
  onClose={() => setCreateOpen(false)}
/>
      )}
    </section>
  )
}

type TasksPageProps = {
  projects: Project[]
  selectedProjectId: string
  selectedProject?: Project
  onSelectProject: (id: string) => void
  taskForm: TaskFormValues
setTaskForm: (form: TaskFormValues) => void
  members: ProjectMember[]
  onCreateTask: (event: FormEvent) => void
  filters: TaskFilters
  onFiltersChange: (filters: TaskFilters) => void
  tasksByStatus: Record<TaskStatus, import('../types').Task[]>
  currentUserId: string
  capabilities: ProjectCapabilities
  onDragStart: (id: string) => void
  onDrop: (status: TaskStatus) => void
  onAssign: TasksPagePropsAssign
  onStatusChange: TasksPagePropsStatus
  onEdit: TasksPagePropsTask
  onDelete: TasksPagePropsTask
  onOpenComments: TasksPagePropsTask
  draggedTaskId: string
}

type Task = import('../types').Task
type TasksPagePropsAssign = (task: Task, memberId: string) => void
type TasksPagePropsStatus = (task: Task, status: TaskStatus) => void
type TasksPagePropsTask = (task: Task) => void

const EMPTY_FILTERS: TaskFilters = {
  search: '',
  status: '',
  priority: '',
  assignedTo: '',
}

export const TasksPage = ({
  projects,
  selectedProjectId,
  selectedProject,
  onSelectProject,
  taskForm,
  setTaskForm,
  members,
  onCreateTask,
  filters,
  onFiltersChange,
  tasksByStatus,
  currentUserId,
  capabilities,
  onDragStart,
  onDrop,
  onAssign,
  onStatusChange,
  onEdit,
  onDelete,
  onOpenComments,
  draggedTaskId,
}: TasksPageProps) => {
  const [createOpen, setCreateOpen] = useState(false)
  const hasActiveFilters =
    filters.search ||
    filters.status ||
    filters.priority ||
    filters.assignedTo

  const { canCreateTask } = capabilities

  const handleCreate = (e: FormEvent) => {
    onCreateTask(e)
    setCreateOpen(false)
  }

  return (
    <section className="section-page tasks-page">
      {/* ── Toolbar ── */}
      <div className={taskStyles.toolbar}>
        <select
          className={taskStyles.projectSelect}
          value={selectedProjectId}
          onChange={(e) => onSelectProject(e.target.value)}
          disabled={projects.length === 0}
          aria-label="Select project"
        >
          {projects.length === 0 && <option value="">No projects</option>}

          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.title}
            </option>
          ))}
        </select>

        {selectedProject && (
          <>
            <div className={taskStyles.divider} aria-hidden="true" />

            <input
              className={taskStyles.search}
              placeholder="Search tasks…"
              value={filters.search}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  search: e.target.value,
                })
              }
            />

            <select
              className={taskStyles.filterSelect}
              value={filters.status}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  status: e.target.value as TaskStatus | '',
                })
              }
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>

              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>

            <select
              className={taskStyles.filterSelect}
              value={filters.priority}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  priority: e.target.value as TaskPriority | '',
                })
              }
              aria-label="Filter by priority"
            >
              <option value="">All priorities</option>

              {PRIORITY_ORDER.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>

            <select
              className={taskStyles.filterSelect}
              value={filters.assignedTo}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  assignedTo: e.target.value,
                })
              }
              aria-label="Filter by assignee"
            >
              <option value="">All members</option>

              {getAssignableTaskMembers(members).map((m) => (
                <option
                  key={getMemberId(m)}
                  value={getMemberId(m)}
                >
                  {getMemberName(m)}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                className={taskStyles.clearBtn}
                onClick={() => onFiltersChange(EMPTY_FILTERS)}
              >
                Clear
              </button>
            )}
          </>
        )}

        <div className={taskStyles.spacer} />

        {selectedProject && canCreateTask && (
          <button
            type="button"
            className={taskStyles.createBtn}
            onClick={() => setCreateOpen(true)}
          >
            + Create New Task
          </button>
        )}
      </div>

      {/* ── Board or empty state ── */}
      {selectedProject ? (
        <TaskBoard
          tasksByStatus={tasksByStatus}
          members={members}
          currentUserId={currentUserId}
          capabilities={capabilities}
          draggedTaskId={draggedTaskId}
          onDragStart={onDragStart}
          onDrop={onDrop}
          onAssign={onAssign}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
          onDelete={onDelete}
          onOpenComments={onOpenComments}
        />
      ) : (
        <div className={taskStyles.emptyState}>
          <strong>No projects yet</strong>
          <p>No accessible projects are available yet.</p>
        </div>
      )}

      {/* ── Create task modal ── */}
      {createOpen && canCreateTask && (
        <CreateTaskModal
          taskForm={taskForm}
          setTaskForm={setTaskForm}
          members={members}
          onCreateTask={handleCreate}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </section>
  )
}

type MembersPageProps = {
  auth: AuthState
  projects: Project[]
  selectedProjectId: string
  onSelectProject: (id: string) => void
  projectMembers: ProjectMember[]
  memberEmail: string
  memberRole: ProjectRole
  setMemberEmail: (value: string) => void
  setMemberRole: (role: ProjectRole) => void
  onAddMember: (event: FormEvent) => void
  onChangeMemberRole: (userId: string, role: ProjectRole) => void
  onRemoveMember: (userId: string) => void
}

const ROLE_CLASS: Record<ProjectRole, string> = {
  owner: memberStyles.roleOwner,
  manager: memberStyles.roleManager,
  member: memberStyles.roleMember,
  viewer: memberStyles.roleViewer,
}

export const MembersPage = ({
  auth,
  projects,
  selectedProjectId,
  onSelectProject,
  projectMembers,
  memberEmail,
  memberRole,
  setMemberEmail,
  setMemberRole,
  onAddMember,
  onChangeMemberRole,
  onRemoveMember,
}: MembersPageProps) => {
  const [inviteOpen, setInviteOpen] = useState(false)
  const selectedProject = projects.find(
    (p) => p._id === selectedProjectId,
  )

  const currentUserMember = projectMembers.find(
    (m) => m._id === auth.user.id,
  )

  const {
    canManageMembers,
    canAssignRoles,
    assignableRoles,
  } = getProjectCapabilities(
    currentUserMember?.projectRole ?? null,
    auth.user.role,
  )

  const handleInvite = (e: FormEvent) => {
    onAddMember(e)
    setInviteOpen(false)
  }

  useEffect(() => {
    if (
      assignableRoles.length > 0 &&
      !assignableRoles.includes(memberRole)
    ) {
      setMemberRole(assignableRoles[0])
    }
  }, [assignableRoles, memberRole, setMemberRole])

  return (
    <section className="section-page members-page">
      <div className="page-header">
        <div>
          <p className="section-kicker">Members</p>
          <h1>Manage the people working on your projects.</h1>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className={memberStyles.toolbar}>
        <select
          className={memberStyles.projectSelect}
          value={selectedProjectId}
          onChange={(e) => onSelectProject(e.target.value)}
          disabled={projects.length === 0}
          aria-label="Select project"
        >
          {projects.length === 0 && (
            <option value="">No projects</option>
          )}

          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.title}
            </option>
          ))}
        </select>

        <div className={memberStyles.spacer} />

        {selectedProject && canManageMembers && (
          <button
            type="button"
            className={`primary ${memberStyles.inviteBtn}`}
            onClick={() => setInviteOpen(true)}
          >
            + Invite Member
          </button>
        )}
      </div>

      {/* ── Member list ── */}
      {selectedProject ? (
        projectMembers.length === 0 ? (
          <p className={memberStyles.empty}>No members found.</p>
        ) : (
          <div className={memberStyles.memberList}>
            {projectMembers.map((m) => (
              <div
                key={m._id}
                className={memberStyles.memberRow}
              >
                <span className={memberStyles.avatar}>
                  {m.name[0]?.toUpperCase() || '?'}
                </span>

                <div className={memberStyles.info}>
                  <div className={memberStyles.name}>
                    {m.name}
                  </div>

                  <div className={memberStyles.email}>
                    {m.email}
                  </div>
                </div>

                {m.projectRole === 'manager' ||
                !canAssignRoles ||
                m._id === auth.user.id ? (
                  <span
                    className={`${memberStyles.roleBadge} ${
                      ROLE_CLASS[m.projectRole]
                    }`}
                  >
                    {m.projectRole}
                  </span>
                ) : (
                  <select
                    className={memberStyles.roleSelect}
                    value={m.projectRole}
                    aria-label={`Role for ${m.name}`}
                    onChange={(e) =>
                      onChangeMemberRole(
                        m._id,
                        e.target.value as ProjectRole,
                      )
                    }
                  >
                    {assignableRoles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                )}

                {m.projectRole !== 'manager' &&
                  canManageMembers &&
                  m._id !== auth.user.id && (
                    <button
                      type="button"
                      className={memberStyles.removeBtn}
                      aria-label={`Remove ${m.name}`}
                      onClick={() => onRemoveMember(m._id)}
                    >
                      ✕
                    </button>
                  )}
              </div>
            ))}
          </div>
        )
      ) : (
        <p className={memberStyles.empty}>
          Select a project to view members.
        </p>
      )}

      {/* ── Invite modal ── */}
      {inviteOpen && canManageMembers && (
        <AddMemberModal
          email={memberEmail}
          role={memberRole}
          assignableRoles={assignableRoles}
          onEmailChange={setMemberEmail}
          onRoleChange={setMemberRole}
          onSubmit={handleInvite}
          onClose={() => setInviteOpen(false)}
        />
      )}
    </section>
  )
}

type ActivityPageProps = {
  auth: AuthState
  projects: Project[]
}

export const ActivityPage = ({
  auth,
  projects,
}: ActivityPageProps) => {
  const [projectFilter, setProjectFilter] =
    useState<string>('all')

  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)

  const { request } = useMemo(
    () => createApiClient(auth.token),
    [auth.token],
  )

  useEffect(() => {
    const url =
      projectFilter === 'all'
        ? '/api/activity'
        : `/api/activity/${projectFilter}`

    let cancelled = false

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)

    request<{ data: Activity[] }>(url)
      .then((body) => {
        if (!cancelled) {
          setActivities(body.data)
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [projectFilter, request])

  return (
    <section className="section-page activity-page">
      <div className="page-header page-header-inline">
        <div>
          <p className="section-kicker">Activity</p>
          <h1>
            Track recent changes across your workspace.
          </h1>
        </div>

        <label className="project-selector">
          <span>Project</span>

          <div className="project-selector-control">
            <i className="project-selector-dot" />

            <select
              value={projectFilter}
              onChange={(e) =>
                setProjectFilter(e.target.value)
              }
            >
              <option value="all">All Projects</option>

              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </label>
      </div>

      <div className="activity-page-list">
        {loading ? (
          <p className="empty">Loading...</p>
        ) : activities.length === 0 ? (
          <p className="empty">No activity yet.</p>
        ) : (
          activities.map((activity) => (
            <article
              className="activity-row"
              key={activity._id}
            >
              <span className="activity-icon">
                {activity.action[0]?.toUpperCase() || 'A'}
              </span>

              <div>
                <strong>
                  {activity.action.replaceAll('_', ' ')}
                </strong>

                <small>
                  {activity.user?.name || 'System'} -{' '}
                  {formatDate(activity.createdAt)}
                </small>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}

export const PlaceholderPage = ({
  title,
}: {
  title: string
}) => (
  <section className="section-page">
    <div className="page-header">
      <div>
        <p className="section-kicker">{title}</p>
        <h1>{title}</h1>
        <p>
          This section is ready for existing{' '}
          {title.toLowerCase()} functionality when available.
        </p>
      </div>
    </div>
  </section>
)
