import { createClient } from '@/lib/supabase/server'
import { getAppSetting } from '@/lib/settings/app-settings.server'
import {
  buildClassCompletionPreview,
  CLASS_COMPLETION_MIN_ATTENDANCE_PERCENT,
  type ClassCompletionPreview,
} from '@/lib/classes/completion-eligibility'
import type { GradeRow } from '@/lib/activities/evaluation'

export async function getClassCompletionPreview(
  classId: string,
): Promise<ClassCompletionPreview | null> {
  const supabase = await createClient()

  const { data: cls } = await supabase
    .from('classes')
    .select('id, name, status, courses(title)')
    .eq('id', classId)
    .single()

  if (!cls) return null

  const [{ data: sessions }, { data: enrollments }, { data: activities }] = await Promise.all([
    supabase
      .from('class_sessions')
      .select('id')
      .eq('class_id', classId)
      .neq('status', 'cancelled'),
    supabase
      .from('enrollments')
      .select('id, beneficiary_id, status, profiles!beneficiary_id(full_name, email)')
      .eq('class_id', classId)
      .in('status', ['confirmed', 'completed', 'recovery']),
    supabase
      .from('class_activities')
      .select('id, title, max_score, min_passing_score')
      .eq('class_id', classId)
      .order('sort_order')
      .order('created_at'),
  ])

  const sessionIds = (sessions ?? []).map(s => s.id)
  const enrollmentIds = (enrollments ?? []).map(e => e.id)
  const activityIds = (activities ?? []).map(a => a.id)

  let attendanceRows: {
    enrollment_id: string
    status: import('@/types/database').AttendanceStatus
    session_id: string
  }[] = []

  if (sessionIds.length > 0 && enrollmentIds.length > 0) {
    const { data } = await supabase
      .from('attendance_records')
      .select('enrollment_id, status, session_id')
      .in('session_id', sessionIds)
      .in('enrollment_id', enrollmentIds)

    attendanceRows = data ?? []
  }

  let gradeRows: { activity_id: string; enrollment_id: string; score: number; feedback: string | null }[] = []
  if (activityIds.length > 0 && enrollmentIds.length > 0) {
    const { data } = await supabase
      .from('activity_grades')
      .select('activity_id, enrollment_id, score, feedback')
      .in('activity_id', activityIds)
      .in('enrollment_id', enrollmentIds)

    gradeRows = data ?? []
  }

  const gradesByEnrollment = new Map<string, GradeRow[]>()
  for (const row of gradeRows) {
    const list = gradesByEnrollment.get(row.enrollment_id) ?? []
    list.push({
      activity_id: row.activity_id,
      score: Number(row.score),
      feedback: row.feedback,
    })
    gradesByEnrollment.set(row.enrollment_id, list)
  }

  const minAttendancePercent = await getAppSetting(
    'class_completion_min_attendance_percent',
    CLASS_COMPLETION_MIN_ATTENDANCE_PERCENT,
  )

  return buildClassCompletionPreview({
    classId: cls.id,
    className: cls.name,
    courseTitle: (cls.courses as { title: string } | null)?.title ?? 'Curso',
    classStatus: cls.status,
    sessionIds,
    enrollments: (enrollments ?? []) as Parameters<typeof buildClassCompletionPreview>[0]['enrollments'],
    attendanceRows,
    activities: (activities ?? []).map(a => ({
      id: a.id,
      title: a.title,
      max_score: Number(a.max_score),
      min_passing_score: Number(a.min_passing_score),
    })),
    gradesByEnrollment,
    minAttendancePercent: Number(minAttendancePercent) || CLASS_COMPLETION_MIN_ATTENDANCE_PERCENT,
  })
}
