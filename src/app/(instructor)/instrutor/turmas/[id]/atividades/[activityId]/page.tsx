import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import { canAccessInstructorClass } from '@/lib/auth/instructor-access'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { ActivityStudentsGradesList } from '@/components/activities/ActivityStudentsGradesList'
import { EditActivityButton } from '@/components/activities/EditActivityButton'
import { getClassActivityById } from '@/server/queries/report-cards'
import { formatSessionLabel, type SessionRef } from '@/lib/activities/session-label'

export default async function AtividadeDetalhePage({
  params,
}: {
  params: Promise<{ id: string; activityId: string }>
}) {
  const { id, activityId } = await params
  const user = await getAuthUser()
  const supabase = await createClient()

  const activity = await getClassActivityById(activityId)
  if (!activity || activity.class_id !== id) notFound()

  const cls = activity.classes as {
    id: string
    name: string
    instructor_id: string | null
    courses: { title: string } | null
  } | null

  if (!cls || !canAccessInstructorClass(user, cls.instructor_id)) notFound()

  const [{ data: enrollments }, { data: grades }, { data: sessions }] = await Promise.all([
    supabase
      .from('enrollments')
      .select('id, profiles!beneficiary_id(full_name)')
      .eq('class_id', id)
      .in('status', ['confirmed', 'recovery', 'completed'])
      .order('enrolled_at'),
    supabase
      .from('activity_grades')
      .select('enrollment_id, score, feedback')
      .eq('activity_id', activityId),
    supabase
      .from('class_sessions')
      .select('id, session_date, topic, start_time')
      .eq('class_id', id)
      .neq('status', 'cancelled')
      .order('session_date'),
  ])

  const session = activity.class_sessions as SessionRef | null
  const gradesByEnrollment: Record<string, { score: number; feedback: string | null }> = {}
  for (const g of grades ?? []) {
    gradesByEnrollment[g.enrollment_id] = {
      score: Number(g.score),
      feedback: g.feedback,
    }
  }

  const enrollmentIds = (enrollments ?? []).map(e => e.id)
  const attendanceByEnrollment = new Map<string, import('@/types/database').AttendanceStatus>()

  if (activity.session_id && enrollmentIds.length > 0) {
    const { data: attendance } = await supabase
      .from('attendance_records')
      .select('enrollment_id, status')
      .eq('session_id', activity.session_id)
      .in('enrollment_id', enrollmentIds)

    for (const row of attendance ?? []) {
      attendanceByEnrollment.set(row.enrollment_id, row.status)
    }
  }

  const students = (enrollments ?? []).map(e => ({
    enrollmentId: e.id,
    fullName: (e.profiles as { full_name: string } | null)?.full_name ?? '—',
    attendanceStatus: attendanceByEnrollment.get(e.id) ?? null,
  }))

  students.sort((a, b) => a.fullName.localeCompare(b.fullName, 'pt-BR'))

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/instrutor/turmas/${id}/atividades`}>
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} className="mb-2">
            Voltar para atividades
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{activity.title}</h1>
        <p className="text-muted-foreground">
          {cls.courses?.title} — {cls.name}
        </p>
      </div>

      <Card className="p-4">
        {!activity.session_id && (
          <Alert
            variant="warning"
            message="Esta atividade ainda não está vinculada a uma aula."
            className="mb-4"
          />
        )}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Aula: <span className="font-medium text-foreground">{formatSessionLabel(session)}</span>
            </span>
            <span className="text-muted-foreground">
              Nota máxima: <span className="font-medium text-foreground">{activity.max_score}</span>
            </span>
            <span className="text-muted-foreground">
              Mínima para aprovação: <span className="font-medium text-foreground">{activity.min_passing_score}</span>
            </span>
          </div>
          <EditActivityButton
            activity={{
              id: activity.id,
              title: activity.title,
              description: activity.description,
              max_score: Number(activity.max_score),
              min_passing_score: Number(activity.min_passing_score),
              session_id: activity.session_id,
            }}
            sessions={(sessions ?? []) as SessionRef[]}
            linkOnly={!activity.session_id}
          />
        </div>
        {activity.description && (
          <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">{activity.description}</p>
        )}
      </Card>

      <div>
        <h2 className="mb-4 text-base font-semibold text-foreground">Notas dos alunos</h2>
        <ActivityStudentsGradesList
          activityId={activityId}
          maxScore={Number(activity.max_score)}
          minPassingScore={Number(activity.min_passing_score)}
          students={students}
          gradesByEnrollment={gradesByEnrollment}
          sessionLinked={Boolean(activity.session_id)}
        />
      </div>
    </div>
  )
}
