import { sortAlphabeticalPtBr } from '@/lib/utils/sort-ptbr'
import type { EnrollmentRowForGrouping } from '@/lib/enrollments/group-by-person'
import type { EnrollmentStatus, ClassStatus } from '@/types/database'

export type GroupedEnrollmentClass = {
  key: string
  classId: string
  className: string
  classStatus: ClassStatus
  courseTitle: string
  courseId: string
  enrollments: {
    id: string
    status: EnrollmentStatus
    enrolledAt: string
    profileId: string
    fullName: string
    email: string
    phone: string | null
  }[]
}

/** Agrupa inscrições por turma — uma linha por turma. */
export function groupEnrollmentsByClass(
  rows: EnrollmentRowForGrouping[],
): GroupedEnrollmentClass[] {
  const map = new Map<string, GroupedEnrollmentClass>()

  for (const row of rows) {
    const classId = row.classes?.id
    if (!classId) continue

    if (!map.has(classId)) {
      map.set(classId, {
        key: classId,
        classId,
        className: row.classes?.name ?? '—',
        classStatus: row.classes?.status ?? 'planned',
        courseTitle: row.classes?.courses?.title ?? '—',
        courseId: row.classes?.course_id ?? '',
        enrollments: [],
      })
    }

    map.get(classId)!.enrollments.push({
      id: row.id,
      status: row.status,
      enrolledAt: row.enrolled_at,
      profileId: row.profiles?.id ?? row.beneficiary_id,
      fullName: row.profiles?.full_name ?? '—',
      email: row.profiles?.email ?? '—',
      phone: row.profiles?.phone ?? null,
    })
  }

  return sortAlphabeticalPtBr(
    Array.from(map.values()).map(group => ({
      ...group,
      enrollments: sortAlphabeticalPtBr(group.enrollments, e => e.fullName),
    })),
    g => `${g.courseTitle} ${g.className}`,
  )
}
