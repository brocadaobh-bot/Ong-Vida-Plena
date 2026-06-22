import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import { canAccessInstructorClass } from '@/lib/auth/instructor-access'
import { Button } from '@/components/ui/Button'
import { EnrollmentStatusBadge } from '@/components/ui/Badge'
import { StudentEvaluationForm } from '@/components/activities/StudentEvaluationForm'
import { ReportCardView } from '@/components/activities/ReportCardView'
import { RecoveryActions } from '@/components/activities/RecoveryActions'
import { getStudentReportCard, getClassActivities } from '@/server/queries/report-cards'

export default async function AlunoAvaliacaoPage({
  params,
}: {
  params: Promise<{ id: string; enrollmentId: string }>
}) {
  const { id, enrollmentId } = await params
  const user = await getAuthUser()
  const supabase = await createClient()

  const { data: cls } = await supabase
    .from('classes')
    .select('id, name, status, instructor_id, courses(title)')
    .eq('id', id)
    .single()

  if (!cls || !canAccessInstructorClass(user, cls.instructor_id)) notFound()

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, status, profiles!beneficiary_id(full_name, email)')
    .eq('id', enrollmentId)
    .eq('class_id', id)
    .single()

  if (!enrollment) notFound()

  const [activities, report] = await Promise.all([
    getClassActivities(id),
    getStudentReportCard(enrollmentId),
  ])

  if (!report) notFound()

  const { data: grades } = await supabase
    .from('activity_grades')
    .select('activity_id, score, feedback')
    .eq('enrollment_id', enrollmentId)

  const profile = enrollment.profiles as { full_name: string; email: string } | null
  const canApprove = report.attendanceMet && report.activitiesMet

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/instrutor/turmas/${id}/alunos`}>
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} className="mb-2">
            Voltar para alunos
          </Button>
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{profile?.full_name}</h1>
            <p className="text-muted-foreground">
              {(cls as any).courses?.title} — {cls.name}
            </p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
          <EnrollmentStatusBadge status={enrollment.status} />
        </div>
      </div>

      <RecoveryActions
        enrollmentId={enrollmentId}
        enrollmentStatus={enrollment.status}
        canApprove={canApprove}
        classStatus={cls.status}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-foreground">Avaliar atividades</h2>
          <StudentEvaluationForm
            enrollmentId={enrollmentId}
            activities={activities.map(a => ({
              id: a.id,
              title: a.title,
              description: a.description,
              max_score: Number(a.max_score),
              min_passing_score: Number(a.min_passing_score),
            }))}
            grades={(grades ?? []).map(g => ({
              activity_id: g.activity_id,
              score: Number(g.score),
              feedback: g.feedback,
            }))}
          />
        </div>

        <div>
          <h2 className="mb-4 text-base font-semibold text-foreground">Boletim do aluno</h2>
          <ReportCardView report={report} />
        </div>
      </div>
    </div>
  )
}
