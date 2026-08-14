import type { TaskPriority } from '../../types'
import { PRIORITY_LABELS } from '../../constants'
import styles from './PriorityBadge.module.css'

const priorityStyles: Record<TaskPriority, string> = {
  low: styles.priorityLow,
  medium: styles.priorityMedium,
  high: styles.priorityHigh,
  urgent: styles.priorityUrgent,
}

export const PriorityBadge = ({ priority }: { priority: TaskPriority }) => (
  <span className={`${styles.priorityBadge} ${priorityStyles[priority]}`}>
    {PRIORITY_LABELS[priority]}
  </span>
)
