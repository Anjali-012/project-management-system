import { formatDate } from '../utils/date'

export const DueDateBadge = ({ dueDate }: { dueDate: string }) => {
  const due = new Date(dueDate)
  const now = new Date()
  const isOverdue = due < now
  const isDueSoon = !isOverdue && due.getTime() - now.getTime() < 86_400_000 * 2 // within 2 days

  return (
    <span className={`due-badge ${isOverdue ? 'due-overdue' : isDueSoon ? 'due-soon' : 'due-ok'}`}>
      {isOverdue ? '⚠ ' : ''}Due {formatDate(dueDate)}
    </span>
  )
}
