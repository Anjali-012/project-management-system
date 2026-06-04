import { memo } from 'react'
import type { Member, Task, TaskStatus } from '../types'
import { getMemberId, getMemberName, getAssignedUserId } from '../utils/member'
import { STATUS_ORDER, STATUS_LABELS } from '../constants'
import { PriorityBadge } from './PriorityBadge'
import { DueDateBadge } from './DueDateBadge'

type Props = {
  task: Task
  members: Array<Member | string>
  onDragStart: (id: string) => void
  onAssign: (task: Task, memberId: string) => void
  onStatusChange: (task: Task, status: TaskStatus) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onOpenComments: (task: Task) => void
}

export const TaskCard = memo(({
  task, members, onDragStart, onAssign, onStatusChange, onEdit, onDelete, onOpenComments,
}: Props) => (
  <article className="task-card" draggable onDragStart={() => onDragStart(task._id)}>
    <div className="task-card-top">
      <PriorityBadge priority={task.priority ?? 'medium'} />
      {task.dueDate && <DueDateBadge dueDate={task.dueDate} />}
    </div>

    <div>
      <h3>{task.title}</h3>
      {task.description && <p>{task.description}</p>}
    </div>

    <small>{task.assignedTo ? `Assigned to ${task.assignedTo.name}` : 'Unassigned'}</small>

    <label className="inline-field">
      Task member
      <select value={getAssignedUserId(task.assignedTo)} onChange={(e) => onAssign(task, e.target.value)}>
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
      <select value={task.status} onChange={(e) => onStatusChange(task, e.target.value as TaskStatus)}>
        {STATUS_ORDER.map((option) => (
          <option key={option} value={option}>{STATUS_LABELS[option]}</option>
        ))}
      </select>
    </label>

    <div className="task-actions">
      <button type="button" onClick={() => onEdit(task)}>Edit</button>
      <button type="button" className="btn-comments" onClick={() => onOpenComments(task)}>
        💬 {task.comments?.length ?? 0}
      </button>
      <button type="button" onClick={() => onDelete(task)}>Delete</button>
    </div>
  </article>
))

TaskCard.displayName = 'TaskCard'
