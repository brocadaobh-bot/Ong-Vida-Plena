import type { ClassStatus } from '@/types/database'
import { CLASS_STATUS_LABELS } from '@/types/domain'
import type { AdminFilter } from '@/components/admin/AdminFilterBar'

const CLASS_STATUS_FILTERS: ClassStatus[] = [
  'planned',
  'open',
  'in_progress',
  'completed',
  'cancelled',
]

export function isValidClassStatusFilter(
  value: string | undefined,
): value is ClassStatus {
  return CLASS_STATUS_FILTERS.includes(value as ClassStatus)
}

export function buildTurmasFilterUrl(
  basePath: string,
  params: { courseId?: string; status?: ClassStatus },
): string {
  const search = new URLSearchParams()
  if (params.courseId) search.set('course_id', params.courseId)
  if (params.status) search.set('status', params.status)
  const query = search.toString()
  return query ? `${basePath}?${query}` : basePath
}

export function buildTurmasAdminFilters(params: {
  courseId?: string
  courseTitle?: string
  status?: ClassStatus
}): AdminFilter[] {
  const filters: AdminFilter[] = []

  if (params.courseId && params.courseTitle) {
    filters.push({
      key: 'course',
      param: 'course_id',
      label: `Curso: ${params.courseTitle}`,
      value: params.courseId,
    })
  }

  if (params.status) {
    filters.push({
      key: 'status',
      label: CLASS_STATUS_LABELS[params.status],
      value: params.status,
    })
  }

  return filters
}

export function buildAdminFilterClearUrl(
  basePath: string,
  filters: AdminFilter[],
  removeKey: string,
): string {
  const search = new URLSearchParams()

  for (const filter of filters) {
    if (filter.key === removeKey) continue
    search.set(filter.param ?? filter.key, filter.value)
  }

  const query = search.toString()
  return query ? `${basePath}?${query}` : basePath
}
