import type { Dispatch, FormEvent, SetStateAction } from 'react'
import type { Project, Toast } from '../types'
import { validateProject } from '../utils/validation'

type ProjectForm = { title: string; description: string }

type Props = {
  projectForm: ProjectForm
  projects: Project[]
  selectedProjectId: string
  request: <T>(path: string, options?: RequestInit) => Promise<T>
  setProjectForm: (form: ProjectForm) => void
  setProjects: Dispatch<SetStateAction<Project[]>>
  setSelectedProjectId: (id: string) => void
  showToast: (message: string, type?: Toast['type']) => void
  userName: string
  userRole: string
  onLogout: () => void
}

export function Sidebar(props: Props) {
  const {
    onLogout,
    projectForm,
    projects,
    request,
    selectedProjectId,
    setProjectForm,
    setProjects,
    setSelectedProjectId,
    showToast,
    userName,
    userRole,
  } = props

  const createProject = async (event: FormEvent) => {
    event.preventDefault()
    const validationError = validateProject(projectForm)
    if (validationError) return showToast(validationError)

    try {
      const body = await request<{ data: Project }>('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          title: projectForm.title.trim(),
          description: projectForm.description.trim(),
        }),
      })
      setProjects((current) => [body.data, ...current])
      setSelectedProjectId(body.data._id)
      setProjectForm({ title: '', description: '' })
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not create project')
    }
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <span>PM</span>
        <div>
          <strong>{userName}</strong>
          <small>{userRole}</small>
        </div>
      </div>

      <form className="compact-form" onSubmit={createProject}>
        <input
          required
          minLength={3}
          maxLength={80}
          pattern="[A-Za-z0-9][A-Za-z0-9 .,'()/_-]*"
          placeholder="New project"
          value={projectForm.title}
          onChange={(event) =>
            setProjectForm({ ...projectForm, title: event.target.value })
          }
        />
        <textarea
          maxLength={300}
          placeholder="Description"
          value={projectForm.description}
          onChange={(event) =>
            setProjectForm({ ...projectForm, description: event.target.value })
          }
        />
        <button type="submit">Add project</button>
      </form>

      <nav className="project-list">
        {projects.map((project) => (
          <button
            key={project._id}
            type="button"
            className={project._id === selectedProjectId ? 'selected' : ''}
            onClick={() => setSelectedProjectId(project._id)}
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
}
