import type { Toast } from '../types'

type Props = { toast: Toast }

export const ToastMessage = ({ toast }: Props) => (
  <div className={`toast ${toast.type}`} role="status" aria-live="polite">
    {toast.message}
  </div>
)