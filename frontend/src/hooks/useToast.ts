import { useCallback, useEffect, useState } from 'react'
import type { Toast } from '../types'

export const useToast = () => {
  const [toast, setToast] = useState<Toast | null>(null)

  const showToast = useCallback(
    (message: string, type: Toast['type'] = 'error') => {
      setToast({ id: Date.now(), message, type })
    },
    [],
  )

  useEffect(() => {
    if (!toast) return

    const timer = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  return { toast, showToast }
}
