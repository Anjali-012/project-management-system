import type { Toast } from '../types'

type Props = {
  toast: Toast | null
}

export function ToastMessage({ toast }: Props) {
  if (!toast) return null

  return (
    <div className={`toast ${toast.type}`} role="status" aria-live="polite">
      {toast.message}
    </div>
  )
}
