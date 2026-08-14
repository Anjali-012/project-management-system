import { useState } from 'react'
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
  auth,
  realtimeStatus,
  notifications,
  filters,
  onFiltersChange,
  onLogout,
}: Props) => {
  const [profileOpen, setProfileOpen] = useState(false)

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length

  const initials =
    auth.user.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'

  return (
    <header className={styles.topbar}>
      <label className={styles.globalSearch}>
        <span className={styles.searchIcon}>⌕</span>

        <input
          placeholder="Search tasks, projects, members..."
          value={filters.search}
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              search: event.target.value,
            })
          }
        />

        <kbd>⌘ K</kbd>
      </label>

      <div className={styles.topbarRight}>
        <span
          className={`${styles.connectionState} ${
            realtimeStatus.toLowerCase().includes('disconnected')
              ? styles.connectionOffline
              : ''
          }`}
        >
          {realtimeStatus}
        </span>

        <button
          type="button"
          className={styles.notificationButton}
          aria-label={`${unreadCount} unread notifications`}
        >
          ♢

          {unreadCount > 0 && (
            <span>{unreadCount}</span>
          )}
        </button>

        <div className={styles.profileWrapper}>
          <button
            type="button"
            className={`${styles.topbarUser} ${
              profileOpen ? styles.topbarUserOpen : ''
            }`}
            onClick={() => setProfileOpen((open) => !open)}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
          >
            <span className={styles.userAvatar}>
              {initials}
            </span>

            <span className={styles.userDetails}>
              <strong>{auth.user.name}</strong>
              <small>{auth.user.role}</small>
            </span>

            <i className={profileOpen ? styles.arrowOpen : ''}>
              ⌄
            </i>
          </button>

          {profileOpen && (
            <div className={styles.profileMenu} role="menu">
              <div className={styles.profileMenuHeader}>
                <span className={styles.profileMenuAvatar}>
                  {initials}
                </span>

                <div>
                  <strong>{auth.user.name}</strong>
                  <small>{auth.user.email}</small>
                </div>
              </div>

              <div className={styles.profileDivider} />

              <div className={styles.profileInfo}>
                <span>Role</span>
                <strong>{auth.user.role}</strong>
              </div>

              <button
                type="button"
                className={styles.signOutButton}
                onClick={() => {
                  setProfileOpen(false)
                  onLogout()
                }}
                role="menuitem"
              >
                <span>↪</span>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}