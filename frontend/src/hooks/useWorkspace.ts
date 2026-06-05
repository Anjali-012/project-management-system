import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { io, Socket } from 'socket.io-client'
import { createApiClient } from '../api/client'
import {
  ALPHA_NUMERIC_TEXT_PATTERN,
  EMAIL_PATTERN,
  SOCKET_URL,
  STATUS_ORDER,
} from '../constants'
import type {
  Activity,
  AuthState,
  Notification,
  PresenceUser,
  Project,
  Task,
  TaskFilters,
  TaskStatus,
  TaskUpdatePayload,
} from '../types'
import { getMemberId, getAssignedUserId } from '../utils/member'
import { validateField } from '../utils/validation'
import type { EditForm } from '../components/EditTaskModal'
import type { TaskForm } from '../components/TaskComposer'

const EMPTY_FILTERS: TaskFilters = { search: '', status: '', priority: '', assignedTo: '' }

export const useWorkspace = (
  auth: AuthState | null,
  showToast: (msg: string, type?: 'error' | 'success' | 'info') => void,
) => {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [draggedTaskId, setDraggedTaskId] = useState('')
  const [projectForm, setProjectForm] = useState({ title: '', description: '' })
  const [taskForm, setTaskForm] = useState<TaskForm>({
    title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '',
  })
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({
    title: '', description: '', assignedTo: '', status: 'todo', priority: 'medium', dueDate: '',
  })
  const [commentTask, setCommentTask] = useState<Task | null>(null)
  const [filters, setFilters] = useState<TaskFilters>(EMPTY_FILTERS)
  const [presence, setPresence] = useState<PresenceUser[]>([])
  const socketRef = useRef<Socket | null>(null)
  const [socketConnected, setSocketConnected] = useState(false)

  const selectedProject = projects.find((p) => p._id === selectedProjectId)
  const selectedProjectMembers = selectedProject?.members ?? []

  const { request } = useMemo(() => createApiClient(auth?.token), [auth?.token])

  // ── Helpers ────────────────────────────────────────────────────────────────

  const upsertTask = useCallback((task: Task) => {
    setTasks((current) => {
      const exists = current.some((t) => t._id === task._id)
      return exists ? current.map((t) => (t._id === task._id ? task : t)) : [task, ...current]
    })
    // keep comment panel in sync
    setCommentTask((prev) => (prev?._id === task._id ? task : prev))
  }, [])

  const loadProjectMeta = useCallback(async () => {
    if (!auth || !selectedProjectId) return
    const [activityBody, notificationBody] = await Promise.all([
      request<{ data: Activity[] }>(`/api/activity/${selectedProjectId}`),
      request<{ data: Notification[] }>('/api/notifications'),
    ])
    setActivities(activityBody.data.slice(0, 8))
    setNotifications(notificationBody.data.slice(0, 8))
  }, [auth, request, selectedProjectId])

  // ── Socket ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!auth) return

    const socket = io(SOCKET_URL, { auth: { token: auth.token } })

    socket.on('task:created', (task: Task) => { upsertTask(task); loadProjectMeta().catch(() => undefined) })
    socket.on('task:updated', (task: Task) => { upsertTask(task); loadProjectMeta().catch(() => undefined) })
    socket.on('task:deleted', ({ id }: { id: string }) => {
      setTasks((current) => current.filter((t) => t._id !== id))
      setCommentTask((prev) => (prev?._id === id ? null : prev))
      loadProjectMeta().catch(() => undefined)
    })
    socket.on('presence:update', ({ projectId, users }: { projectId: string; users: PresenceUser[] }) => {
      if (projectId === selectedProjectId) setPresence(users)
    })
    socket.on('connect', () => setSocketConnected(true))
    socket.on('disconnect', () => setSocketConnected(false))

    socketRef.current = socket

    return () => {
      socket.disconnect()
      socketRef.current = null
      setSocketConnected(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth])

  // re-attach presence listener when selectedProjectId changes
  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return
    const handler = ({ projectId, users }: { projectId: string; users: PresenceUser[] }) => {
      if (projectId === selectedProjectId) setPresence(users)
    }
    socket.on('presence:update', handler)
    return () => { socket.off('presence:update', handler) }
  }, [selectedProjectId])

  // ── Load projects ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!auth) return
    const load = async () => {
      setLoading(true)
      try {
        const body = await request<{ data: Project[] }>('/api/projects')
        setProjects(body.data)
        setSelectedProjectId((current) => current || body.data[0]?._id || '')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Could not load projects')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [auth, request, showToast])

  // ── Load workspace ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!auth || !selectedProjectId) return
    const load = async () => {
      setPresence([])
      setFilters(EMPTY_FILTERS)
      setLoading(true)
      try {
        const body = await request<{ data: Task[] }>(`/api/tasks?projectId=${selectedProjectId}&limit=100`)
        setTasks(body.data)
        await loadProjectMeta()
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Could not load workspace')
      } finally {
        setLoading(false)
      }
    }
    socketRef.current?.emit('project:join', selectedProjectId)
    load()
    return () => { socketRef.current?.emit('project:leave', selectedProjectId) }
  }, [auth, loadProjectMeta, request, selectedProjectId, showToast])

  // ── Validation ─────────────────────────────────────────────────────────────

  const validateProjectForm = () =>
    validateField('Project title', projectForm.title, {
      required: true, min: 3, max: 80,
      pattern: ALPHA_NUMERIC_TEXT_PATTERN,
      patternMessage: 'Project title must start with a letter or number.',
    }) || validateField('Project description', projectForm.description, { max: 300 })

  const validateTaskForm = (form: { title: string; description: string }) =>
    validateField('Task title', form.title, {
      required: true, min: 3, max: 100,
      pattern: ALPHA_NUMERIC_TEXT_PATTERN,
      patternMessage: 'Task title must start with a letter or number.',
    }) || validateField('Task description', form.description, { max: 500 })

  // ── Actions ────────────────────────────────────────────────────────────────

  const createProject = async (event: FormEvent) => {
    event.preventDefault()
    const err = validateProjectForm()
    if (err) { showToast(err); return }
    try {
      const body = await request<{ data: Project }>('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ title: projectForm.title.trim(), description: projectForm.description.trim() }),
      })
      setProjects((current) => [body.data, ...current])
      setSelectedProjectId(body.data._id)
      setProjectForm({ title: '', description: '' })
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not create project')
    }
  }

  const createTask = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedProjectId) return
    const err = validateTaskForm(taskForm)
    if (err) { showToast(err); return }
    try {
      const body = await request<{ data: Task }>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: taskForm.title.trim(),
          description: taskForm.description.trim(),
          projectId: selectedProjectId,
          assignedTo: taskForm.assignedTo || undefined,
          priority: taskForm.priority,
          dueDate: taskForm.dueDate || undefined,
        }),
      })
      upsertTask(body.data)
      setTaskForm({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '' })
      await loadProjectMeta()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not create task')
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
    try { await updateTask(task, { status }) }
    catch (err) { showToast(err instanceof Error ? err.message : 'Could not update task') }
  }

  const assignTaskMember = async (task: Task, assignedTo: string) => {
    try {
      await updateTask(task, { assignedTo: assignedTo || null })
      showToast(assignedTo ? 'Task member updated.' : 'Task is now unassigned.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not assign task member')
    }
  }

  const saveTaskEdit = async (event: FormEvent) => {
    event.preventDefault()
    if (!editTask) return
    const err = validateTaskForm(editForm)
    if (err) { showToast(err); return }
    try {
      await updateTask(editTask, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        assignedTo: editForm.assignedTo || null,
        status: editForm.status,
        priority: editForm.priority,
        dueDate: editForm.dueDate || null,
      })
      setEditTask(null)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save task')
    }
  }

  const openTaskEdit = (task: Task) => {
    setEditTask(task)
    setEditForm({
      title: task.title,
      description: task.description || '',
      assignedTo: getAssignedUserId(task.assignedTo),
      status: task.status,
      priority: task.priority ?? 'medium',
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
    })
  }

  const closeTaskEdit = () => setEditTask(null)

  const deleteTask = async (task: Task) => {
    try {
      await request(`/api/tasks/${task._id}`, { method: 'DELETE' })
      setTasks((current) => current.filter((t) => t._id !== task._id))
      await loadProjectMeta()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not delete task')
    }
  }

  const addMember = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedProjectId) return
    const err = validateField('Member email', memberEmail, {
      required: true, max: 120,
      pattern: EMAIL_PATTERN,
      patternMessage: 'Enter a valid member email address.',
    })
    if (err) { showToast(err); return }
    try {
      const body = await request<{ data: Project }>(`/api/projects/${selectedProjectId}/members`, {
        method: 'POST',
        body: JSON.stringify({ email: memberEmail.trim() }),
      })
      setProjects((current) => current.map((p) => (p._id === body.data._id ? body.data : p)))
      setMemberEmail('')
      await loadProjectMeta()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not add member')
    }
  }

  const handleDrop = (status: TaskStatus) => {
    const task = tasks.find((t) => t._id === draggedTaskId)
    setDraggedTaskId('')
    if (!task || task.status === status) return
    updateTaskStatus(task, status)
  }

  const addComment = async (taskId: string, text: string) => {
    try {
      const body = await request<{ data: Task }>(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      })
      upsertTask(body.data)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not add comment')
      throw err
    }
  }

  const markNotificationsRead = useCallback(async () => {
    try {
      await request('/api/notifications/read-all', { method: 'PATCH' })
      setNotifications((current) => current.map((n) => ({ ...n, isRead: true })))
    } catch {
      // non-critical, silently ignore
    }
  }, [request])

  const logout = () => {
    setSelectedProjectId('')
    setProjects([])
    setTasks([])
    setActivities([])
    setNotifications([])
    setPresence([])
    setCommentTask(null)
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const filteredTasks = useMemo(() => {
    const { search, status, priority, assignedTo } = filters
    return tasks.filter((t) => {
      if (status && t.status !== status) return false
      if (priority && (t.priority ?? 'medium') !== priority) return false
      if (assignedTo) {
        const id = t.assignedTo?.id || t.assignedTo?._id || ''
        if (id !== assignedTo) return false
      }
      if (search) {
        const s = search.toLowerCase()
        if (!t.title.toLowerCase().includes(s) && !(t.description?.toLowerCase().includes(s))) return false
      }
      return true
    })
  }, [tasks, filters])

  const tasksByStatus = useMemo(
    () =>
      STATUS_ORDER.reduce(
        (groups, status) => ({ ...groups, [status]: filteredTasks.filter((t) => t.status === status) }),
        {} as Record<TaskStatus, Task[]>,
      ),
    [filteredTasks],
  )

  const realtimeStatus = selectedProject
    ? socketConnected ? 'Real-time connected' : 'Real-time disconnected'
    : 'No project selected'

  return {
    projects, selectedProjectId, setSelectedProjectId, selectedProject,
    selectedProjectMembers: selectedProjectMembers.map(getMemberId),
    selectedProjectMembersRaw: selectedProjectMembers,
    tasks, tasksByStatus, activities, notifications,
    loading, socketConnected, realtimeStatus, presence,
    projectForm, setProjectForm,
    taskForm, setTaskForm,
    editTask, editForm, setEditForm,
    commentTask, setCommentTask,
    memberEmail, setMemberEmail,
    draggedTaskId, setDraggedTaskId,
    filters, setFilters,
    createProject, createTask, updateTaskStatus, assignTaskMember,
    saveTaskEdit, openTaskEdit, closeTaskEdit, deleteTask,
    addMember, handleDrop, addComment, markNotificationsRead, logout,
  }
}
