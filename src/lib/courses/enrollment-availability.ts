import type { ClassStatusCounts } from '@/lib/classes/course-class-counts'
import type { CourseStatus } from '@/types/database'

/** Curso sem turma aberta — beneficiários não conseguem se inscrever. */
export function courseNeedsEnrollmentReopen(
  courseStatus: CourseStatus,
  byStatus: ClassStatusCounts,
): boolean {
  if (courseStatus === 'draft') return false
  return byStatus.open === 0
}
