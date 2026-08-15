import type { Task } from '../../types'
import { STATUS_LABELS, PRIORITY_LABELS } from '../../constants'
import { formatDate } from '../../utils/date'
import { Modal } from '../Modal/Modal'

type Props = {
  task: Task | null
  loading: boolean
  onClose: () => void
  onEdit: (task: Task) => void
  onOpenComments: (task: Task) => void
  canEdit: boolean
}

export const TaskDetailsModal = ({ task, loading, onClose, onEdit, onOpenComments, canEdit }: Props) => (
  <Modal title="Task details" onClose={onClose}>
    {loading ? <p className="empty">Loading task details...</p> : !task ? <p className="empty">Unable to load this task.</p> : (
      <div className="task-details">
        <h2>{task.title}</h2>
        <p>{task.description || 'No description provided.'}</p>
        <dl>
          <div><dt>Status</dt><dd>{STATUS_LABELS[task.status]}</dd></div>
          <div><dt>Priority</dt><dd>{PRIORITY_LABELS[task.priority]}</dd></div>
          <div><dt>Assigned to</dt><dd>{task.assignedTo?.name || 'Unassigned'}</dd></div>
          <div><dt>Due date</dt><dd>{task.dueDate ? formatDate(task.dueDate) : 'No due date'}</dd></div>
          <div><dt>Created</dt><dd>{formatDate(task.createdAt)}</dd></div>
          <div><dt>Last updated</dt><dd>{formatDate(task.updatedAt)}</dd></div>
        </dl>
        <div className="task-details-actions">
          {canEdit && <button type="button" className="primary" onClick={() => onEdit(task)}>Edit task</button>}
          <button type="button" onClick={() => onOpenComments(task)}>Comments ({task.comments.length})</button>
        </div>
      </div>
    )}
  </Modal>
)
