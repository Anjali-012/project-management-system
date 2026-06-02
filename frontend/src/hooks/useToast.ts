import { useCallback, useEffect, useState } from 'react'
import type { Toast } from '../types'

const TOAST_DURATION_MS = 3200

export const useToast = () => {
  const [toast, setToast] = useState<Toast | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), TOAST_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [toast])

  const showToast = useCallback((message: string, type: Toast['type'] = 'error') => {
    setToast({ id: Date.now(), message, type })
  }, [])

  return { toast, showToast }
}