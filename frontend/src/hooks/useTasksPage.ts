import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Socket } from 'socket.io-client'
import { createApiClient } from '../api/client'
import { ALPHA_NUMERIC_TEXT_PATTERN, STATUS_ORDER } from '../constants'
import type {
  AuthState,
  Project,
  ProjectMember,
  Task,
  Activity,
  TaskFilters,
  TaskPagination,
  TaskStatus,
  TaskUpdatePayload,
} from '../types'
import { getAssignedUserId } from '../utils/member'
import { validateField } from '../utils/validation'
import type { EditForm } from '../components/EditTaskModal/EditTaskModal'
import type { TaskForm } from '../components/TaskComposer/TaskComposer'

const EMPTY_FILTERS: TaskFilters = { search: '', status: '', priority: '', assignedTo: '' }

export const useTasksPage = (
  auth: AuthState | null,
  projects: Project[],
  socketRef: React.RefObject<Socket | null>,
  showToast: (msg: string, type?: 'error' | 'success' | 'info') => void,
) => {
  const [taskProjectId, setTaskProjectIdRaw] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskProjectMembers, setTaskProjectMembers] = useState<ProjectMember[]>([])
  const [loading, setLoading] = useState(false)
  const [taskForm, setTaskForm] = useState<TaskForm>({
    title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '',
  })
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({
    title: '', description: '', assignedTo: '', status: 'todo', priority: 'medium', dueDate: '',
  })
  const [commentTask, setCommentTask] = useState<Task | null>(null)
  const [detailTask, setDetailTask] = useState<Task | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailActivities, setDetailActivities] = useState<Activity[]>([])
  const [filters, setFilters] = useState<TaskFilters>(EMPTY_FILTERS)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [pagination, setPagination] = useState<TaskPagination>({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [draggedTaskId, setDraggedTaskId] = useState('')
  const prevProjectIdRef = useRef('')

  const { request } = useMemo(() => createApiClient(auth?.token), [auth?.token])

  const taskProject = projects.find((p) => p._id === taskProjectId)
  // ── Initialise to first project once projects load ─────────────────────────

  useEffect(() => {
    if (taskProjectId || projects.length === 0) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTaskProjectIdRaw(projects[0]._id)
  }, [projects, taskProjectId])

  // ── Socket room join/leave when project changes ────────────────────────────

  useEffect(() => {
    const prev = prevProjectIdRef.current
    if (prev) socketRef.current?.emit('project:leave', prev)
    prevProjectIdRef.current = taskProjectId
    if (taskProjectId) socketRef.current?.emit('project:join', taskProjectId)
  }, [taskProjectId, socketRef])

  // ── Socket task events ─────────────────────────────────────────────────────

  const upsertTask = useCallback((task: Task) => {
    setTasks((current) => {
      const exists = current.some((t) => t._id === task._id)
      return exists ? current.map((t) => (t._id === task._id ? task : t)) : [task, ...current]
    })
    setCommentTask((prev) => (prev?._id === task._id ? task : prev))
  }, [])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return

    const onCreated = (task: Task) => {
      const pid = typeof task.project === 'string' ? task.project : task.project._id
      if (pid === taskProjectId) upsertTask(task)
    }
    const onUpdated = (task: Task) => {
      const pid = typeof task.project === 'string' ? task.project : task.project._id
      if (pid === taskProjectId) upsertTask(task)
    }
    const onDeleted = ({ id, project }: { id: string; project: string }) => {
      if (project === taskProjectId) {
        setTasks((current) => current.filter((t) => t._id !== id))
        setCommentTask((prev) => (prev?._id === id ? null : prev))
      }
    }

    socket.on('task:created', onCreated)
    socket.on('task:updated', onUpdated)
    socket.on('task:deleted', onDeleted)
    return () => {
      socket.off('task:created', onCreated)
      socket.off('task:updated', onUpdated)
      socket.off('task:deleted', onDeleted)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskProjectId, upsertTask])

  // ── Load tasks from the API whenever server-side list controls change ─────

  useEffect(() => {
    if (!auth || !taskProjectId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTasks([])
      return
    }
    let cancelled = false
    setLoading(true)
    const query = new URLSearchParams({
      projectId: taskProjectId,
      page: String(pagination.page),
      limit: String(pagination.limit),
      sortBy,
      sortOrder,
    })
    if (filters.search) query.set('search', filters.search)
    if (filters.status) query.set('status', filters.status)
    if (filters.priority) query.set('priority', filters.priority)
    if (filters.assignedTo) query.set('assignedTo', filters.assignedTo)

    request<{ data: Task[]; pagination: TaskPagination }>(`/api/tasks?${query}`)
      .then((body) => {
        if (!cancelled) {
          setTasks(body.data)
          setPagination(body.pagination)
        }
      })
      .catch((err) => showToast(err instanceof Error ? err.message : 'Could not load tasks'))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [auth, taskProjectId, filters, pagination.page, pagination.limit, request, showToast, sortBy, sortOrder])

  // ProjectMember is the canonical source of project roles and assignee eligibility.
  useEffect(() => {
    if (!auth || !taskProjectId) {
      return
    }
    let cancelled = false
    request<{ data: ProjectMember[] }>(`/api/projects/${taskProjectId}/members`)
      .then((body) => { if (!cancelled) setTaskProjectMembers(body.data) })
      .catch(() => { if (!cancelled) setTaskProjectMembers([]) })
    return () => { cancelled = true }
  }, [auth, taskProjectId, request])

  // ── Validation ─────────────────────────────────────────────────────────────

  const validateTaskForm = (form: { title: string; description: string }) =>
    validateField('Task title', form.title, {
      required: true, min: 3, max: 100,
      pattern: ALPHA_NUMERIC_TEXT_PATTERN,
      patternMessage: 'Task title must start with a letter or number.',
    }) || validateField('Task description', form.description, { max: 500 })

  // ── Task CRUD ──────────────────────────────────────────────────────────────

  const updateTask = async (task: Task, payload: TaskUpdatePayload) => {
    const body = await request<{ data: Task }>(`/api/tasks/${task._id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    upsertTask(body.data)
  }

  const createTask = async (event: FormEvent) => {
    event.preventDefault()
    if (!taskProjectId) return
    const err = validateTaskForm(taskForm)
    if (err) { showToast(err); return }
    try {
      const body = await request<{ data: Task }>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: taskForm.title.trim(),
          description: taskForm.description.trim(),
          projectId: taskProjectId,
          assignedTo: taskForm.assignedTo || undefined,
          priority: taskForm.priority,
          dueDate: taskForm.dueDate || undefined,
        }),
      })
      upsertTask(body.data)
      setTaskForm({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '' })
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not create task')
    }
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

  const openTaskDetails = async (task: Task) => {
    setDetailTask(task)
    setDetailActivities([])
    setDetailLoading(true)
    try {
      const [taskBody, activityBody] = await Promise.all([
        request<{ data: Task }>(`/api/tasks/${task._id}`),
        request<{ data: Activity[] }>(`/api/tasks/${task._id}/activity`),
      ])
      setDetailTask(taskBody.data)
      setDetailActivities(activityBody.data)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not load task details')
    } finally {
      setDetailLoading(false)
    }
  }

  const deleteTask = async (task: Task) => {
    try {
      await request(`/api/tasks/${task._id}`, { method: 'DELETE' })
      setTasks((current) => current.filter((t) => t._id !== task._id))
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not delete task')
      throw err
    }
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

  const handleDrop = (status: TaskStatus) => {
    const task = tasks.find((t) => t._id === draggedTaskId)
    setDraggedTaskId('')
    if (!task || task.status === status) return
    updateTaskStatus(task, status)
  }

  const setTaskProjectId = (id: string) => {
    setTaskProjectIdRaw(id)
    setTasks([])
    setEditTask(null)
    setCommentTask(null)
    setDetailTask(null)
    setFilters(EMPTY_FILTERS)
    setPagination((current) => ({ ...current, page: 1 }))
  }

  const updateFilters = (nextFilters: TaskFilters) => {
    setFilters(nextFilters)
    setPagination((current) => ({ ...current, page: 1 }))
  }

  const changePage = (page: number) => setPagination((current) => ({ ...current, page }))

  const changeSort = (nextSortBy: string) => {
    if (nextSortBy === sortBy) setSortOrder((current) => current === 'asc' ? 'desc' : 'asc')
    else { setSortBy(nextSortBy); setSortOrder('desc') }
    setPagination((current) => ({ ...current, page: 1 }))
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const tasksByStatus = useMemo(
    () =>
      STATUS_ORDER.reduce(
        (groups, status) => ({ ...groups, [status]: tasks.filter((t) => t.status === status) }),
        {} as Record<TaskStatus, Task[]>,
      ),
    [tasks],
  )

  return {
    taskProjectId, setTaskProjectId,
    taskProject, taskProjectMembers,
    tasks, tasksByStatus, loading,
    taskForm, setTaskForm,
    editTask, editForm, setEditForm,
    commentTask, setCommentTask,
    detailTask, detailLoading, detailActivities, openTaskDetails,
    closeTaskDetails: () => { setDetailTask(null); setDetailActivities([]) },
    filters, setFilters: updateFilters,
    sortBy, sortOrder, pagination, changePage, changeSort,
    draggedTaskId, setDraggedTaskId,
    createTask, updateTaskStatus, assignTaskMember,
    saveTaskEdit, openTaskEdit, closeTaskEdit: () => setEditTask(null),
    deleteTask, addComment, handleDrop,
  }
}
