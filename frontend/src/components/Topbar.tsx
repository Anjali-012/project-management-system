import type { FormEvent } from 'react'
import type { PresenceUser, Project } from '../types'
import { PresencePill } from './PresencePill'

type Props = {
  selectedProject?: Project
  realtimeStatus: string
  memberEmail: string
  setMemberEmail: (v: string) => void
  onAddMember: (e: FormEvent) => void
  presence: PresenceUser[]
}

export const Topbar = ({
  selectedProject, realtimeStatus, memberEmail, setMemberEmail, onAddMember, presence,
}: Props) => (
  <header className="topbar">
    <div>
      <p className="eyebrow">{realtimeStatus}</p>
      <h1>{selectedProject?.title || 'Select a project'}</h1>
      <p>{selectedProject?.description || 'Create or choose a project to begin.'}</p>
    </div>

    <div className="topbar-right">
      {selectedProject && <PresencePill users={presence} />}

      {selectedProject && (
        <form className="member-form" onSubmit={onAddMember}>
          <input
            required maxLength={120} type="email"
            placeholder="member@company.com"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
          />
          <button type="submit">Add member</button>
        </form>
      )}
    </div>
  </header>
)
