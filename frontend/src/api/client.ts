import { API_URL } from '../constants'

/**
 * Creates a pre-configured fetch wrapper bound to the current auth token.
 * Returns a `request` function identical to the one previously inlined in App.tsx
 * but now shareable across hooks and components.
 */
export const createApiClient = (token?: string) => {
  const request = async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })

    const body = await response.json()

    if (!response.ok) {
      throw new Error(body.message || 'Something went wrong')
    }

    return body
  }

  return { request }
}

export type ApiClient = ReturnType<typeof createApiClient>