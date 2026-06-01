import type { Dispatch, FormEvent, SetStateAction } from 'react'
import type { Project, Toast } from '../types'
import { validateEmail } from '../utils/validation'

type Props = {
  memberEmail: string
  realtimeStatus: string
  request: <T>(path: string, options?: RequestInit) => Promise<T>
  selectedProject?: Project
  selectedProjectId: string
  setMemberEmail: (email: string) => void
  setProjects: Dispatch<SetStateAction<Project[]>>
  showToast: (message: string, type?: Toast['type']) => void
  loadProjectMeta: () => Promise<void>
}

export function Topbar(props: Props) {
  const {
    loadProjectMeta,
    memberEmail,
    realtimeStatus,
    request,
    selectedProject,
    selectedProjectId,
    setMemberEmail,
    setProjects,
    showToast,
  } = props

  const addMember = async (event: FormEvent) => {
    event.preventDefault()
    const validationError = validateEmail(memberEmail)
    if (validationError) return showToast(validationError)

    try {
      const body = await request<{ data: Project }>(
        `/api/projects/${selectedProjectId}/members`,
        { method: 'POST', body: JSON.stringify({ email: memberEmail.trim() }) },
      )
      setProjects((current) =>
        current.map((project) => (project._id === body.data._id ? body.data : project)),
      )
      setMemberEmail('')
      await loadProjectMeta()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not add member')
    }
  }

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{realtimeStatus}</p>
        <h1>{selectedProject?.title || 'Select a project'}</h1>
        <p>{selectedProject?.description || 'Create or choose a project to begin.'}</p>
      </div>
      {selectedProject && (
        <form className="member-form" onSubmit={addMember}>
          <input
            required
            maxLength={120}
            type="email"
            placeholder="member@company.com"
            value={memberEmail}
            onChange={(event) => setMemberEmail(event.target.value)}
          />
          <button type="submit">Add member</button>
        </form>
      )}
    </header>
  )
}
