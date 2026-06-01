import type { DragEvent } from 'react'
import type { Member, Task, TaskStatus } from '../types'
import { statusLabels, statusOrder } from '../constants'
import { getAssignedUserId, getMemberId, getMemberName } from '../utils/member'

type Props = {
  assignTaskMember: (task: Task, assignedTo: string) => Promise<void>
  deleteTask: (task: Task) => Promise<void>
  members: Array<Member | string>
  onDragStart: (taskId: string) => void
  openTaskEdit: (task: Task) => void
  task: Task
  updateTaskStatus: (task: Task, status: TaskStatus) => Promise<void>
}

export function TaskCard(props: Props) {
  const {
    assignTaskMember,
    deleteTask,
    members,
    onDragStart,
    openTaskEdit,
    task,
    updateTaskStatus,
  } = props

  const handleDragStart = (event: DragEvent<HTMLElement>) => {
    event.dataTransfer.setData('text/task-id', task._id)
    onDragStart(task._id)
  }

  return (
    <article className="task-card" draggable onDragStart={handleDragStart}>
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
          onChange={(event) => assignTaskMember(task, event.target.value)}
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
          onChange={(event) => updateTaskStatus(task, event.target.value as TaskStatus)}
        >
          {statusOrder.map((option) => (
            <option key={option} value={option}>
              {statusLabels[option]}
            </option>
          ))}
        </select>
      </label>

      <div className="task-actions">
        <button type="button" onClick={() => openTaskEdit(task)}>
          Edit
        </button>
        <button type="button" onClick={() => deleteTask(task)}>
          Delete
        </button>
      </div>
    </article>
  )
}
