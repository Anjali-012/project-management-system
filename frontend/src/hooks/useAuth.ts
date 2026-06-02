import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createApiClient } from '../api/client'
import {
  ALPHA_SPACE_PATTERN,
  EMAIL_PATTERN,
  PASSWORD_PATTERN,
} from '../constants'
import type { AuthState, User } from '../types'
import { validateField } from '../utils/validation'

const STORAGE_KEY = 'pm_auth'

const readAuth = (): AuthState | null => {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : null
}

export const useAuth = (showToast: (msg: string, type?: 'error' | 'success' | 'info') => void) => {
  const [auth, setAuthState] = useState<AuthState | null>(() => readAuth())
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  // Sync auth to localStorage
  useEffect(() => {
    if (!auth) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
  }, [auth])

  const validateAuthForm = useCallback(() => {
    if (authMode === 'register') {
      const nameError = validateField('Name', authForm.name, {
        required: true,
        min: 2,
        max: 50,
        pattern: ALPHA_SPACE_PATTERN,
        patternMessage: 'Name can contain alphabets and spaces only.',
      })
      if (nameError) return nameError
    }

    const emailError = validateField('Email', authForm.email, {
      required: true,
      max: 120,
      pattern: EMAIL_PATTERN,
      patternMessage: 'Enter a valid email address.',
    })
    if (emailError) return emailError

    return validateField('Password', authForm.password, {
      required: true,
      min: 6,
      max: 64,
      pattern: PASSWORD_PATTERN,
      patternMessage: 'Password must include at least one letter and one number.',
    })
  }, [authMode, authForm])

  const handleAuth = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()
      const validationError = validateAuthForm()
      if (validationError) {
        showToast(validationError)
        return
      }

      setLoading(true)
      try {
        // No token yet — use a bare client
        const { request } = createApiClient()
        const path = authMode === 'login' ? '/api/auth/login' : '/api/auth/register'
        const payload =
          authMode === 'login'
            ? { email: authForm.email.trim(), password: authForm.password }
            : { name: authForm.name.trim(), email: authForm.email.trim(), password: authForm.password }

        const body = await request<{ token?: string; user?: User }>(path, {
          method: 'POST',
          body: JSON.stringify(payload),
        })

        if (authMode === 'register') {
          setAuthMode('login')
          setAuthForm((c) => ({ ...c, password: '' }))
          showToast('Account created. Sign in to continue.', 'success')
          return
        }

        setAuthState({ token: body.token!, user: body.user! })
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Authentication failed')
      } finally {
        setLoading(false)
      }
    },
    [authMode, authForm, validateAuthForm, showToast],
  )

  const logout = useCallback(() => {
    setAuthState(null)
  }, [])

  return {
    auth,
    authMode,
    setAuthMode,
    showPassword,
    setShowPassword,
    authForm,
    setAuthForm,
    loading,
    handleAuth,
    logout,
  }
}