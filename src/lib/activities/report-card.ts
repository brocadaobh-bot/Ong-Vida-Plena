import type { ActivityDef, GradeRow } from '@/lib/activities/evaluation'
import { evaluateStudentActivities } from '@/lib/activities/evaluation'
import type { AttendanceStatus, ClassStatus } from '@/types/database'
import { computeAttendanceStats } from '@/lib/attendance/stats'

export type ReportCardActivityItem = {
  activityId: string
  title: string
  sessionLabel: string | null
  maxScore: number
  minPassingScore: number
  score: number | null
  feedback: string | null
  passed: boolean | null
  gradedAt: string | null
}

export type StudentReportCard = {
  enrollmentId: string
  classId: string
  className: string
  courseTitle: string
  studentName: string
  enrollmentStatus: string
  classStatus: ClassStatus
  attendancePercent: number
  averageScore: number | null
  activitiesTotal: number
  activitiesPassed: number
  activitiesMet: boolean
  attendanceMet: boolean
  approved: boolean
  activities: ReportCardActivityItem[]
  generatedAt: string | null
  recoveryReopenedAt: string | null
  minAttendancePercent: number
}

type AttendanceRow = { status: AttendanceStatus }

export function buildStudentReportCard(input: {
  enrollmentId: string
  classId: string
  className: string
  courseTitle: string
  studentName: string
  enrollmentStatus: string
  classStatus: ClassStatus
  activities: (ActivityDef & { description?: string | null; session_label?: string | null })[]
  grades: (GradeRow & { graded_at?: string | null })[]
  attendanceRows: AttendanceRow[]
  minAttendancePercent: number
  snapshot?: {
    approved: boolean
    generated_at: string
    recovery_reopened_at: string | null
    attendance_percent: number
    average_score: number | null
    activities_total: number
    activities_passed: number
  } | null
}): StudentReportCard {
  const stats = computeAttendanceStats(input.attendanceRows)
  const activityEval = evaluateStudentActivities(input.activities, input.grades)
  const attendanceMet = stats.presenceRate >= input.minAttendancePercent

  const gradeByActivity = new Map(input.grades.map(g => [g.activity_id, g]))

  const activities: ReportCardActivityItem[] = input.activities.map(activity => {
    const grade = gradeByActivity.get(activity.id)
    const score = grade?.score ?? null
    const passed = score === null ? null : score >= activity.min_passing_score

    return {
      activityId: activity.id,
      title: activity.title,
      sessionLabel: 'session_label' in activity ? (activity.session_label ?? null) : null,
      maxScore: activity.max_score,
      minPassingScore: activity.min_passing_score,
      score,
      feedback: grade?.feedback ?? null,
      passed,
      gradedAt: grade?.graded_at ?? null,
    }
  })

  // Métricas sempre calculadas ao vivo — snapshot antigo (ex.: turma encerrada antes de
  // cadastrar novas atividades) não pode congelar totais ou aprovação.
  const approved = attendanceMet && activityEval.activitiesMet

  return {
    enrollmentId: input.enrollmentId,
    classId: input.classId,
    className: input.className,
    courseTitle: input.courseTitle,
    studentName: input.studentName,
    enrollmentStatus: input.enrollmentStatus,
    classStatus: input.classStatus,
    attendancePercent: stats.presenceRate,
    averageScore: activityEval.averageScore,
    activitiesTotal: activityEval.totalCount,
    activitiesPassed: activityEval.passedCount,
    activitiesMet: activityEval.activitiesMet,
    attendanceMet,
    approved,
    activities,
    generatedAt: input.snapshot?.generated_at ?? null,
    recoveryReopenedAt: input.snapshot?.recovery_reopened_at ?? null,
    minAttendancePercent: input.minAttendancePercent,
  }
}
