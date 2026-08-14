import type { Activity, Notification } from '../../types'
import { formatDate } from '../../utils/date'
import styles from './Inspector.module.css'

type Props = {
  notifications: Notification[]
  activities: Activity[]
  onMarkNotificationsRead: () => void
}

export const Inspector = ({ notifications, activities, onMarkNotificationsRead }: Props) => {
  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <aside className={styles.inspector}>
      <section className={styles.panel}>
        <div className={styles.panelTitle}>
          <h2>Notifications</h2>
          <div className={styles.panelTitleRight}>
            {unreadCount > 0 && (
              <button type="button" className={styles.markReadBtn} onClick={onMarkNotificationsRead}>
                Mark all read
              </button>
            )}
            <span className={unreadCount > 0 ? styles.badgeUnread : ''}>
              {unreadCount > 0 ? `${unreadCount} new` : notifications.length}
            </span>
          </div>
        </div>
        <div className={styles.feedList}>
          {notifications.length === 0 ? (
            <p className="empty">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <article className={`${styles.feedItem} ${!n.isRead ? styles.feedItemUnread : ''}`} key={n._id}>
                <span className={styles.feedDot} />
                <div>
                  <strong>{n.message}</strong>
                  <small>{formatDate(n.createdAt)}</small>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelTitle}>
          <h2>Activity</h2>
          <span>{activities.length}</span>
        </div>
        <div className={styles.feedList}>
          {activities.length === 0 ? (
            <p className="empty">No activity yet.</p>
          ) : (
            activities.map((a) => (
              <article className={styles.feedItem} key={a._id}>
                <span className="activity-icon">{a.action[0]?.toUpperCase() || 'A'}</span>
                <div>
                  <strong>{a.action.replaceAll('_', ' ')}</strong>
                  <small>
                    {a.user?.name || 'System'} - {formatDate(a.createdAt)}
                  </small>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </aside>
  )
}
