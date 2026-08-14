import type { FormEvent } from 'react'
import type { ProjectMember } from '../types'
import { Modal } from './Modal/Modal'
import { TaskForm } from './TaskForm/TaskForm'
import type { TaskForm as TaskFormValues } from './TaskComposer'

type Props = {
  taskForm: TaskFormValues
  setTaskForm: (form: TaskFormValues) => void
  members: ProjectMember[]
  onCreateTask: (e: FormEvent) => void
  onClose: () => void
}

export const CreateTaskModal = ({ taskForm, setTaskForm, members, onCreateTask, onClose }: Props) => (
  <Modal title="Create task" onClose={onClose}>
    <TaskForm
      values={taskForm}
      onChange={setTaskForm}
      members={members}
      submitLabel="Create task"
      onSubmit={(e: FormEvent) => { onCreateTask(e); onClose() }}
    />
  </Modal>
)
