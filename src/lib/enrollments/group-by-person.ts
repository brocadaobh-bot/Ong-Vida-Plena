import { sortAlphabeticalPtBr } from '@/lib/utils/sort-ptbr'
import type { EnrollmentStatus, UserRole, ClassStatus } from '@/types/database'

export type EnrollmentRowForGrouping = {
  id: string
  beneficiary_id: string
  status: EnrollmentStatus
  enrolled_at: string
  profiles: {
    id: string
    full_name: string
    email: string
    phone: string | null
    role: UserRole
  } | null
  classes: {
    id: string
    name: string
    course_id: string
    status: ClassStatus
    courses: { title: string } | null
  } | null
}

export type GroupedEnrollmentPerson = {
  key: string
  profileId: string
  fullName: string
  email: string
  phone: string | null
  role: UserRole
  enrollments: {
    id: string
    status: EnrollmentStatus
    enrolledAt: string
    courseTitle: string
    className: string
    classId: string
    courseId: string
  }[]
}

/** Agrupa inscrições por e-mail — uma linha por pessoa. */
export function groupEnrollmentsByEmail(
  rows: EnrollmentRowForGrouping[],
): GroupedEnrollmentPerson[] {
  const map = new Map<string, GroupedEnrollmentPerson>()

  for (const row of rows) {
    const email = row.profiles?.email?.trim().toLowerCase()
    const key = email || `id:${row.beneficiary_id}`

    if (!map.has(key)) {
      map.set(key, {
        key,
        profileId: row.profiles?.id ?? row.beneficiary_id,
        fullName: row.profiles?.full_name ?? '—',
        email: row.profiles?.email ?? '—',
        phone: row.profiles?.phone ?? null,
        role: row.profiles?.role ?? 'beneficiary',
        enrollments: [],
      })
    }

    const group = map.get(key)!
    group.enrollments.push({
      id: row.id,
      status: row.status,
      enrolledAt: row.enrolled_at,
      courseTitle: row.classes?.courses?.title ?? '—',
      className: row.classes?.name ?? '—',
      classId: row.classes?.id ?? '',
      courseId: row.classes?.course_id ?? '',
    })
  }

  return sortAlphabeticalPtBr(
    Array.from(map.values()).map(group => ({
      ...group,
      enrollments: sortAlphabeticalPtBr(
        group.enrollments,
        e => `${e.courseTitle} ${e.className}`,
      ),
    })),
    g => g.fullName,
  )
}
