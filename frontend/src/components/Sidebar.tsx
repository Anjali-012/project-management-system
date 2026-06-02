import type { FormEvent } from 'react'
import type { AuthState, Project } from '../types'

type ProjectForm = { title: string; description: string }

type Props = {
  auth: AuthState
  projects: Project[]
  selectedProjectId: string
  projectForm: ProjectForm
  setProjectForm: (form: ProjectForm) => void
  onCreateProject: (e: FormEvent) => void
  onSelectProject: (id: string) => void
  onLogout: () => void
}

export const Sidebar = ({
  auth,
  projects,
  selectedProjectId,
  projectForm,
  setProjectForm,
  onCreateProject,
  onSelectProject,
  onLogout,
}: Props) => (
  <aside className="sidebar">
    <div className="brand">
      <span>PM</span>
      <div>
        <strong>{auth.user.name}</strong>
        <small>{auth.user.role}</small>
      </div>
    </div>

    <form className="compact-form" onSubmit={onCreateProject}>
      <input
        required
        minLength={3}
        maxLength={80}
        pattern="[A-Za-z0-9][A-Za-z0-9 .,'()/_-]*"
        placeholder="New project"
        value={projectForm.title}
        onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
      />
      <textarea
        maxLength={300}
        placeholder="Description"
        value={projectForm.description}
        onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
      />
      <button type="submit">Add project</button>
    </form>

    <nav className="project-list">
      {projects.map((project) => (
        <button
          key={project._id}
          type="button"
          className={project._id === selectedProjectId ? 'selected' : ''}
          onClick={() => onSelectProject(project._id)}
        >
          <strong>{project.title}</strong>
          <small>{project.members.length} members</small>
        </button>
      ))}
    </nav>

    <button className="ghost" type="button" onClick={onLogout}>
      Sign out
    </button>
  </aside>
)