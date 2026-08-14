import type { DragEvent } from 'react'
import type { ProjectMember, Task, TaskStatus } from '../types'
import { STATUS_ORDER, STATUS_LABELS } from '../constants'
import type { ProjectCapabilities } from '../utils/permissions'
import { canEditTask } from '../utils/permissions'
import { TaskCard } from './TaskCard'
import styles from './TaskBoard/TaskBoard.module.css'

type Props = {
  tasksByStatus: Record<TaskStatus, Task[]>
  members: ProjectMember[]
  currentUserId: string
  capabilities: ProjectCapabilities
  draggedTaskId: string
  onDragStart: (id: string) => void
  onDrop: (status: TaskStatus) => void
  onAssign: (task: Task, memberId: string) => void
  onStatusChange: (task: Task, status: TaskStatus) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onOpenComments: (task: Task) => void
}

export const TaskBoard = ({
  tasksByStatus, members, currentUserId, capabilities, draggedTaskId,
  onDragStart, onDrop, onAssign, onStatusChange, onEdit, onDelete, onOpenComments,
}: Props) => {
  const draggedTask = STATUS_ORDER
    .flatMap((status) => tasksByStatus[status])
    .find((task) => task._id === draggedTaskId)
  const draggedCreatorId = draggedTask?.createdBy?.id || draggedTask?.createdBy?._id || ''
  const canDrop = Boolean(
    draggedTask && canEditTask(capabilities, draggedCreatorId, currentUserId),
  )

  return (
  <section className={styles.board}>
    {STATUS_ORDER.map((status) => (
      <div
        className={styles.column}
        key={status}
        onDragOver={(e: DragEvent<HTMLDivElement>) => {
          if (canDrop) e.preventDefault()
        }}
        onDrop={() => {
          if (canDrop) onDrop(status)
        }}
      >
        <div className={styles.columnHeader}>
          <h2>{STATUS_LABELS[status]}</h2>
          <span>{tasksByStatus[status].length}</span>
        </div>

        <div className={styles.taskList}>
          {tasksByStatus[status].length === 0 ? (
            <div className={styles.columnEmpty}>
              <span>{status === 'done' ? '✓' : '▤'}</span>
              <strong>{status === 'done' ? 'No tasks completed yet' : 'No tasks yet'}</strong>
              <p>
                {status === 'done'
                  ? 'Completed tasks will appear here.'
                  : status === 'todo'
                    ? 'Tasks that are not started will appear here.'
                    : 'Tasks in progress will appear here.'}
              </p>
            </div>
          ) : (
            tasksByStatus[status].map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                members={members}
                currentUserId={currentUserId}
                capabilities={capabilities}
                onDragStart={onDragStart}
                onAssign={onAssign}
                onStatusChange={onStatusChange}
                onEdit={onEdit}
                onDelete={onDelete}
                onOpenComments={onOpenComments}
              />
            ))
          )}
        </div>
      </div>
    ))}
  </section>
  )
}
