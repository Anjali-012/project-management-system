import type { DragEvent } from 'react'
import type { Member, Task, TaskStatus } from '../types'
import { STATUS_ORDER, STATUS_LABELS } from '../constants'
import { TaskCard } from './TaskCard'
import styles from './TaskBoard/TaskBoard.module.css'

type Props = {
  tasksByStatus: Record<TaskStatus, Task[]>
  members: Array<Member | string>
  currentUserId: string
  isAdmin: boolean
  onDragStart: (id: string) => void
  onDrop: (status: TaskStatus) => void
  onAssign: (task: Task, memberId: string) => void
  onStatusChange: (task: Task, status: TaskStatus) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onOpenComments: (task: Task) => void
}

export const TaskBoard = ({
  tasksByStatus, members, currentUserId, isAdmin,
  onDragStart, onDrop, onAssign, onStatusChange, onEdit, onDelete, onOpenComments,
}: Props) => (
  <section className={styles.board}>
    {STATUS_ORDER.map((status) => (
      <div
        className={styles.column}
        key={status}
        onDragOver={(e: DragEvent<HTMLDivElement>) => e.preventDefault()}
        onDrop={() => onDrop(status)}
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
                isAdmin={isAdmin}
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
