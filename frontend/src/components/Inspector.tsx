import type { Activity, Notification } from '../types'
import { formatDate } from '../utils/date'

type Props = {
  notifications: Notification[]
  activities: Activity[]
}

export const Inspector = ({ notifications, activities }: Props) => (
  <aside className="inspector">
    <section className="panel">
      <div className="panel-title">
        <h2>Notifications</h2>
        <span>{notifications.length}</span>
      </div>
      <div className="feed-list">
        {notifications.length === 0 ? (
          <p className="empty">No notifications yet.</p>
        ) : (
          notifications.map((n) => (
            <article className="feed-item" key={n._id}>
              <strong>{n.message}</strong>
              <small>{formatDate(n.createdAt)}</small>
            </article>
          ))
        )}
      </div>
    </section>

    <section className="panel">
      <div className="panel-title">
        <h2>Activity</h2>
        <span>{activities.length}</span>
      </div>
      <div className="feed-list">
        {activities.length === 0 ? (
          <p className="empty">No activity yet.</p>
        ) : (
          activities.map((a) => (
            <article className="feed-item" key={a._id}>
              <strong>{a.action.replaceAll('_', ' ')}</strong>
              <small>
                {a.user?.name || 'System'} — {formatDate(a.createdAt)}
              </small>
            </article>
          ))
        )}
      </div>
    </section>
  </aside>
)