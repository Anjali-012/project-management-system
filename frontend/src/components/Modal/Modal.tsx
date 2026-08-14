import { useEffect, type ReactNode } from 'react'
import styles from './Modal.module.css'

type Props = {
  title: string
  onClose: () => void
  children: ReactNode
}

export const Modal = ({ title, onClose, children }: Props) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className={styles.modal}>
        <div className={styles.header}>
          <h2 id="modal-title">{title}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
