import type { ProjectMember, ProjectRole } from '../types'

export type GlobalCapabilities = {
  canCreateProject: boolean
}

export const getGlobalCapabilities = (
  globalRole: 'admin' | 'manager' | 'member',
): GlobalCapabilities => ({
  canCreateProject: globalRole === 'admin' || globalRole === 'manager',
})

export type ProjectCapabilities = {
  canCreateTask: boolean
  canManageMembers: boolean
  canAssignRoles: boolean
  assignableRoles: ProjectRole[]
  canEditAnyTask: boolean
  canEditOwnTask: boolean
  canDeleteAnyTask: boolean
  canDeleteOwnTask: boolean
}

const adminCapabilities: ProjectCapabilities = {
  canCreateTask: true,
  canManageMembers: true,
  canAssignRoles: true,
  assignableRoles: ['manager', 'member', 'viewer'],
  canEditAnyTask: true,
  canEditOwnTask: true,
  canDeleteAnyTask: true,
  canDeleteOwnTask: true,
}

/**
 * Derive UI-level project capabilities from the actor's roles.
 *
 * Pure function — no API calls, no side effects.
 * Mirrors backend permissions.js for UI purposes only.
 * The backend remains the security authority.
 *
 * @param projectRole - Actor's role in the project, or null if not a member
 * @param globalRole  - Actor's global application role
 */
export const getProjectCapabilities = (
  projectRole: ProjectRole | null | undefined,
  globalRole: 'admin' | 'manager' | 'member',
): ProjectCapabilities => {
  if (globalRole === 'admin') {
    return adminCapabilities
  }

  switch (projectRole) {
    case 'owner':
    case 'manager':
      return {
        canCreateTask: true,
        canManageMembers: true,
        canAssignRoles: true,
        assignableRoles: ['member', 'viewer'],
        canEditAnyTask: true,
        canEditOwnTask: true,
        canDeleteAnyTask: true,
        canDeleteOwnTask: true,
      }
    case 'member':
      return {
        canCreateTask: true,
        canManageMembers: false,
        canAssignRoles: false,
        assignableRoles: [],
        canEditAnyTask: true,
        canEditOwnTask: true,
        canDeleteAnyTask: false,
        canDeleteOwnTask: true,
      }
    default:
      // viewer or unknown/null
      return {
        canCreateTask: false,
        canManageMembers: false,
        canAssignRoles: false,
        assignableRoles: [],
        canEditAnyTask: false,
        canEditOwnTask: false,
        canDeleteAnyTask: false,
        canDeleteOwnTask: false,
      }
  }
}

export const canEditTask = (
  capabilities: ProjectCapabilities,
  taskCreatorId: string,
  currentUserId: string,
) =>
  capabilities.canEditAnyTask ||
  (capabilities.canEditOwnTask && taskCreatorId === currentUserId)

export const canDeleteTask = (
  capabilities: ProjectCapabilities,
  taskCreatorId: string,
  currentUserId: string,
) =>
  capabilities.canDeleteAnyTask ||
  (capabilities.canDeleteOwnTask && taskCreatorId === currentUserId)

/** Mirrors the backend's task-assignee eligibility check for dropdown UX. */
export const getAssignableTaskMembers = (members: ProjectMember[]) =>
  members.filter((member) => member.globalRole !== 'admin' && member.projectRole !== 'manager')
