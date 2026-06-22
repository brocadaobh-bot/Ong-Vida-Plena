import type { ClassStatus } from '@/types/database'

export const CLASS_STATUS_DISPLAY_ORDER: ClassStatus[] = [
  'open',
  'in_progress',
  'planned',
  'completed',
  'cancelled',
]

export type ClassStatusCounts = Record<ClassStatus, number>

export function emptyClassStatusCounts(): ClassStatusCounts {
  return {
    planned: 0,
    open: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  }
}

export function aggregateClassesByCourse(
  classes: { course_id: string; status: ClassStatus }[],
): Map<string, { total: number; byStatus: ClassStatusCounts }> {
  const map = new Map<string, { total: number; byStatus: ClassStatusCounts }>()

  for (const cls of classes) {
    const current = map.get(cls.course_id) ?? {
      total: 0,
      byStatus: emptyClassStatusCounts(),
    }
    current.total += 1
    current.byStatus[cls.status] += 1
    map.set(cls.course_id, current)
  }

  return map
}

export function getActiveClassStatuses(byStatus: ClassStatusCounts): ClassStatus[] {
  return CLASS_STATUS_DISPLAY_ORDER.filter(status => byStatus[status] > 0)
}
