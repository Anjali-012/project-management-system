import type { TaskPriority } from '../types'
import { PRIORITY_LABELS } from '../constants'

export const PriorityBadge = ({ priority }: { priority: TaskPriority }) => (
  <span className={`priority-badge priority-${priority}`}>
    {PRIORITY_LABELS[priority]}
  </span>
)
