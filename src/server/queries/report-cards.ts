import { createClient } from '@/lib/supabase/server'
import { getAppSetting } from '@/lib/settings/app-settings.server'
import { buildStudentReportCard, type StudentReportCard } from '@/lib/activities/report-card'
import { formatSessionLabel } from '@/lib/activities/session-label'
import { CLASS_COMPLETION_MIN_ATTENDANCE_PERCENT } from '@/lib/classes/completion-eligibility'

export async function getStudentReportCard(
  enrollmentId: string,
): Promise<StudentReportCard | null> {
  const supabase = await createClient()

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select(`
      id, status, class_id,
      profiles!beneficiary_id(full_name),
      classes(id, name, status, courses(title))
    `)
    .eq('id', enrollmentId)
    .single()

  if (!enrollment) return null

  const classId = enrollment.class_id
  const cls = enrollment.classes as {
    id: string
    name: string
    status: import('@/types/database').ClassStatus
    courses: { title: string } | null
  }

  const [
    { data: activities },
    { data: grades },
    { data: sessions },
    { data: attendance },
    { data: snapshot },
    minAttendancePercent,
  ] = await Promise.all([
    supabase
      .from('class_activities')
      .select('id, title, description, max_score, min_passing_score, session_id')
      .eq('class_id', classId)
      .order('sort_order')
      .order('created_at'),
    supabase
      .from('activity_grades')
      .select('activity_id, score, feedback, graded_at')
      .eq('enrollment_id', enrollmentId),
    supabase
      .from('class_sessions')
      .select('id, session_date, topic, start_time')
      .eq('class_id', classId)
      .neq('status', 'cancelled'),
    supabase
      .from('attendance_records')
      .select('status, session_id')
      .eq('enrollment_id', enrollmentId),
    supabase
      .from('enrollment_report_cards')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .maybeSingle(),
    getAppSetting(
      'class_completion_min_attendance_percent',
      CLASS_COMPLETION_MIN_ATTENDANCE_PERCENT,
    ),
  ])

  const sessionById = new Map((sessions ?? []).map(s => [s.id, s]))
  const sessionIds = new Set((sessions ?? []).map(s => s.id))
  const attendanceRows = (attendance ?? []).filter(r => sessionIds.has(r.session_id))

  return buildStudentReportCard({
    enrollmentId: enrollment.id,
    classId,
    className: cls.name,
    courseTitle: cls.courses?.title ?? 'Curso',
    studentName: (enrollment.profiles as { full_name: string } | null)?.full_name ?? '—',
    enrollmentStatus: enrollment.status,
    classStatus: cls.status,
    activities: (activities ?? []).map(a => {
      const session = a.session_id ? sessionById.get(a.session_id) : null
      return {
        id: a.id,
        title: a.title,
        description: a.description,
        max_score: Number(a.max_score),
        min_passing_score: Number(a.min_passing_score),
        session_label: formatSessionLabel(session ?? null),
      }
    }),
    grades: (grades ?? []).map(g => ({
      activity_id: g.activity_id,
      score: Number(g.score),
      feedback: g.feedback,
      graded_at: g.graded_at,
    })),
    attendanceRows,
    minAttendancePercent: Number(minAttendancePercent) || CLASS_COMPLETION_MIN_ATTENDANCE_PERCENT,
    snapshot: snapshot
      ? {
          approved: snapshot.approved,
          generated_at: snapshot.generated_at,
          recovery_reopened_at: snapshot.recovery_reopened_at,
          attendance_percent: Number(snapshot.attendance_percent),
          average_score: snapshot.average_score !== null ? Number(snapshot.average_score) : null,
          activities_total: snapshot.activities_total,
          activities_passed: snapshot.activities_passed,
        }
      : null,
  })
}

export async function getBeneficiaryReportCards(
  beneficiaryId: string,
): Promise<StudentReportCard[]> {
  const supabase = await createClient()

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('id')
    .eq('beneficiary_id', beneficiaryId)
    .in('status', ['confirmed', 'completed', 'recovery'])

  if (!enrollments?.length) return []

  const cards: StudentReportCard[] = []

  for (const enrollment of enrollments) {
    const report = await getStudentReportCard(enrollment.id)
    if (!report) continue

    const hasContent =
      report.generatedAt !== null ||
      report.activities.some(a => a.score !== null)

    if (hasContent) {
      cards.push(report)
    }
  }

  return cards
}

export async function getClassActivities(classId: string) {
  const supabase = await createClient()

  const [{ data: activities }, { data: sessions }] = await Promise.all([
    supabase
      .from('class_activities')
      .select('*')
      .eq('class_id', classId)
      .order('sort_order')
      .order('created_at'),
    supabase
      .from('class_sessions')
      .select('id, session_date, topic, start_time')
      .eq('class_id', classId)
      .neq('status', 'cancelled'),
  ])

  const sessionById = new Map((sessions ?? []).map(s => [s.id, s]))

  return (activities ?? []).map(a => ({
    ...a,
    class_sessions: a.session_id ? sessionById.get(a.session_id) ?? null : null,
  }))
}

export async function getClassActivityById(activityId: string) {
  const supabase = await createClient()
  const { data: activity } = await supabase
    .from('class_activities')
    .select('*')
    .eq('id', activityId)
    .maybeSingle()

  if (!activity) return null

  const [{ data: cls }, { data: session }] = await Promise.all([
    supabase
      .from('classes')
      .select('id, name, instructor_id, courses(title)')
      .eq('id', activity.class_id)
      .single(),
    activity.session_id
      ? supabase
          .from('class_sessions')
          .select('id, session_date, topic, start_time')
          .eq('id', activity.session_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  return {
    ...activity,
    classes: cls,
    class_sessions: session,
  }
}
