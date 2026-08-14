import type { FormEvent } from 'react'
import type { ProjectMember, TaskPriority, TaskStatus } from '../../types'
import { Modal } from '../Modal/Modal'
import { TaskForm, type TaskFormValues } from '../TaskForm/TaskForm'

export type EditForm = {
  title: string
  description: string
  assignedTo: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string
}

type Props = {
  editForm: EditForm
  setEditForm: (form: EditForm) => void
  members: ProjectMember[]
  onSave: (e: FormEvent) => void
  onClose: () => void
}

export const EditTaskModal = ({ editForm, setEditForm, members, onSave, onClose }: Props) => {
  const values: TaskFormValues = editForm
  const handleChange = (v: TaskFormValues) => setEditForm(v as EditForm)

  return (
    <Modal title="Edit task" onClose={onClose}>
      <TaskForm
        values={values}
        onChange={handleChange}
        members={members}
        showStatus
        submitLabel="Save task"
        onSubmit={onSave}
      />
    </Modal>
  )
}
