import type { Task, TaskAssignee } from '../types'

export const getMemberId = (member: TaskAssignee): string =>
  typeof member === 'string' ? member : ('id' in member ? member.id : member._id)

export const getMemberName = (member: TaskAssignee): string =>
  typeof member === 'string' ? 'Member' : member.name

export const getAssignedUserId = (user: Task['assignedTo']): string =>
  user?.id || user?._id || ''
