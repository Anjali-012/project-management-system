import type { TaskPriority, TaskStatus } from './types'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5001'
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? API_URL

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Todo',
  'in-progress': 'In Progress',
  done: 'Done',
}

export const STATUS_ORDER: TaskStatus[] = ['todo', 'in-progress', 'done']

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

export const PRIORITY_ORDER: TaskPriority[] = ['low', 'medium', 'high', 'urgent']

// Validation patterns
export const ALPHA_SPACE_PATTERN = /^[A-Za-z ]+$/
export const ALPHA_NUMERIC_TEXT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 .,'()/_-]*$/
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/