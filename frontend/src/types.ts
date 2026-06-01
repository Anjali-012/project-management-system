export type User = {
  id: string
  name: string
  email: string
  role: 'admin' | 'member'
}

export type Member = Pick<User, 'id' | 'name' | 'email' | 'role'> & { _id?: string }

export type Project = {
  _id: string
  title: string
  description?: string
  members: Array<Member | string>
  createdBy: Member
}

export type TaskStatus = 'todo' | 'in-progress' | 'done'

export type Task = {
  _id: string
  title: string
  description?: string
  status: TaskStatus
  project: { _id: string; title: string } | string
  assignedTo?: (Pick<User, 'id' | 'name' | 'email'> & { _id?: string }) | null
  createdAt: string
}

export type Activity = {
  _id: string
  action: string
  user?: Pick<User, 'name' | 'email'>
  metadata?: Record<string, string>
  createdAt: string
}

export type Notification = {
  _id: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

export type AuthState = {
  token: string
  user: User
}

export type TaskUpdatePayload = {
  title?: string
  description?: string
  assignedTo?: string | null
  status?: TaskStatus
}

export type Toast = {
  id: number
  message: string
  type: 'error' | 'success' | 'info'
}

export type AuthMode = 'login' | 'register'
