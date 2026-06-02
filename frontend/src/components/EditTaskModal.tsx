import type { FormEvent } from 'react'
import type { Member, Task, TaskStatus } from '../types'
import { getMemberId, getMemberName } from '../utils/member'
import { STATUS_ORDER, STATUS_LABELS } from '../constants'

type EditForm = {
  title: string
  description: string
  assignedTo: string
  status: TaskStatus
}

type Props = {
  task: Task
  editForm: EditForm
  setEditForm: (form: EditForm) => void
  members: Array<Member | string>
  onSave: (e: FormEvent) => void
  onClose: () => void
}

export const EditTaskModal = ({
  task: _task,
  editForm,
  setEditForm,
  members,
  onSave,
  onClose,
}: Props) => (
  <div className="modal-backdrop" role="presentation">
    <form className="modal" onSubmit={onSave}>
      <div className="modal-header">
        <h2>Edit task</h2>
        <button className="icon-button" type="button" onClick={onClose}>
          X
        </button>
      </div>

      <label>
        Title
        <input
          required
          minLength={3}
          maxLength={100}
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

      <label>
        Assignee
        <select
          value={editForm.assignedTo}
          onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}
        >
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
        <select
          value={editForm.status}
          onChange={(e) =>
            setEditForm({ ...editForm, status: e.target.value as TaskStatus })
          }
        >
          {STATUS_ORDER.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </label>

      <button className="primary" type="submit">
        Save task
      </button>
    </form>
  </div>
)