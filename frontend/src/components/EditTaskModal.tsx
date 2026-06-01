import type { FormEvent } from 'react'
import { statusLabels, statusOrder } from '../constants'
import type { Member, Task, TaskStatus, Toast } from '../types'
import { getMemberId, getMemberName } from '../utils/member'
import { validateTask } from '../utils/validation'

type EditForm = {
  title: string
  description: string
  assignedTo: string
  status: TaskStatus
}

type Props = {
  editForm: EditForm
  editTask: Task | null
  members: Array<Member | string>
  setEditForm: (form: EditForm) => void
  setEditTask: (task: Task | null) => void
  showToast: (message: string, type?: Toast['type']) => void
  updateTask: (
    task: Task,
    payload: {
      title?: string
      description?: string
      assignedTo?: string | null
      status?: TaskStatus
    },
  ) => Promise<void>
}

export function EditTaskModal(props: Props) {
  const {
    editForm,
    editTask,
    members,
    setEditForm,
    setEditTask,
    showToast,
    updateTask,
  } = props

  if (!editTask) return null

  const saveTaskEdit = async (event: FormEvent) => {
    event.preventDefault()
    const validationError = validateTask(editForm)
    if (validationError) return showToast(validationError)

    try {
      await updateTask(editTask, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        assignedTo: editForm.assignedTo || null,
        status: editForm.status,
      })
      setEditTask(null)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save task')
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal" onSubmit={saveTaskEdit}>
        <div className="modal-header">
          <h2>Edit task</h2>
          <button className="icon-button" type="button" onClick={() => setEditTask(null)}>
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
            onChange={(event) => setEditForm({ ...editForm, title: event.target.value })}
          />
        </label>
        <label>
          Description
          <textarea
            maxLength={500}
            value={editForm.description}
            onChange={(event) =>
              setEditForm({ ...editForm, description: event.target.value })
            }
          />
        </label>
        <label>
          Assignee
          <select
            value={editForm.assignedTo}
            onChange={(event) =>
              setEditForm({ ...editForm, assignedTo: event.target.value })
            }
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
            onChange={(event) =>
              setEditForm({ ...editForm, status: event.target.value as TaskStatus })
            }
          >
            {statusOrder.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
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
}
