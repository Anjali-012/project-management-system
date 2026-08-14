import type { FormEvent } from 'react'
import type { ProjectRole } from '../../types'
import { Modal } from '../Modal/Modal'
import styles from './Members.module.css'

type Props = {
  email: string
  role: ProjectRole
  assignableRoles: ProjectRole[]
  onEmailChange: (v: string) => void
  onRoleChange: (v: ProjectRole) => void
  onSubmit: (e: FormEvent) => void
  onClose: () => void
}

const ROLE_LABELS: Record<ProjectRole, string> = {
  owner:   'Owner',
  manager: 'Manager',
  member:  'Member',
  viewer:  'Viewer',
}

export const AddMemberModal = ({
  email, role, assignableRoles, onEmailChange, onRoleChange, onSubmit, onClose,
}: Props) => (
  <Modal title="Invite Member" onClose={onClose}>
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.formRow}>
        <label htmlFor="invite-email">Email address</label>
        <input
          id="invite-email"
          required
          type="email"
          maxLength={120}
          placeholder="member@company.com"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
        />
      </div>

      <div className={styles.formRow}>
        <label htmlFor="invite-role">Project role</label>
        <select
          id="invite-role"
          value={role}
          onChange={(e) => onRoleChange(e.target.value as ProjectRole)}
        >
          {assignableRoles.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </div>

      <button type="submit" className={`primary ${styles.submitBtn}`}>
        Invite Member
      </button>
    </form>
  </Modal>
)
