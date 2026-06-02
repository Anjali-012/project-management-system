import type { Member, Task } from '../types'

export const getMemberId = (member: Member | string): string =>
  typeof member === 'string' ? member : member.id || member._id || ''

export const getMemberName = (member: Member | string): string =>
  typeof member === 'string' ? 'Member' : member.name

export const getAssignedUserId = (user: Task['assignedTo']): string =>
  user?.id || user?._id || ''