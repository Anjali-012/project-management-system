import type { FormEvent } from 'react'
import type { Member, Task, Toast } from '../types'
import { getMemberId, getMemberName } from '../utils/member'
import { validateTask } from '../utils/validation'

type TaskForm = { title: string; description: string; assignedTo: string }

type Props = {
  loadProjectMeta: () => Promise<void>
  members: Array<Member | string>
  projectId: string
  request: <T>(path: string, options?: RequestInit) => Promise<T>
  setTaskForm: (form: TaskForm) => void
  showToast: (message: string, type?: Toast['type']) => void
  taskForm: TaskForm
  upsertTask: (task: Task) => void
}

export function TaskComposer(props: Props) {
  const {
    loadProjectMeta,
    members,
    projectId,
    request,
    setTaskForm,
    showToast,
    taskForm,
    upsertTask,
  } = props

  const createTask = async (event: FormEvent) => {
    event.preventDefault()
    const validationError = validateTask(taskForm)
    if (validationError) return showToast(validationError)

    try {
      const body = await request<{ data: Task }>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: taskForm.title.trim(),
          description: taskForm.description.trim(),
          projectId,
          assignedTo: taskForm.assignedTo || undefined,
        }),
      })
      upsertTask(body.data)
      setTaskForm({ title: '', description: '', assignedTo: '' })
      await loadProjectMeta()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not create task')
    }
  }

  return (
    <form className="task-composer" onSubmit={createTask}>
      <input
        required
        minLength={3}
        maxLength={100}
        pattern="[A-Za-z0-9][A-Za-z0-9 .,'()/_-]*"
        placeholder="Task title"
        value={taskForm.title}
        onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })}
      />
      <input
        maxLength={500}
        placeholder="Description"
        value={taskForm.description}
        onChange={(event) =>
          setTaskForm({ ...taskForm, description: event.target.value })
        }
      />
      <select
        value={taskForm.assignedTo}
        onChange={(event) =>
          setTaskForm({ ...taskForm, assignedTo: event.target.value })
        }
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
}
