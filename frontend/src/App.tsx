import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DragEvent, FormEvent } from 'react'
import { io, Socket } from 'socket.io-client'
import './App.css'

type User = {
  id: string
  name: string
  email: string
  role: 'admin' | 'member'
}

type Member = Pick<User, 'id' | 'name' | 'email' | 'role'> & { _id?: string }

type Project = {
  _id: string
  title: string
  description?: string
  members: Array<Member | string>
  createdBy: Member
}

type TaskStatus = 'todo' | 'in-progress' | 'done'

type Task = {
  _id: string
  title: string
  description?: string
  status: TaskStatus
  project: { _id: string; title: string } | string
  assignedTo?: Pick<User, 'id' | 'name' | 'email'> | null
  createdAt: string
}

type Activity = {
  _id: string
  action: string
  user?: Pick<User, 'name' | 'email'>
  metadata?: Record<string, string>
  createdAt: string
}

type Notification = {
  _id: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

type AuthState = {
  token: string
  user: User
}

type TaskUpdatePayload = {
  title?: string
  description?: string
  assignedTo?: string | null
  status?: TaskStatus
}

type ValidationRules = {
  min?: number
  max?: number
  pattern?: RegExp
  patternMessage?: string
  required?: boolean
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5001'
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? API_URL

const statusLabels: Record<TaskStatus, string> = {
  todo: 'Todo',
  'in-progress': 'In Progress',
  done: 'Done',
}

const statusOrder: TaskStatus[] = ['todo', 'in-progress', 'done']
const alphaSpacePattern = /^[A-Za-z ]+$/
const alphaNumericTextPattern = /^[A-Za-z0-9][A-Za-z0-9 .,'()/_-]*$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).+$/

const readAuth = (): AuthState | null => {
  const raw = localStorage.getItem('pm_auth')
  return raw ? JSON.parse(raw) : null
}

const getMemberId = (member: Member | string) =>
  typeof member === 'string' ? member : member.id || member._id || ''

const getMemberName = (member: Member | string) =>
  typeof member === 'string' ? 'Member' : member.name

const validateField = (label: string, value: string, rules: ValidationRules) => {
  const trimmed = value.trim()

  if (rules.required && !trimmed) {
    return `${label} is required.`
  }

  if (!trimmed) {
    return ''
  }

  if (rules.min && trimmed.length < rules.min) {
    return `${label} must be at least ${rules.min} characters.`
  }

  if (rules.max && trimmed.length > rules.max) {
    return `${label} must be ${rules.max} characters or less.`
  }

  if (rules.pattern && !rules.pattern.test(trimmed)) {
    return rules.patternMessage || `${label} contains invalid characters.`
  }

  return ''
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

function App() {
  const [auth, setAuth] = useState<AuthState | null>(() => readAuth())
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const socketRef = useRef<Socket | null>(null)
  const [socketConnected, setSocketConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [projectForm, setProjectForm] = useState({ title: '', description: '' })
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
  })
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    status: 'todo' as TaskStatus,
  })
  const [memberEmail, setMemberEmail] = useState('')
  const [draggedTaskId, setDraggedTaskId] = useState('')

  const selectedProject = projects.find((project) => project._id === selectedProjectId)

  const tasksByStatus = useMemo(
    () =>
      statusOrder.reduce(
        (groups, status) => ({
          ...groups,
          [status]: tasks.filter((task) => task.status === status),
        }),
        {} as Record<TaskStatus, Task[]>,
      ),
    [tasks],
  )

  const request = useCallback(
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
    },
    [auth],
  )

  const upsertTask = useCallback((task: Task) => {
    setTasks((current) => {
      const exists = current.some((existing) => existing._id === task._id)

      if (!exists) {
        return [task, ...current]
      }

      return current.map((existing) => (existing._id === task._id ? task : existing))
    })
  }, [])

  const loadProjectMeta = useCallback(async () => {
    if (!auth || !selectedProjectId) {
      return
    }

    const [activityBody, notificationBody] = await Promise.all([
      request<{ data: Activity[] }>(`/api/activity/${selectedProjectId}`),
      request<{ data: Notification[] }>('/api/notifications'),
    ])

    setActivities(activityBody.data.slice(0, 8))
    setNotifications(notificationBody.data.slice(0, 8))
  }, [auth, request, selectedProjectId])

  useEffect(() => {
    if (!auth) {
      localStorage.removeItem('pm_auth')
      return
    }

    localStorage.setItem('pm_auth', JSON.stringify(auth))
  }, [auth])

  useEffect(() => {
    if (!auth) {
      return
    }

    const loadProjects = async () => {
      setLoading(true)
      setError('')
      try {
        const body = await request<{ data: Project[] }>('/api/projects')
        setProjects(body.data)
        setSelectedProjectId((current) => current || body.data[0]?._id || '')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load projects')
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [auth, request])

  useEffect(() => {
    if (!auth) {
      return
    }

    const nextSocket = io(SOCKET_URL, {
      auth: { token: auth.token },
    })

    nextSocket.on('task:created', (task: Task) => {
      upsertTask(task)
      loadProjectMeta().catch(() => undefined)
    })

    nextSocket.on('task:updated', (task: Task) => {
      upsertTask(task)
      loadProjectMeta().catch(() => undefined)
    })

    nextSocket.on('task:deleted', ({ id }: { id: string }) => {
      setTasks((current) => current.filter((task) => task._id !== id))
      loadProjectMeta().catch(() => undefined)
    })

    nextSocket.on('connect', () => setSocketConnected(true))
    nextSocket.on('disconnect', () => setSocketConnected(false))
    socketRef.current = nextSocket

    return () => {
      nextSocket.disconnect()
      socketRef.current = null
      setSocketConnected(false)
    }
  }, [auth, loadProjectMeta, upsertTask])

  useEffect(() => {
    if (!auth || !selectedProjectId) {
      return
    }

    const loadWorkspace = async () => {
      setLoading(true)
      setError('')
      try {
        const body = await request<{ data: Task[] }>(
          `/api/tasks?projectId=${selectedProjectId}&limit=100`,
        )
        setTasks(body.data)
        await loadProjectMeta()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load workspace')
      } finally {
        setLoading(false)
      }
    }

    socketRef.current?.emit('project:join', selectedProjectId)
    loadWorkspace()

    return () => {
      socketRef.current?.emit('project:leave', selectedProjectId)
    }
  }, [auth, loadProjectMeta, request, selectedProjectId])

  const validateAuthForm = () => {
    if (authMode === 'register') {
      const nameError = validateField('Name', authForm.name, {
        required: true,
        min: 2,
        max: 50,
        pattern: alphaSpacePattern,
        patternMessage: 'Name can contain alphabets and spaces only.',
      })

      if (nameError) {
        return nameError
      }
    }

    const emailError = validateField('Email', authForm.email, {
      required: true,
      max: 120,
      pattern: emailPattern,
      patternMessage: 'Enter a valid email address.',
    })

    if (emailError) {
      return emailError
    }

    return validateField('Password', authForm.password, {
      required: true,
      min: 6,
      max: 64,
      pattern: passwordPattern,
      patternMessage: 'Password must include at least one letter and one number.',
    })
  }

  const validateProjectForm = () =>
    validateField('Project title', projectForm.title, {
      required: true,
      min: 3,
      max: 80,
      pattern: alphaNumericTextPattern,
      patternMessage: 'Project title must start with a letter or number.',
    }) ||
    validateField('Project description', projectForm.description, {
      max: 300,
    })

  const validateTaskForm = (form: typeof taskForm | typeof editForm) =>
    validateField('Task title', form.title, {
      required: true,
      min: 3,
      max: 100,
      pattern: alphaNumericTextPattern,
      patternMessage: 'Task title must start with a letter or number.',
    }) ||
    validateField('Task description', form.description, {
      max: 500,
    })

  const handleAuth = async (event: FormEvent) => {
    event.preventDefault()
    const validationError = validateAuthForm()

    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')

    try {
      const path = authMode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const payload =
        authMode === 'login'
          ? {
              email: authForm.email.trim(),
              password: authForm.password,
            }
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
        setError('Account created. Sign in to continue.')
        return
      }

      setAuth({ token: body.token!, user: body.user! })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (event: FormEvent) => {
    event.preventDefault()
    const validationError = validateProjectForm()

    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    try {
      const body = await request<{ data: Project }>('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          title: projectForm.title.trim(),
          description: projectForm.description.trim(),
        }),
      })
      setProjects((current) => [body.data, ...current])
      setSelectedProjectId(body.data._id)
      setProjectForm({ title: '', description: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create project')
    }
  }

  const createTask = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedProjectId) {
      return
    }

    const validationError = validateTaskForm(taskForm)

    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    try {
      const body = await request<{ data: Task }>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: taskForm.title.trim(),
          description: taskForm.description.trim(),
          projectId: selectedProjectId,
          assignedTo: taskForm.assignedTo || undefined,
        }),
      })
      upsertTask(body.data)
      setTaskForm({ title: '', description: '', assignedTo: '' })
      await loadProjectMeta()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create task')
    }
  }

  const updateTask = async (task: Task, payload: TaskUpdatePayload) => {
    const body = await request<{ data: Task }>(`/api/tasks/${task._id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    upsertTask(body.data)
    await loadProjectMeta()
  }

  const updateTaskStatus = async (task: Task, status: TaskStatus) => {
    setError('')
    try {
      await updateTask(task, { status })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update task')
    }
  }

  const saveTaskEdit = async (event: FormEvent) => {
    event.preventDefault()
    if (!editTask) {
      return
    }

    const validationError = validateTaskForm(editForm)

    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    try {
      await updateTask(editTask, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        assignedTo: editForm.assignedTo || null,
        status: editForm.status,
      })
      setEditTask(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save task')
    }
  }

  const openTaskEdit = (task: Task) => {
    setEditTask(task)
    setEditForm({
      title: task.title,
      description: task.description || '',
      assignedTo: task.assignedTo?.id || '',
      status: task.status,
    })
  }

  const deleteTask = async (task: Task) => {
    setError('')
    try {
      await request(`/api/tasks/${task._id}`, {
        method: 'DELETE',
      })
      setTasks((current) => current.filter((item) => item._id !== task._id))
      await loadProjectMeta()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete task')
    }
  }

  const addMember = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedProjectId) {
      return
    }

    const validationError = validateField('Member email', memberEmail, {
      required: true,
      max: 120,
      pattern: emailPattern,
      patternMessage: 'Enter a valid member email address.',
    })

    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    try {
      const body = await request<{ data: Project }>(
        `/api/projects/${selectedProjectId}/members`,
        {
          method: 'POST',
          body: JSON.stringify({ email: memberEmail.trim() }),
        },
      )
      setProjects((current) =>
        current.map((project) => (project._id === body.data._id ? body.data : project)),
      )
      setMemberEmail('')
      await loadProjectMeta()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add member')
    }
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>, status: TaskStatus) => {
    event.preventDefault()
    const task = tasks.find((item) => item._id === draggedTaskId)
    setDraggedTaskId('')

    if (!task || task.status === status) {
      return
    }

    updateTaskStatus(task, status)
  }

  if (!auth) {
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

          <form className="form" onSubmit={handleAuth}>
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
              <input
                required
                minLength={6}
                maxLength={64}
                pattern="(?=.*[A-Za-z])(?=.*\d).+"
                title="Use at least one letter and one number."
                type="password"
                value={authForm.password}
                onChange={(event) =>
                  setAuthForm({ ...authForm, password: event.target.value })
                }
              />
            </label>
            {error && <p className="notice">{error}</p>}
            <button className="primary" type="submit" disabled={loading}>
              {loading ? 'Please wait' : authMode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span>PM</span>
          <div>
            <strong>{auth.user.name}</strong>
            <small>{auth.user.role}</small>
          </div>
        </div>

        <form className="compact-form" onSubmit={createProject}>
          <input
            required
            minLength={3}
            maxLength={80}
            pattern="[A-Za-z0-9][A-Za-z0-9 .,'()/_-]*"
            placeholder="New project"
            value={projectForm.title}
            onChange={(event) =>
              setProjectForm({ ...projectForm, title: event.target.value })
            }
          />
          <textarea
            maxLength={300}
            placeholder="Description"
            value={projectForm.description}
            onChange={(event) =>
              setProjectForm({ ...projectForm, description: event.target.value })
            }
          />
          <button type="submit">Add project</button>
        </form>

        <nav className="project-list">
          {projects.map((project) => (
            <button
              key={project._id}
              type="button"
              className={project._id === selectedProjectId ? 'selected' : ''}
              onClick={() => setSelectedProjectId(project._id)}
            >
              <strong>{project.title}</strong>
              <small>{project.members.length} members</small>
            </button>
          ))}
        </nav>

        <button
          className="ghost"
          type="button"
          onClick={() => {
            setAuth(null)
            setSelectedProjectId('')
            setProjects([])
            setTasks([])
            setActivities([])
            setNotifications([])
          }}
        >
          Sign out
        </button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{socketConnected ? 'Live' : 'Connecting'}</p>
            <h1>{selectedProject?.title || 'Select a project'}</h1>
            <p>{selectedProject?.description || 'Create or choose a project to begin.'}</p>
          </div>
          {selectedProject && (
            <form className="member-form" onSubmit={addMember}>
              <input
                required
                maxLength={120}
                type="email"
                placeholder="member@company.com"
                value={memberEmail}
                onChange={(event) => setMemberEmail(event.target.value)}
              />
              <button type="submit">Add member</button>
            </form>
          )}
        </header>

        {error && <p className="notice">{error}</p>}

        {selectedProject && (
          <form className="task-composer" onSubmit={createTask}>
            <input
              required
              minLength={3}
              maxLength={100}
              pattern="[A-Za-z0-9][A-Za-z0-9 .,'()/_-]*"
              placeholder="Task title"
              value={taskForm.title}
              onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })}
            />
            <input
              maxLength={500}
              placeholder="Description"
              value={taskForm.description}
              onChange={(event) =>
                setTaskForm({ ...taskForm, description: event.target.value })
              }
            />
            <select
              value={taskForm.assignedTo}
              onChange={(event) =>
                setTaskForm({ ...taskForm, assignedTo: event.target.value })
              }
            >
              <option value="">Unassigned</option>
              {selectedProject.members.map((member) => (
                <option key={getMemberId(member)} value={getMemberId(member)}>
                  {getMemberName(member)}
                </option>
              ))}
            </select>
            <button type="submit">Create task</button>
          </form>
        )}

        {loading && <p className="empty">Loading workspace...</p>}

        <section className="workspace-grid">
          <section className="board">
            {statusOrder.map((status) => (
              <div
                className="column"
                key={status}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event, status)}
              >
                <div className="column-header">
                  <h2>{statusLabels[status]}</h2>
                  <span>{tasksByStatus[status].length}</span>
                </div>

                <div className="task-list">
                  {tasksByStatus[status].map((task) => (
                    <article
                      className="task-card"
                      draggable
                      key={task._id}
                      onDragStart={() => setDraggedTaskId(task._id)}
                    >
                      <div>
                        <h3>{task.title}</h3>
                        {task.description && <p>{task.description}</p>}
                      </div>
                      <small>
                        {task.assignedTo
                          ? `Assigned to ${task.assignedTo.name}`
                          : 'Unassigned'}
                      </small>
                      <div className="task-actions">
                        <select
                          value={task.status}
                          onChange={(event) =>
                            updateTaskStatus(task, event.target.value as TaskStatus)
                          }
                        >
                          {statusOrder.map((option) => (
                            <option key={option} value={option}>
                              {statusLabels[option]}
                            </option>
                          ))}
                        </select>
                        <button type="button" onClick={() => openTaskEdit(task)}>
                          Edit
                        </button>
                        <button type="button" onClick={() => deleteTask(task)}>
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <aside className="inspector">
            <section className="panel">
              <div className="panel-title">
                <h2>Notifications</h2>
                <span>{notifications.length}</span>
              </div>
              {notifications.length === 0 ? (
                <p className="empty">No notifications yet.</p>
              ) : (
                notifications.map((notification) => (
                  <article className="feed-item" key={notification._id}>
                    <strong>{notification.message}</strong>
                    <small>{formatDate(notification.createdAt)}</small>
                  </article>
                ))
              )}
            </section>

            <section className="panel">
              <div className="panel-title">
                <h2>Activity</h2>
                <span>{activities.length}</span>
              </div>
              {activities.length === 0 ? (
                <p className="empty">No activity yet.</p>
              ) : (
                activities.map((activity) => (
                  <article className="feed-item" key={activity._id}>
                    <strong>{activity.action.replaceAll('_', ' ')}</strong>
                    <small>
                      {activity.user?.name || 'System'} - {formatDate(activity.createdAt)}
                    </small>
                  </article>
                ))
              )}
            </section>
          </aside>
        </section>
      </section>

      {editTask && selectedProject && (
        <div className="modal-backdrop" role="presentation">
          <form className="modal" onSubmit={saveTaskEdit}>
            <div className="modal-header">
              <h2>Edit task</h2>
              <button className="icon-button" type="button" onClick={() => setEditTask(null)}>
                X
              </button>
            </div>
            <label>
              Title
              <input
                required
                minLength={3}
                maxLength={100}
                pattern="[A-Za-z0-9][A-Za-z0-9 .,'()/_-]*"
                value={editForm.title}
                onChange={(event) =>
                  setEditForm({ ...editForm, title: event.target.value })
                }
              />
            </label>
            <label>
              Description
              <textarea
                maxLength={500}
                value={editForm.description}
                onChange={(event) =>
                  setEditForm({ ...editForm, description: event.target.value })
                }
              />
            </label>
            <label>
              Assignee
              <select
                value={editForm.assignedTo}
                onChange={(event) =>
                  setEditForm({ ...editForm, assignedTo: event.target.value })
                }
              >
                <option value="">Unassigned</option>
                {selectedProject.members.map((member) => (
                  <option key={getMemberId(member)} value={getMemberId(member)}>
                    {getMemberName(member)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select
                value={editForm.status}
                onChange={(event) =>
                  setEditForm({ ...editForm, status: event.target.value as TaskStatus })
                }
              >
                {statusOrder.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary" type="submit">
              Save task
            </button>
          </form>
        </div>
      )}
    </main>
  )
}

export default App
