import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { SOCKET_URL, statusOrder } from '../constants'
import type {
  Activity,
  AuthState,
  Notification,
  Project,
  Task,
  TaskStatus,
  TaskUpdatePayload,
  Toast,
} from '../types'

type WorkspaceArgs = {
  auth: AuthState
  request: <T>(path: string, options?: RequestInit) => Promise<T>
  setAuth: (auth: AuthState | null) => void
  showToast: (message: string, type?: Toast['type']) => void
}

export const useWorkspace = ({ auth, request, setAuth, showToast }: WorkspaceArgs) => {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [socketConnected, setSocketConnected] = useState(false)
  const [projectForm, setProjectForm] = useState({ title: '', description: '' })
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: '' })
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    status: 'todo' as TaskStatus,
  })
  const [memberEmail, setMemberEmail] = useState('')
  const [draggedTaskId, setDraggedTaskId] = useState('')
  const socketRef = useRef<Socket | null>(null)

  const selectedProject = projects.find((project) => project._id === selectedProjectId)
  const selectedProjectMembers = selectedProject?.members ?? []
  const realtimeStatus = selectedProject
    ? socketConnected
      ? 'Real-time connected'
      : 'Real-time disconnected'
    : 'No project selected'

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

  const upsertTask = useCallback((task: Task) => {
    setTasks((current) =>
      current.some((item) => item._id === task._id)
        ? current.map((item) => (item._id === task._id ? task : item))
        : [task, ...current],
    )
  }, [])

  const loadProjectMeta = useCallback(async () => {
    if (!selectedProjectId) return

    const [activityBody, notificationBody] = await Promise.all([
      request<{ data: Activity[] }>(`/api/activity/${selectedProjectId}`),
      request<{ data: Notification[] }>('/api/notifications'),
    ])
    setActivities(activityBody.data.slice(0, 8))
    setNotifications(notificationBody.data.slice(0, 8))
  }, [request, selectedProjectId])

  useEffect(() => {
    const loadProjects = async () => {
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

    loadProjects()
  }, [request, showToast])

  useEffect(() => {
    const nextSocket = io(SOCKET_URL, { auth: { token: auth.token } })
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
  }, [auth.token, loadProjectMeta, upsertTask])

  useEffect(() => {
    if (!selectedProjectId) return

    const loadWorkspace = async () => {
      setLoading(true)
      try {
        const body = await request<{ data: Task[] }>(
          `/api/tasks?projectId=${selectedProjectId}&limit=100`,
        )
        setTasks(body.data)
        await loadProjectMeta()
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Could not load workspace')
      } finally {
        setLoading(false)
      }
    }

    socketRef.current?.emit('project:join', selectedProjectId)
    loadWorkspace()
    return () => socketRef.current?.emit('project:leave', selectedProjectId)
  }, [loadProjectMeta, request, selectedProjectId, showToast])

  const updateTask = async (task: Task, payload: TaskUpdatePayload) => {
    const body = await request<{ data: Task }>(`/api/tasks/${task._id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    upsertTask(body.data)
    await loadProjectMeta()
  }

  const logout = () => {
    setAuth(null)
    setSelectedProjectId('')
    setProjects([])
    setTasks([])
    setActivities([])
    setNotifications([])
  }

  return {
    activities,
    editForm,
    editTask,
    loading,
    memberEmail,
    notifications,
    projectForm,
    projects,
    realtimeStatus,
    selectedProject,
    selectedProjectId,
    selectedProjectMembers,
    taskForm,
    tasks,
    tasksByStatus,
    updateTask,
    loadProjectMeta,
    logout,
    setDraggedTaskId,
    setEditForm,
    setEditTask,
    setMemberEmail,
    setProjectForm,
    setSelectedProjectId,
    setTaskForm,
    showToast,
    request,
  }
}
