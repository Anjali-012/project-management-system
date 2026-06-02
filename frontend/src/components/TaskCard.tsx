import type { Member, Task, TaskStatus } from '../types'
import { getMemberId, getMemberName, getAssignedUserId } from '../utils/member'
import { STATUS_ORDER, STATUS_LABELS } from '../constants'

type Props = {
  task: Task
  members: Array<Member | string>
  onDragStart: (id: string) => void
  onAssign: (task: Task, memberId: string) => void
  onStatusChange: (task: Task, status: TaskStatus) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

export const TaskCard = ({
  task,
  members,
  onDragStart,
  onAssign,
  onStatusChange,
  onEdit,
  onDelete,
}: Props) => (
  <article
    className="task-card"
    draggable
    onDragStart={() => onDragStart(task._id)}
  >
    <div>
      <h3>{task.title}</h3>
      {task.description && <p>{task.description}</p>}
    </div>

    <small>
      {task.assignedTo ? `Assigned to ${task.assignedTo.name}` : 'Unassigned'}
    </small>

    <label className="inline-field">
      Task member
      <select
        value={getAssignedUserId(task.assignedTo)}
        onChange={(e) => onAssign(task, e.target.value)}
      >
        <option value="">Unassigned</option>
        {members.map((member) => (
          <option key={getMemberId(member)} value={getMemberId(member)}>
            {getMemberName(member)}
          </option>
        ))}
      </select>
    </label>

    <label className="inline-field">
      Status
      <select
        value={task.status}
        onChange={(e) => onStatusChange(task, e.target.value as TaskStatus)}
      >
        {STATUS_ORDER.map((option) => (
          <option key={option} value={option}>
            {STATUS_LABELS[option]}
          </option>
        ))}
      </select>
    </label>

    <div className="task-actions">
      <button type="button" onClick={() => onEdit(task)}>
        Edit
      </button>
      <button type="button" onClick={() => onDelete(task)}>
        Delete
      </button>
    </div>
  </article>
)