import type { TaskStatus } from './types'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5001'
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? API_URL

export const statusLabels: Record<TaskStatus, string> = {
  todo: 'Todo',
  'in-progress': 'In Progress',
  done: 'Done',
}

export const statusOrder: TaskStatus[] = ['todo', 'in-progress', 'done']
