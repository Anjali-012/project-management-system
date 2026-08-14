import { formatDate } from './../../utils/date'
import styles from './DueDateBadge.module.css'

export const DueDateBadge = ({ dueDate }: { dueDate: string }) => {
  const due = new Date(dueDate)
  const now = new Date()
  const isOverdue = due < now
  const isDueSoon = !isOverdue && due.getTime() - now.getTime() < 86_400_000 * 2 // within 2 days
  const badgeClass = isOverdue ? styles.dueOverdue : isDueSoon ? styles.dueSoon : styles.dueOk

  return (
    <span className={`${styles.dueBadge} ${badgeClass}`}>
      {isOverdue ? '⚠ ' : ''}Due {formatDate(dueDate)}
    </span>
  )
}
