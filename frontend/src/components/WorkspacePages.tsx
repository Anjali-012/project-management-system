import type { FormEvent } from 'react'
import type { Activity, Member, Project, TaskFilters, TaskStatus } from '../types'
import { formatDate } from '../utils/date'
import { getMemberId, getMemberName } from '../utils/member'
import { TaskBoard } from './TaskBoard'
import { TaskComposer, type TaskForm } from './TaskComposer'
import { TaskFiltersBar } from './TaskFiltersBar'

type ProjectForm = { title: string; description: string }

const EMPTY_FILTERS: TaskFilters = { search: '', status: '', priority: '', assignedTo: '' }

type ProjectsPageProps = {
  projects: Project[]
  selectedProjectId: string
  projectForm: ProjectForm
  setProjectForm: (form: ProjectForm) => void
  onCreateProject: (event: FormEvent) => void
  onSelectProject: (id: string) => void
}

export const ProjectsPage = ({
  projects,
  selectedProjectId,
  projectForm,
  setProjectForm,
  onCreateProject,
  onSelectProject,
}: ProjectsPageProps) => (
  <section className="section-page projects-page">
    <div className="page-header">
      <div>
        <p className="section-kicker">Projects</p>
        <h1>Manage and organize your projects.</h1>
      </div>
    </div>

    <form className="project-create-card" onSubmit={onCreateProject}>
      <div>
        <h2>New Project</h2>
        <p>Create a project using the existing workspace flow.</p>
      </div>
      <input
        required
        minLength={3}
        maxLength={80}
        pattern="[A-Za-z0-9][A-Za-z0-9 .,'()/_-]*"
        placeholder="Project title"
        value={projectForm.title}
        onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
      />
      <textarea
        maxLength={300}
        placeholder="Description"
        value={projectForm.description}
        onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
      />
      <button type="submit">+ New Project</button>
    </form>

    <div className="project-card-grid">
      {projects.map((project, index) => (
        <button
          key={project._id}
          type="button"
          className={`project-card ${project._id === selectedProjectId ? 'selected' : ''}`}
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
  </section>
)

type TasksPageProps = {
  projects: Project[]
  selectedProjectId: string
  selectedProject?: Project
  onSelectProject: (id: string) => void
  taskForm: TaskForm
  setTaskForm: (form: TaskForm) => void
  members: Array<Member | string>
  onCreateTask: (event: FormEvent) => void
  filters: TaskFilters
  onFiltersChange: (filters: TaskFilters) => void
  tasksByStatus: Record<TaskStatus, import('../types').Task[]>
  currentUserId: string
  isAdmin: boolean
  onDragStart: (id: string) => void
  onDrop: (status: TaskStatus) => void
  onAssign: TasksPagePropsAssign
  onStatusChange: TasksPagePropsStatus
  onEdit: TasksPagePropsTask
  onDelete: TasksPagePropsTask
  onOpenComments: TasksPagePropsTask
}

type Task = import('../types').Task
type TasksPagePropsAssign = (task: Task, memberId: string) => void
type TasksPagePropsStatus = (task: Task, status: TaskStatus) => void
type TasksPagePropsTask = (task: Task) => void

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
  isAdmin,
  onDragStart,
  onDrop,
  onAssign,
  onStatusChange,
  onEdit,
  onDelete,
  onOpenComments,
}: TasksPageProps) => (
  <section className="section-page tasks-page">
    <div className="page-header page-header-inline tasks-page-header">
      <div>
        <p className="section-kicker">Tasks</p>
        <h1>Manage tasks</h1>
        <p>Manage tasks for the selected project.</p>
      </div>
      <label className="project-selector">
        <span>Project</span>
        <div className="project-selector-control">
          <i className="project-selector-dot" />
          <select
            value={selectedProjectId}
            onChange={(event) => onSelectProject(event.target.value)}
            disabled={projects.length === 0}
          >
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>
      </label>
    </div>

    {selectedProject ? (
      <>
        <TaskComposer
          taskForm={taskForm}
          setTaskForm={setTaskForm}
          members={members}
          onCreateTask={onCreateTask}
        />
        <TaskFiltersBar
          filters={filters}
          members={members}
          onChange={onFiltersChange}
          onClear={() => onFiltersChange(EMPTY_FILTERS)}
        />
        <TaskBoard
          tasksByStatus={tasksByStatus}
          members={members}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onDragStart={onDragStart}
          onDrop={onDrop}
          onAssign={onAssign}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
          onDelete={onDelete}
          onOpenComments={onOpenComments}
        />
      </>
    ) : (
      <div className="empty-state-card">
        <strong>No projects yet</strong>
        <p>Create a project to start managing tasks.</p>
      </div>
    )}
  </section>
)

type MembersPageProps = {
  selectedProject?: Project
  members: Array<Member | string>
  memberEmail: string
  setMemberEmail: (value: string) => void
  onAddMember: (event: FormEvent) => void
}

export const MembersPage = ({
  selectedProject,
  members,
  memberEmail,
  setMemberEmail,
  onAddMember,
}: MembersPageProps) => (
  <section className="section-page members-page">
    <div className="page-header">
      <div>
        <p className="section-kicker">Members</p>
        <h1>Manage the people working on your projects.</h1>
        <p>{selectedProject ? selectedProject.title : 'Select a project to view members.'}</p>
      </div>
    </div>

    {selectedProject && (
      <>
        <form className="member-invite-card" onSubmit={onAddMember}>
          <input
            required
            maxLength={120}
            type="email"
            placeholder="member@company.com"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
          />
          <button type="submit">Invite Member</button>
        </form>

        <div className="member-grid">
          {members.map((member, index) => {
            const name = getMemberName(member)
            return (
              <article className="member-card" key={getMemberId(member) || index}>
                <span className="user-avatar">{name[0]?.toUpperCase() || '?'}</span>
                <div>
                  <strong>{name}</strong>
                  <small>{typeof member === 'string' ? 'Project member' : member.email}</small>
                </div>
              </article>
            )
          })}
        </div>
      </>
    )}
  </section>
)

export const ActivityPage = ({ activities }: { activities: Activity[] }) => (
  <section className="section-page activity-page">
    <div className="page-header">
      <div>
        <p className="section-kicker">Activity</p>
        <h1>Track recent changes across your workspace.</h1>
      </div>
    </div>

    <div className="activity-page-list">
      {activities.length === 0 ? (
        <p className="empty">No activity yet.</p>
      ) : (
        activities.map((activity) => (
          <article className="activity-row" key={activity._id}>
            <span className="activity-icon">{activity.action[0]?.toUpperCase() || 'A'}</span>
            <div>
              <strong>{activity.action.replaceAll('_', ' ')}</strong>
              <small>{activity.user?.name || 'System'} - {formatDate(activity.createdAt)}</small>
            </div>
          </article>
        ))
      )}
    </div>
  </section>
)

export const PlaceholderPage = ({ title }: { title: string }) => (
  <section className="section-page">
    <div className="page-header">
      <div>
        <p className="section-kicker">{title}</p>
        <h1>{title}</h1>
        <p>This section is ready for existing {title.toLowerCase()} functionality when available.</p>
      </div>
    </div>
  </section>
)
