import { useCallback, useRef, useState, type FormEvent } from 'react'
import type { Comment, Task } from '../../types'
import { formatDate } from '../../utils/date'
import styles from './CommentPanel.module.css'

type Props = {
  task: Task
  canComment: boolean
  onAddComment: (taskId: string, text: string) => Promise<void>
  onClose: () => void
}

export const CommentPanel = ({ task, canComment, onAddComment, onClose }: Props) => {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    setLoading(true)
    try {
      await onAddComment(task._id, trimmed)
      setText('')
      inputRef.current?.focus()
    } finally {
      setLoading(false)
    }
  }, [text, task._id, onAddComment])

  return (
    <div className={styles.commentPanel}>
      <div className={styles.commentPanelHeader}>
        <h3>{task.title}</h3>
        <button type="button" className="icon-button" onClick={onClose}>✕</button>
      </div>

      <div className={styles.commentList}>
        {task.comments.length === 0
          ? <p className="empty">No comments yet.</p>
          : task.comments.map((c: Comment) => (
            <article key={c._id} className={styles.commentItem}>
              <div className={styles.commentMeta}>
                <span className={styles.commentAuthor}>{c.user?.name ?? 'Member'}</span>
                <small>{formatDate(c.createdAt)}</small>
              </div>
              <p>{c.text}</p>
            </article>
          ))
        }
      </div>

      {canComment && (
      <form className={styles.commentForm} onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          placeholder="Add a comment…"
          maxLength={1000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
        />
        <button className="primary" type="submit" disabled={loading || !text.trim()}>
          {loading ? '…' : 'Post'}
        </button>
      </form>
      )}
    </div>
  )
}
