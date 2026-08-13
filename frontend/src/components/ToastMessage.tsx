import type { Toast } from '../types'
import styles from './ToastMessage/ToastMessage.module.css'

type Props = { toast: Toast }

export const ToastMessage = ({ toast }: Props) => (
  <div className={`${styles.toast} ${styles[toast.type]}`} role="status" aria-live="polite">
    {toast.message}
  </div>
)
