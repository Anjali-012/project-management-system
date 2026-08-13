import type { FormEvent } from 'react'
import type { ProjectRole } from '../types'
import { Modal } from './Modal/Modal'
import styles from './Members/Members.module.css'

const ASSIGNABLE_ROLES: { value: ProjectRole; label: string }[] = [
  { value: 'member',  label: 'Member'  },
  { value: 'manager', label: 'Manager' },
  { value: 'viewer',  label: 'Viewer'  },
]

type Props = {
  email: string
  role: ProjectRole
  onEmailChange: (v: string) => void
  onRoleChange: (v: ProjectRole) => void
  onSubmit: (e: FormEvent) => void
  onClose: () => void
}

export const AddMemberModal = ({
  email, role, onEmailChange, onRoleChange, onSubmit, onClose,
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
          {ASSIGNABLE_ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      <button type="submit" className={`primary ${styles.submitBtn}`}>
        Invite Member
      </button>
    </form>
  </Modal>
)
