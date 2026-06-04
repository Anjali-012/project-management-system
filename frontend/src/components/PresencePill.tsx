import type { PresenceUser } from '../types'

export const PresencePill = ({ users }: { users: PresenceUser[] }) => {
  if (users.length === 0) return null
  const shown = users.slice(0, 4)
  const rest = users.length - shown.length

  return (
    <div className="presence" title={users.map((u) => u.name).join(', ')}>
      {shown.map((u) => (
        <span key={u.id} className="presence-avatar">
          {u.name ? u.name[0].toUpperCase() : '?'}
        </span>
      ))}
      {rest > 0 && <span className="presence-avatar presence-rest">+{rest}</span>}
    </div>
  )
}
