import type { PresenceUser } from '../../types'
import styles from './PresencePill.module.css'

export const PresencePill = ({ users }: { users: PresenceUser[] }) => {
  if (users.length === 0) return null
  const shown = users.slice(0, 4)
  const rest = users.length - shown.length

  return (
    <div className={styles.presence} title={users.map((u) => u.name).join(', ')}>
      {shown.map((u) => (
        <span key={u.id} className={styles.presenceAvatar}>
          {u.name ? u.name[0].toUpperCase() : '?'}
        </span>
      ))}
      {rest > 0 && <span className={`${styles.presenceAvatar} ${styles.presenceRest}`}>+{rest}</span>}
    </div>
  )
}
