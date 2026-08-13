import type { FormEvent } from 'react'
import { PasswordToggleIcon } from './PasswordToggleIcon'
import styles from './AuthScreen/AuthScreen.module.css'

type AuthForm = { name: string; email: string; password: string }

type Props = {
  authMode: 'login' | 'register'
  setAuthMode: (mode: 'login' | 'register') => void
  authForm: AuthForm
  setAuthForm: (form: AuthForm) => void
  showPassword: boolean
  setShowPassword: (v: boolean) => void
  loading: boolean
  onSubmit: (e: FormEvent) => void
}

export const AuthScreen = ({
  authMode,
  setAuthMode,
  authForm,
  setAuthForm,
  showPassword,
  setShowPassword,
  loading,
  onSubmit,
}: Props) => (
  <main className={styles.authShell}>
    <section className={styles.authPanel}>
      <div>
        <p className={styles.eyebrow}>Internal PMS</p>
        <h1>Project work, live on every screen.</h1>
        <p className={styles.lede}>
          Sign in to manage projects, move tasks across the board, and watch updates arrive
          in real time for every project member.
        </p>
      </div>

      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.segmented}>
          <button
            type="button"
            className={authMode === 'login' ? styles.active : ''}
            onClick={() => {
  setAuthMode('login')
  setShowPassword(false)
  setAuthForm({ name: '', email: '', password: '' })
}}
          >
            Login
          </button>
          <button
            type="button"
            className={authMode === 'register' ? styles.active : ''}
            onClick={() => {
  setAuthMode('register')
  setShowPassword(false)
  setAuthForm({ name: '', email: '', password: '' })
}}
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
              onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
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
            onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
          />
        </label>

        <label>
          Password
          <span className={styles.passwordField}>
            <input
              required
              minLength={6}
              maxLength={64}
              pattern="(?=.*[A-Za-z])(?=.*\d).+"
              title="Use at least one letter and one number."
              type={showPassword ? 'text' : 'password'}
              value={authForm.password}
              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
            />
            <button
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className={styles.passwordToggle}
              type="button"
              onClick={() => setShowPassword(!showPassword)}
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
