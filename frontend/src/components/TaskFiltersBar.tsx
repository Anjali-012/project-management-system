import type { Member, TaskFilters, TaskPriority, TaskStatus } from '../types'
import { STATUS_LABELS, STATUS_ORDER, PRIORITY_LABELS, PRIORITY_ORDER } from '../constants'
import { getMemberId, getMemberName } from '../utils/member'

type Props = {
  filters: TaskFilters
  members: Array<Member | string>
  onChange: (filters: TaskFilters) => void
  onClear: () => void
}

export const TaskFiltersBar = ({ filters, members, onChange, onClear }: Props) => {
  const hasActive = filters.search || filters.status || filters.priority || filters.assignedTo

  return (
    <div className="filters-bar">
      <input
        className="filter-search"
        placeholder="Search tasks…"
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
      />

      <select
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value as TaskStatus | '' })}
      >
        <option value="">All statuses</option>
        {STATUS_ORDER.map((s) => (
          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
        ))}
      </select>

      <select
        value={filters.priority}
        onChange={(e) => onChange({ ...filters, priority: e.target.value as TaskPriority | '' })}
      >
        <option value="">All priorities</option>
        {PRIORITY_ORDER.map((p) => (
          <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
        ))}
      </select>

      <select
        value={filters.assignedTo}
        onChange={(e) => onChange({ ...filters, assignedTo: e.target.value })}
      >
        <option value="">All members</option>
        {members.map((m) => (
          <option key={getMemberId(m)} value={getMemberId(m)}>{getMemberName(m)}</option>
        ))}
      </select>

      {hasActive && (
        <button type="button" className="filter-clear" onClick={onClear}>
          Clear
        </button>
      )}
    </div>
  )
}
