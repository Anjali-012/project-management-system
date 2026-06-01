import { API_URL } from '../constants'
import type { AuthState } from '../types'

export const createRequest =
  (auth: AuthState | null) =>
  async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
        ...options.headers,
      },
    })
    const body = await response.json()

    if (!response.ok) {
      throw new Error(body.message || 'Something went wrong')
    }

    return body
  }
