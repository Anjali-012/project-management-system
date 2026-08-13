import type { AuthState, Notification, TaskFilters } from '../types'

type Props = {
  auth: AuthState
  realtimeStatus: string
  notifications: Notification[]
  filters: TaskFilters
  onFiltersChange: (filters: TaskFilters) => void
  onLogout: () => void
}

export const Topbar = ({
  auth, realtimeStatus, notifications, filters, onFiltersChange, onLogout,
}: Props) => {
  const unreadCount = notifications.filter((notification) => !notification.isRead).length

  return (
    <header className="topbar">
      <label className="global-search">
        <span>⌕</span>
        <input
          placeholder="Search tasks, projects, members..."
          value={filters.search}
          onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
        />
        <kbd>⌘ K</kbd>
      </label>

      <div className="topbar-right">
        <span className="connection-state">{realtimeStatus}</span>
        <button type="button" className="notification-button" aria-label={`${unreadCount} unread notifications`}>
          ♢
          {unreadCount > 0 && <span>{unreadCount}</span>}
        </button>
        <button type="button" className="topbar-user" onClick={onLogout} aria-label="Sign out">
          <span className="user-avatar">{auth.user.name[0]?.toUpperCase() || '?'}</span>
          <span>
            <strong>{auth.user.name}</strong>
            <small>{auth.user.role}</small>
          </span>
          <i>⌄</i>
        </button>
      </div>
    </header>
  )
}
