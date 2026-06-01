import { FormEvent, useEffect, useMemo, useState } from 'react'
import { createRequest } from '../api/client'
import type { AuthMode, AuthState, Toast, User } from '../types'
import { validateAuth } from '../utils/validation'

const readAuth = (): AuthState | null => {
  const raw = localStorage.getItem('pm_auth')
  return raw ? JSON.parse(raw) : null
}

type UseAuthArgs = {
  showToast: (message: string, type?: Toast['type']) => void
}

export const useAuth = ({ showToast }: UseAuthArgs) => {
  const [auth, setAuth] = useState<AuthState | null>(() => readAuth())
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  const request = useMemo(() => createRequest(auth), [auth])

  useEffect(() => {
    if (!auth) {
      localStorage.removeItem('pm_auth')
      return
    }

    localStorage.setItem('pm_auth', JSON.stringify(auth))
  }, [auth])

  const handleAuth = async (event: FormEvent) => {
    event.preventDefault()
    const validationError = validateAuth(authMode, authForm)

    if (validationError) {
      showToast(validationError)
      return
    }

    setLoading(true)

    try {
      const path = authMode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const payload =
        authMode === 'login'
          ? { email: authForm.email.trim(), password: authForm.password }
          : {
              name: authForm.name.trim(),
              email: authForm.email.trim(),
              password: authForm.password,
            }
      const body = await request<{ token?: string; user?: User }>(path, {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (authMode === 'register') {
        setAuthMode('login')
        setAuthForm((current) => ({ ...current, password: '' }))
        showToast('Account created. Sign in to continue.', 'success')
        return
      }

      setAuth({ token: body.token!, user: body.user! })
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return {
    auth,
    authForm,
    authMode,
    handleAuth,
    loading,
    request,
    setAuth,
    setAuthForm,
    setAuthMode,
    setShowPassword,
    showPassword,
  }
}
