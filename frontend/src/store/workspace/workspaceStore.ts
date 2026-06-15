import { create } from 'zustand'

import type {
  Activity,
  Notification,

  PresenceUser,
  Project,
  Task,
  TaskFilters,
  TaskPriority,
  TaskStatus,
} from '../../types'

import type { EditForm } from '../../components/EditTaskModal'
import type { TaskForm } from '../../components/TaskComposer'

type WorkspaceState = {
  // runtime data
  projects: Project[]
  selectedProjectId: string
  tasks: Task[]
  activities: Activity[]
  notifications: Notification[]
  loading: boolean
  socketConnected: boolean
  realtimeStatus: string

  // UI state / panels
  memberEmail: string
  draggedTaskId: string
  projectForm: { title: string; description: string }
  taskForm: TaskForm
  editTask: Task | null
  editForm: EditForm
  commentTask: Task | null
  filters: TaskFilters
  presence: PresenceUser[]

  // derived-like helpers (computed externally when needed)
  selectedProject: Project | undefined
  selectedProjectMembers: Array<{ id: string; name: string; email?: string }> // light shape for UI

  // setters
  setSelectedProjectId: (id: string) => void
  setProjects: (projects: Project[]) => void
  setTasks: (tasks: Task[]) => void
  setActivities: (activities: Activity[]) => void
  setNotifications: (notifications: Notification[]) => void
  setLoading: (loading: boolean) => void
  setSocketConnected: (connected: boolean) => void
  setMemberEmail: (email: string) => void
  setDraggedTaskId: (id: string) => void
  setProjectForm: (form: { title: string; description: string }) => void
  setTaskForm: (form: TaskForm) => void
  setEditTask: (task: Task | null) => void
  setEditForm: (form: EditForm) => void
  setCommentTask: (task: Task | null) => void
  setFilters: (filters: TaskFilters) => void
  setPresence: (presence: PresenceUser[]) => void

  logout: () => void

  // actions (implemented in hook to keep API logic close to auth)
  // These are optional; components/hook call them from useWorkspace.
  // Here we only keep state. API actions stay in hook.
}

const EMPTY_FILTERS: TaskFilters = { search: '', status: '', priority: '', assignedTo: '' }

const initialTaskForm: TaskForm = {
  title: '',
  description: '',
  assignedTo: '',
  priority: 'medium' as TaskPriority,
  dueDate: '',
}

const initialEditForm: EditForm = {
  title: '',
  description: '',
  assignedTo: '',
  status: 'todo' as TaskStatus,
  priority: 'medium' as TaskPriority,
  dueDate: '',
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  projects: [],
  selectedProjectId: '',
  tasks: [],
  activities: [],
  notifications: [],
  loading: false,
  socketConnected: false,
  realtimeStatus: 'No project selected',

  memberEmail: '',
  draggedTaskId: '',
  projectForm: { title: '', description: '' },
  taskForm: initialTaskForm,
  editTask: null,
  editForm: initialEditForm,
  commentTask: null,
  filters: EMPTY_FILTERS,
  presence: [],

  selectedProject: undefined,
  selectedProjectMembers: [],

  setSelectedProjectId: (id) => {
    const state = get()
    set({ selectedProjectId: id })
    const selectedProject = state.projects.find((p) => p._id === id)
    set({
      selectedProject,
      realtimeStatus: selectedProject
        ? get().socketConnected
          ? 'Real-time connected'
          : 'Real-time disconnected'
        : 'No project selected',
    } as Partial<WorkspaceState>)
  },

  setProjects: (projects) => {
    const selectedProjectId = get().selectedProjectId
    const selectedProject = projects.find((p) => p._id === selectedProjectId)
    set({ projects, selectedProject, realtimeStatus: selectedProject ? 'Real-time disconnected' : 'No project selected' })
  },

  setTasks: (tasks) => set({ tasks }),
  setActivities: (activities) => set({ activities }),
  setNotifications: (notifications) => set({ notifications }),
  setLoading: (loading) => set({ loading }),
  setSocketConnected: (connected) => {
    const selectedProject = get().selectedProject
    set({ socketConnected: connected, realtimeStatus: selectedProject ? (connected ? 'Real-time connected' : 'Real-time disconnected') : 'No project selected' })
  },
  setMemberEmail: (email) => set({ memberEmail: email }),
  setDraggedTaskId: (id) => set({ draggedTaskId: id }),
  setProjectForm: (form) => set({ projectForm: form }),
  setTaskForm: (form) => set({ taskForm: form }),
  setEditTask: (task) => set({ editTask: task }),
  setEditForm: (form) => set({ editForm: form }),
  setCommentTask: (task) => set({ commentTask: task }),
  setFilters: (filters) => set({ filters }),
  setPresence: (presence) => set({ presence }),

  logout: () => {
    set({
      projects: [],
      selectedProjectId: '',
      tasks: [],
      activities: [],
      notifications: [],
      loading: false,
      socketConnected: false,
      realtimeStatus: 'No project selected',
      memberEmail: '',
      draggedTaskId: '',
      projectForm: { title: '', description: '' },
      taskForm: initialTaskForm,
      editTask: null,
      editForm: initialEditForm,
      commentTask: null,
      filters: EMPTY_FILTERS,
      presence: [],
      selectedProject: undefined,
      selectedProjectMembers: [],
    })
  },
}))

