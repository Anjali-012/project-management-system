import { useState } from 'react'
import { Modal } from '../Modal/Modal'
import styles from './DeleteTaskModal.module.css'

type Props = {
  taskTitle: string
  onDelete: () => Promise<void> | void
  onClose: () => void
}

export const DeleteTaskModal = ({ taskTitle, onDelete, onClose }: Props) => {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete()
      onClose()
    } catch {
      // The existing task action reports the error through the toast flow.
    } finally {
      setDeleting(false)
    }
  }

  const handleClose = () => {
    if (!deleting) onClose()
  }

  return (
    <Modal title="Delete task?" onClose={handleClose}>
      <p className={styles.message}>
        Are you sure you want to delete &ldquo;{taskTitle}&rdquo;? This action cannot be undone.
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.cancel} onClick={handleClose} disabled={deleting}>
          Cancel
        </button>
        <button type="button" className={styles.delete} onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </Modal>
  )
}
