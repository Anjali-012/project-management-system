import type { FormEvent } from 'react'
import type { Member, TaskPriority } from '../types'
import { getMemberId, getMemberName } from '../utils/member'
import { PRIORITY_ORDER, PRIORITY_LABELS } from '../constants'

export type TaskForm = {
  title: string
  description: string
  assignedTo: string
  priority: TaskPriority
  dueDate: string
}

type Props = {
  taskForm: TaskForm
  setTaskForm: (form: TaskForm) => void
  members: Array<Member | string>
  onCreateTask: (e: FormEvent) => void
}

export const TaskComposer = ({ taskForm, setTaskForm, members, onCreateTask }: Props) => (
  <form className="task-composer" onSubmit={onCreateTask}>
    <input
      name="task-title"
      required minLength={3} maxLength={100}
      pattern="[A-Za-z0-9][A-Za-z0-9 .,'()/_-]*"
      placeholder="Task title"
      value={taskForm.title}
      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
    />
    <input
      maxLength={500}
      placeholder="Description"
      value={taskForm.description}
      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
    />
    <select
      value={taskForm.priority}
      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as TaskPriority })}
    >
      {PRIORITY_ORDER.map((p) => (
        <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
      ))}
    </select>
    <input
      type="date"
      title="Due date"
      value={taskForm.dueDate}
      onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
    />
    <select
      value={taskForm.assignedTo}
      onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
    >
      <option value="">Unassigned</option>
      {members.map((member) => (
        <option key={getMemberId(member)} value={getMemberId(member)}>
          {getMemberName(member)}
        </option>
      ))}
    </select>
    <button type="submit">Create task</button>
  </form>
)
