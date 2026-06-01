import type { Activity, Notification } from '../types'
import { formatDate } from '../utils/date'

type Props = {
  activities: Activity[]
  notifications: Notification[]
}

export function Inspector({ activities, notifications }: Props) {
  return (
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
            notifications.map((notification) => (
              <article className="feed-item" key={notification._id}>
                <strong>{notification.message}</strong>
                <small>{formatDate(notification.createdAt)}</small>
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
            activities.map((activity) => (
              <article className="feed-item" key={activity._id}>
                <strong>{activity.action.replaceAll('_', ' ')}</strong>
                <small>
                  {activity.user?.name || 'System'} - {formatDate(activity.createdAt)}
                </small>
              </article>
            ))
          )}
        </div>
      </section>
    </aside>
  )
}
