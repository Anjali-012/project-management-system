import { memo } from 'react'
import type { Member, Task, TaskStatus } from '../types'
import { getAssignedUserId, getMemberId, getMemberName } from '../utils/member'
import { STATUS_LABELS, STATUS_ORDER } from '../constants'
import { DueDateBadge } from './DueDateBadge'
import { PriorityBadge } from './PriorityBadge'

type Props = {
  task: Task
  members: Array<Member | string>
  currentUserId: string
  isAdmin: boolean
  onDragStart: (id: string) => void
  onAssign: (task: Task, memberId: string) => void
  onStatusChange: (task: Task, status: TaskStatus) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onOpenComments: (task: Task) => void
}

export const TaskCard = memo(({
  task, members, currentUserId, isAdmin,
  onDragStart, onAssign, onStatusChange, onEdit, onDelete, onOpenComments,
}: Props) => {
  const creatorId = task.createdBy?.id || task.createdBy?._id || ''
  const canDelete = isAdmin || creatorId === currentUserId
  const assignedName = task.assignedTo?.name || 'Unassigned'

  return (
    <article className="task-card" draggable onDragStart={() => onDragStart(task._id)}>
      <div className="task-card-top">
        <PriorityBadge priority={task.priority ?? 'medium'} />
        {task.dueDate && <DueDateBadge dueDate={task.dueDate} />}
      </div>

      <div className="task-card-body">
        <h3>{task.title}</h3>
        {task.description && <p>{task.description}</p>}
      </div>

      <div className="assignee-row">
        <small>Assigned to</small>
        <span className="mini-avatar">{assignedName[0]?.toUpperCase() || '?'}</span>
        <strong>{assignedName}</strong>
      </div>

      <div className="task-card-controls">
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
      </div>

      <div className={`task-actions ${canDelete ? '' : 'task-actions-no-delete'}`}>
        <button type="button" onClick={() => onEdit(task)}>Edit Task</button>
        <button type="button" className="btn-comments" onClick={() => onOpenComments(task)}>
          ◌ {task.comments?.length ?? 0}
        </button>
        {canDelete && (
          <button type="button" onClick={() => onDelete(task)} aria-label={`Delete ${task.title}`}>⋮</button>
        )}
      </div>
    </article>
  )
})

TaskCard.displayName = 'TaskCard'
