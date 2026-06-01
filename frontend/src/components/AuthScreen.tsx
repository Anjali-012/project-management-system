import type { FormEvent } from 'react'
import type { AuthMode } from '../types'
import { PasswordToggleIcon } from './PasswordToggleIcon'

type AuthForm = {
  name: string
  email: string
  password: string
}

type Props = {
  authForm: AuthForm
  authMode: AuthMode
  loading: boolean
  showPassword: boolean
  onSubmit: (event: FormEvent) => void
  setAuthForm: (form: AuthForm) => void
  setAuthMode: (mode: AuthMode) => void
  setShowPassword: (updater: (current: boolean) => boolean) => void
}

export function AuthScreen(props: Props) {
  const {
    authForm,
    authMode,
    loading,
    onSubmit,
    setAuthForm,
    setAuthMode,
    setShowPassword,
    showPassword,
  } = props

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div>
          <p className="eyebrow">Internal PMS</p>
          <h1>Project work, live on every screen.</h1>
          <p className="lede">
            Sign in to manage projects, move tasks across the board, and watch
            updates arrive in real time for every project member.
          </p>
        </div>

        <form className="form" onSubmit={onSubmit}>
          <div className="segmented">
            <button
              type="button"
              className={authMode === 'login' ? 'active' : ''}
              onClick={() => setAuthMode('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={authMode === 'register' ? 'active' : ''}
              onClick={() => setAuthMode('register')}
            >
              Register
            </button>
          </div>

          {authMode === 'register' && (
            <label>
              Name
              <input
                required
                minLength={2}
                maxLength={50}
                pattern="[A-Za-z ]+"
                title="Use alphabets and spaces only."
                value={authForm.name}
                onChange={(event) =>
                  setAuthForm({ ...authForm, name: event.target.value })
                }
              />
            </label>
          )}

          <label>
            Email
            <input
              required
              maxLength={120}
              type="email"
              value={authForm.email}
              onChange={(event) =>
                setAuthForm({ ...authForm, email: event.target.value })
              }
            />
          </label>

          <label>
            Password
            <span className="password-field">
              <input
                required
                minLength={6}
                maxLength={64}
                pattern="(?=.*[A-Za-z])(?=.*\d).+"
                title="Use at least one letter and one number."
                type={showPassword ? 'text' : 'password'}
                value={authForm.password}
                onChange={(event) =>
                  setAuthForm({ ...authForm, password: event.target.value })
                }
              />
              <button
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword((current) => !current)}
              >
                <PasswordToggleIcon visible={showPassword} />
              </button>
            </span>
          </label>

          <button className="primary" type="submit" disabled={loading}>
            {loading ? 'Please wait' : authMode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </section>
    </main>
  )
}
