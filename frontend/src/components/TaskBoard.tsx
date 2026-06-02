import type { DragEvent } from 'react'
import type { Member, Task, TaskStatus } from '../types'
import { STATUS_ORDER, STATUS_LABELS } from '../constants'
import { TaskCard } from './TaskCard'

type Props = {
  tasksByStatus: Record<TaskStatus, Task[]>
  members: Array<Member | string>
  onDragStart: (id: string) => void
  onDrop: (status: TaskStatus) => void
  onAssign: (task: Task, memberId: string) => void
  onStatusChange: (task: Task, status: TaskStatus) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

export const TaskBoard = ({
  tasksByStatus,
  members,
  onDragStart,
  onDrop,
  onAssign,
  onStatusChange,
  onEdit,
  onDelete,
}: Props) => (
  <section className="board">
    {STATUS_ORDER.map((status) => (
      <div
        className="column"
        key={status}
        onDragOver={(e: DragEvent<HTMLDivElement>) => e.preventDefault()}
        onDrop={() => onDrop(status)}
      >
        <div className="column-header">
          <h2>{STATUS_LABELS[status]}</h2>
          <span>{tasksByStatus[status].length}</span>
        </div>

        <div className="task-list">
          {tasksByStatus[status].map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              members={members}
              onDragStart={onDragStart}
              onAssign={onAssign}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    ))}
  </section>
)