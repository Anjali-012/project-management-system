import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { io, Socket } from 'socket.io-client'
import { createApiClient } from '../api/client'

import {
  ALPHA_NUMERIC_TEXT_PATTERN,
  EMAIL_PATTERN,
  SOCKET_URL,
} from '../constants'
import type {
  AuthState,
  Notification,
  Project,
  ProjectMember,
  ProjectRole,
} from '../types'
import { getMemberId } from '../utils/member'
import { validateField } from '../utils/validation'

export const useWorkspace = (
  auth: AuthState | null,
  showToast: (msg: string, type?: 'error' | 'success' | 'info') => void,
) => {
  const [projects, setProjects] = useState<Project[]>([])
  // selectedProjectId is used only by the Projects page (browsing) and Members page
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [memberRole, setMemberRole] = useState<ProjectRole>('member')
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([])
  const [projectForm, setProjectForm] = useState({ title: '', description: '' })
  const socketRef = useRef<Socket | null>(null)
  const [socketConnected, setSocketConnected] = useState(false)

  const selectedProject = projects.find((p) => p._id === selectedProjectId)
  const selectedProjectMembers = selectedProject?.members ?? []

  const { request } = useMemo(() => createApiClient(auth?.token), [auth?.token])

  // ── Socket (connection only — room joins handled per-page) ─────────────────

  useEffect(() => {
    if (!auth) return

    const socket = io(SOCKET_URL, { auth: { token: auth.token } })
    socket.on('connect', () => setSocketConnected(true))
    socket.on('disconnect', () => setSocketConnected(false))
    socketRef.current = socket

    return () => {
      socket.disconnect()
      socketRef.current = null
      setSocketConnected(false)
    }
  }, [auth])

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
  // ── Load notifications ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!auth) return
    request<{ data: Notification[] }>('/api/notifications')
      .then((body) => setNotifications(body.data.slice(0, 8)))
      .catch(() => undefined)
  }, [auth, request])

  // ── Validation ─────────────────────────────────────────────────────────────

  const validateProjectForm = () =>
    validateField('Project title', projectForm.title, {
      required: true, min: 3, max: 80,
      pattern: ALPHA_NUMERIC_TEXT_PATTERN,
      patternMessage: 'Project title must start with a letter or number.',
    }) || validateField('Project description', projectForm.description, { max: 300 })

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

  const loadProjectMembers = async (projectId: string) => {
    if (!projectId) return
    try {
      const body = await request<{ data: ProjectMember[] }>(`/api/projects/${projectId}/members`)
      setProjectMembers(body.data)
    } catch {
      setProjectMembers([])
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
        body: JSON.stringify({ email: memberEmail.trim(), role: memberRole }),
      })
      setProjects((current) => current.map((p) => (p._id === body.data._id ? body.data : p)))
      setMemberEmail('')
      setMemberRole('member')
      await loadProjectMembers(selectedProjectId)
      showToast('Member added successfully', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not add member')
    }
  }

  const changeMemberRole = async (userId: string, role: ProjectRole) => {
    if (!selectedProjectId) return
    try {
      await request(`/api/projects/${selectedProjectId}/members/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      })
      setProjectMembers((current) =>
        current.map((m) => (m._id === userId ? { ...m, projectRole: role } : m)),
      )
      showToast('Role updated', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update role')
    }
  }

  const removeMember = async (userId: string) => {
    if (!selectedProjectId) return
    try {
      await request(`/api/projects/${selectedProjectId}/members/${userId}`, { method: 'DELETE' })
      setProjectMembers((current) => current.filter((m) => m._id !== userId))
      setProjects((current) =>
        current.map((p) =>
          p._id === selectedProjectId
            ? { ...p, members: p.members.filter((m) => (typeof m === 'string' ? m : m._id ?? m.id) !== userId) }
            : p,
        ),
      )
      showToast('Member removed', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not remove member')
    }
  }

  // Load enriched members when selected project changes
  useEffect(() => {
    if (!selectedProjectId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProjectMembers([])
      return
    }
    let cancelled = false
    request<{ data: ProjectMember[] }>(`/api/projects/${selectedProjectId}/members`)
      .then((body) => { if (!cancelled) setProjectMembers(body.data) })
      .catch(() => { if (!cancelled) setProjectMembers([]) })
    return () => { cancelled = true }
  }, [selectedProjectId, request])

  const markNotificationsRead = useCallback(async () => {
    try {
      await request('/api/notifications/read-all', { method: 'PATCH' })
      setNotifications((current) => current.map((n) => ({ ...n, isRead: true })))
    } catch {
      // non-critical
    }
  }, [request])

  const logout = () => {
    setSelectedProjectId('')
    setProjects([])
    setNotifications([])
    setProjectMembers([])
  }

  const realtimeStatus = socketConnected ? 'Real-time connected' : 'Real-time disconnected'

  return {
    projects, selectedProjectId, setSelectedProjectId, selectedProject,
    selectedProjectMembers: selectedProjectMembers.map(getMemberId),
    selectedProjectMembersRaw: selectedProjectMembers,
    projectMembers,
    notifications, loading, socketConnected, realtimeStatus,
    projectForm, setProjectForm,
    memberEmail, setMemberEmail,
    memberRole, setMemberRole,
    socketRef,
    createProject, addMember, changeMemberRole, removeMember,
    markNotificationsRead, logout,
  }
}
