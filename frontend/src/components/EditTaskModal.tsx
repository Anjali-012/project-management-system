import type { FormEvent } from 'react'
import type { Member, TaskPriority, TaskStatus } from '../types'
import { getMemberId, getMemberName } from '../utils/member'
import { STATUS_ORDER, STATUS_LABELS, PRIORITY_ORDER, PRIORITY_LABELS } from '../constants'
import styles from './EditTaskModal/EditTaskModal.module.css'

export type EditForm = {
  title: string
  description: string
  assignedTo: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string
}

type Props = {
  editForm: EditForm
  setEditForm: (form: EditForm) => void
  members: Array<Member | string>
  onSave: (e: FormEvent) => void
  onClose: () => void
}

export const EditTaskModal = ({ editForm, setEditForm, members, onSave, onClose }: Props) => (
  <div className={styles.modalBackdrop} role="presentation">
    <form className={styles.modal} onSubmit={onSave}>
      <div className={styles.modalHeader}>
        <h2>Edit task</h2>
        <button className="icon-button" type="button" onClick={onClose}>✕</button>
      </div>

      <label>
        Title
        <input
          required minLength={3} maxLength={100}
          pattern="[A-Za-z0-9][A-Za-z0-9 .,'()/_-]*"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
        />
      </label>

      <label>
        Description
        <textarea
          maxLength={500}
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
        />
      </label>

      <div className={styles.modalRow}>
        <label>
          Priority
          <select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as TaskPriority })}>
            {PRIORITY_ORDER.map((p) => (
              <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
            ))}
          </select>
        </label>

        <label>
          Due date
          <input
            type="date"
            value={editForm.dueDate}
            onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
          />
        </label>
      </div>

      <label>
        Assignee
        <select value={editForm.assignedTo} onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}>
          <option value="">Unassigned</option>
          {members.map((member) => (
            <option key={getMemberId(member)} value={getMemberId(member)}>
              {getMemberName(member)}
            </option>
          ))}
        </select>
      </label>

      <label>
        Status
        <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as TaskStatus })}>
          {STATUS_ORDER.map((status) => (
            <option key={status} value={status}>{STATUS_LABELS[status]}</option>
          ))}
        </select>
      </label>

      <button className="primary" type="submit">Save task</button>
    </form>
  </div>
)
