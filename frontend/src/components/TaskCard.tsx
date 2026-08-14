import { memo } from 'react'
import type { ProjectMember, Task, TaskStatus } from '../types'
import type { ProjectCapabilities } from '../utils/permissions'
import { canDeleteTask, canEditTask, getAssignableTaskMembers } from '../utils/permissions'
import { getAssignedUserId, getMemberId, getMemberName } from '../utils/member'
import { STATUS_LABELS, STATUS_ORDER } from '../constants'
import { DueDateBadge } from './DueDateBadge'
import { PriorityBadge } from './PriorityBadge'
import styles from './TaskCard/TaskCard.module.css'

type Props = {
  task: Task
  members: ProjectMember[]
  currentUserId: string
  capabilities: ProjectCapabilities
  onDragStart: (id: string) => void
  onAssign: (task: Task, memberId: string) => void
  onStatusChange: (task: Task, status: TaskStatus) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onOpenComments: (task: Task) => void
}

export const TaskCard = memo(({
  task, members, currentUserId, capabilities,
  onDragStart, onAssign, onStatusChange, onEdit, onDelete, onOpenComments,
}: Props) => {
  const creatorId = task.createdBy?.id || task.createdBy?._id || ''
  const editable = canEditTask(capabilities, creatorId, currentUserId)
  const deletable = canDeleteTask(capabilities, creatorId, currentUserId)
  const assignedName = task.assignedTo?.name || 'Unassigned'

  return (
    <article
      className={styles.taskCard}
      draggable={editable}
      onDragStart={() => editable && onDragStart(task._id)}
    >
      <div className={styles.taskCardTop}>
        <PriorityBadge priority={task.priority ?? 'medium'} />
        {task.dueDate && <DueDateBadge dueDate={task.dueDate} />}
      </div>

      <div className={styles.taskCardBody}>
        <h3>{task.title}</h3>
        {task.description && <p>{task.description}</p>}
      </div>

      <div className={styles.assigneeRow}>
        <small>Assigned to</small>
        <span className={styles.miniAvatar}>{assignedName[0]?.toUpperCase() || '?'}</span>
        <strong>{assignedName}</strong>
      </div>

      {editable && (
        <div className={styles.taskCardControls}>
          <label className={styles.inlineField}>
            Task member
            <select value={getAssignedUserId(task.assignedTo)} onChange={(e) => onAssign(task, e.target.value)}>
              <option value="">Unassigned</option>
              {getAssignableTaskMembers(members).map((member) => (
                <option key={getMemberId(member)} value={getMemberId(member)}>
                  {getMemberName(member)}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.inlineField}>
            Status
            <select value={task.status} onChange={(e) => onStatusChange(task, e.target.value as TaskStatus)}>
              {STATUS_ORDER.map((option) => (
                <option key={option} value={option}>{STATUS_LABELS[option]}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className={`${styles.taskActions} ${deletable ? '' : styles.taskActionsNoDelete}`}>
        {editable && (
          <button type="button" onClick={() => onEdit(task)}>Edit Task</button>
        )}
        {editable && (
          <button type="button" className={styles.btnComments} onClick={() => onOpenComments(task)}>
            ◌ {task.comments?.length ?? 0}
          </button>
        )}
        {deletable && (
          <button type="button" onClick={() => onDelete(task)} aria-label={`Delete ${task.title}`}>⋮</button>
        )}
      </div>
    </article>
  )
})

TaskCard.displayName = 'TaskCard'
