import type { DragEvent } from 'react'
import { statusLabels, statusOrder } from '../constants'
import type { Member, Task, TaskStatus } from '../types'
import { TaskCard } from './TaskCard'

type Props = {
  assignTaskMember: (task: Task, assignedTo: string) => Promise<void>
  deleteTask: (task: Task) => Promise<void>
  members: Array<Member | string>
  onDragStart: (taskId: string) => void
  openTaskEdit: (task: Task) => void
  tasksByStatus: Record<TaskStatus, Task[]>
  updateTaskStatus: (task: Task, status: TaskStatus) => Promise<void>
}

export function TaskBoard(props: Props) {
  const {
    assignTaskMember,
    deleteTask,
    members,
    onDragStart,
    openTaskEdit,
    tasksByStatus,
    updateTaskStatus,
  } = props

  const handleDrop = (event: DragEvent<HTMLDivElement>, status: TaskStatus) => {
    event.preventDefault()
    const taskId = event.dataTransfer.getData('text/task-id')
    const task = Object.values(tasksByStatus)
      .flat()
      .find((item) => item._id === taskId)

    if (task && task.status !== status) updateTaskStatus(task, status)
  }

  return (
    <section className="board">
      {statusOrder.map((status) => (
        <div
          className="column"
          key={status}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => handleDrop(event, status)}
        >
          <div className="column-header">
            <h2>{statusLabels[status]}</h2>
            <span>{tasksByStatus[status].length}</span>
          </div>

          <div className="task-list">
            {tasksByStatus[status].map((task) => (
              <TaskCard
                assignTaskMember={assignTaskMember}
                deleteTask={deleteTask}
                key={task._id}
                members={members}
                onDragStart={(taskId) => {
                  onDragStart(taskId)
                }}
                openTaskEdit={openTaskEdit}
                task={task}
                updateTaskStatus={updateTaskStatus}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
