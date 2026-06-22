import type { AttendanceStatus } from '@/types/database'
import { computeAttendanceStats } from '@/lib/attendance/stats'
import {
  evaluateStudentActivities,
  type ActivityDef,
  type GradeRow,
} from '@/lib/activities/evaluation'

export const CLASS_COMPLETION_MIN_ATTENDANCE_PERCENT = 80

const ATTENDED_STATUSES: AttendanceStatus[] = ['present', 'late', 'justified']

export type ClassCompletionStudentPreview = {
  enrollmentId: string
  profileId: string
  fullName: string
  email: string
  enrollmentStatus: string
  totalSessions: number
  attendedSessions: number
  presenceRate: number
  attendanceMet: boolean
  activitiesSummary: string
  activitiesMet: boolean
  averageScore: number | null
  eligible: boolean
}

export type ClassCompletionPreview = {
  classId: string
  className: string
  courseTitle: string
  classStatus: string
  minAttendancePercent: number
  totalSessions: number
  activityCount: number
  requirementsNote: string
  students: ClassCompletionStudentPreview[]
  eligibleCount: number
  ineligibleCount: number
}

type AttendanceRow = { enrollment_id: string; status: AttendanceStatus; session_id: string }

type EnrollmentRow = {
  id: string
  beneficiary_id: string
  status: string
  profiles: { full_name: string; email: string } | null
}

export function buildClassCompletionPreview(input: {
  classId: string
  className: string
  courseTitle: string
  classStatus: string
  sessionIds: string[]
  enrollments: EnrollmentRow[]
  attendanceRows: AttendanceRow[]
  activities?: ActivityDef[]
  gradesByEnrollment?: Map<string, GradeRow[]>
  minAttendancePercent?: number
}): ClassCompletionPreview {
  const minAttendancePercent = input.minAttendancePercent ?? CLASS_COMPLETION_MIN_ATTENDANCE_PERCENT
  const totalSessions = input.sessionIds.length
  const activities = input.activities ?? []
  const activityCount = activities.length
  const gradesByEnrollment = input.gradesByEnrollment ?? new Map()

  const requirementsNote =
    activityCount > 0
      ? `Aprovação exige presença mínima de ${minAttendancePercent}% e nota mínima em todas as ${activityCount} atividade(s).`
      : `Aprovação exige presença mínima de ${minAttendancePercent}%. Cadastre atividades para exigir notas.`

  const attendanceByEnrollment = new Map<string, AttendanceRow[]>()
  for (const row of input.attendanceRows) {
    const list = attendanceByEnrollment.get(row.enrollment_id) ?? []
    list.push(row)
    attendanceByEnrollment.set(row.enrollment_id, list)
  }

  const activeEnrollments = input.enrollments.filter(e =>
    ['confirmed', 'completed', 'recovery'].includes(e.status),
  )

  const students: ClassCompletionStudentPreview[] = activeEnrollments.map(enrollment => {
    const records = attendanceByEnrollment.get(enrollment.id) ?? []
    const stats = computeAttendanceStats(records)
    const attendedSessions = records.filter(r => ATTENDED_STATUSES.includes(r.status)).length
    const attendanceMet =
      totalSessions > 0 &&
      stats.presenceRate >= minAttendancePercent

    const activityEval = evaluateStudentActivities(
      activities,
      gradesByEnrollment.get(enrollment.id) ?? [],
    )

    return {
      enrollmentId: enrollment.id,
      profileId: enrollment.beneficiary_id,
      fullName: enrollment.profiles?.full_name ?? '—',
      email: enrollment.profiles?.email ?? '—',
      enrollmentStatus: enrollment.status,
      totalSessions,
      attendedSessions,
      presenceRate: stats.presenceRate,
      attendanceMet,
      activitiesSummary: activityEval.summary,
      activitiesMet: activityEval.activitiesMet,
      averageScore: activityEval.averageScore,
      eligible: attendanceMet && activityEval.activitiesMet,
    }
  })

  students.sort((a, b) => a.fullName.localeCompare(b.fullName, 'pt-BR'))

  return {
    classId: input.classId,
    className: input.className,
    courseTitle: input.courseTitle,
    classStatus: input.classStatus,
    minAttendancePercent,
    totalSessions,
    activityCount,
    requirementsNote,
    students,
    eligibleCount: students.filter(s => s.eligible).length,
    ineligibleCount: students.filter(s => !s.eligible).length,
  }
}

export function buildStudentEligibility(input: {
  sessionIds: string[]
  attendanceRows: AttendanceRow[]
  activities: ActivityDef[]
  grades: GradeRow[]
  minAttendancePercent?: number
}): {
  presenceRate: number
  attendanceMet: boolean
  activityEval: ReturnType<typeof evaluateStudentActivities>
  eligible: boolean
} {
  const minAttendancePercent = input.minAttendancePercent ?? CLASS_COMPLETION_MIN_ATTENDANCE_PERCENT
  const stats = computeAttendanceStats(input.attendanceRows)
  const totalSessions = input.sessionIds.length
  const attendanceMet = totalSessions > 0 && stats.presenceRate >= minAttendancePercent
  const activityEval = evaluateStudentActivities(input.activities, input.grades)

  return {
    presenceRate: stats.presenceRate,
    attendanceMet,
    activityEval,
    eligible: attendanceMet && activityEval.activitiesMet,
  }
}
