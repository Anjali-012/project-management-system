import type { AuthState, Notification, TaskFilters } from '../types'
import styles from './Topbar/Topbar.module.css'

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
    <header className={styles.topbar}>
      <label className={styles.globalSearch}>
        <span className={styles.searchIcon}>⌕</span>
        <input
          placeholder="Search tasks, projects, members..."
          value={filters.search}
          onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
        />
        <kbd>⌘ K</kbd>
      </label>

      <div className={styles.topbarRight}>
        <span className={styles.connectionState}>{realtimeStatus}</span>
        <button type="button" className={styles.notificationButton} aria-label={`${unreadCount} unread notifications`}>
          ♢
          {unreadCount > 0 && <span>{unreadCount}</span>}
        </button>
        <button type="button" className={styles.topbarUser} onClick={onLogout} aria-label="Sign out">
          <span className={styles.userAvatar}>{auth.user.name[0]?.toUpperCase() || '?'}</span>
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
