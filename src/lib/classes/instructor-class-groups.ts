import type { ClassStatus } from '@/types/database'

export const ACTIVE_CLASS_STATUSES: ClassStatus[] = ['planned', 'open', 'in_progress']

export const ARCHIVED_CLASS_STATUSES: ClassStatus[] = ['completed', 'cancelled']

export function isActiveClassStatus(status: ClassStatus): boolean {
  return ACTIVE_CLASS_STATUSES.includes(status)
}

export function isArchivedClassStatus(status: ClassStatus): boolean {
  return ARCHIVED_CLASS_STATUSES.includes(status)
}
