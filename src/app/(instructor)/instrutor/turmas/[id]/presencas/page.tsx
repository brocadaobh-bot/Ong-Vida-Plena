import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import { canAccessInstructorClass } from '@/lib/auth/instructor-access'
import { ACTIVE_CLASS_ENROLLMENT_STATUSES } from '@/lib/enrollments/access'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { EnrollmentStatusBadge } from '@/components/ui/Badge'
import { AttendanceForm } from './AttendanceForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function PresencasPage({
  params,
  searchParams,
}: {
  params:       Promise<{ id: string }>
  searchParams: Promise<{ session?: string }>
}) {
  const { id } = await params
  const { session: sessionParam } = await searchParams
  const user = await getAuthUser()
  const supabase = await createClient()

  const { data: cls } = await supabase
    .from('classes')
    .select('id, name, instructor_id, courses(title)')
    .eq('id', id)
    .single()

  if (!cls || !canAccessInstructorClass(user, cls.instructor_id)) notFound()

  const { data: sessions } = await supabase
    .from('class_sessions')
    .select('*')
    .eq('class_id', id)
    .in('status', ['scheduled', 'completed'])
    .order('session_date')

  const selectedSessionId = sessionParam ?? sessions?.[sessions.length - 1]?.id
  const selectedSession   = sessions?.find(s => s.id === selectedSessionId)

  const { data: allEnrollments } = await supabase
    .from('enrollments')
    .select('id, beneficiary_id, status, profiles!beneficiary_id(full_name)')
    .eq('class_id', id)
    .in('status', [...ACTIVE_CLASS_ENROLLMENT_STATUSES, 'pending'])
    .order('enrolled_at')

  const enrollments =
    allEnrollments?.filter(e => ACTIVE_CLASS_ENROLLMENT_STATUSES.includes(e.status)) ?? []
  const pendingEnrollments = allEnrollments?.filter(e => e.status === 'pending') ?? []

  const { data: existingAttendance } = selectedSessionId
    ? await supabase
        .from('attendance_records')
        .select('enrollment_id, status, notes')
        .eq('session_id', selectedSessionId)
    : { data: [] }

  const attendanceMap = new Map(
    (existingAttendance ?? []).map(a => [a.enrollment_id, a])
  )

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/instrutor/turmas/${id}`}>
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} className="mb-2">
            Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Registro de Presença</h1>
        <p className="text-muted-foreground">{(cls as any).courses?.title} — {cls.name}</p>
      </div>

      {sessions && sessions.length > 0 && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Selecionar Aula</h2>
          <div className="flex flex-wrap gap-2">
            {sessions.map((session: any) => (
              <Link
                key={session.id}
                href={`/instrutor/turmas/${id}/presencas?session=${session.id}`}
              >
                <button
                  type="button"
                  className={session.id === selectedSessionId ? 'session-btn-active' : 'session-btn'}
                >
                  {format(new Date(session.session_date), 'dd/MM', { locale: ptBR })}
                  {session.topic && ` — ${session.topic}`}
                </button>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {!selectedSession ? (
        <Card>
          <p className="py-8 text-center text-muted-foreground">
            {sessions?.length === 0
              ? 'Nenhuma aula cadastrada para esta turma.'
              : 'Selecione uma aula acima para registrar presença.'}
          </p>
        </Card>
      ) : enrollments.length === 0 ? (
        <Card>
          <div className="space-y-4 py-6 text-center">
            <p className="font-medium text-foreground">Nenhum aluno confirmado nesta turma</p>
            <p className="text-sm text-muted-foreground">
              Só aparecem aqui inscrições com status confirmado, em recuperação ou concluído.
            </p>
            {pendingEnrollments.length > 0 ? (
              <Alert
                variant="warning"
                message={`Há ${pendingEnrollments.length} inscrição(ões) aguardando confirmação. Peça ao assistente ou admin para confirmar antes de registrar presença.`}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum aluno inscrito nesta turma ainda.
              </p>
            )}
          </div>
        </Card>
      ) : (
        <AttendanceForm
          key={selectedSession.id}
          sessionId={selectedSession.id}
          sessionDate={selectedSession.session_date}
          enrollments={enrollments as any[]}
          existingAttendance={attendanceMap}
          classId={id}
        />
      )}

      {pendingEnrollments.length > 0 && enrollments.length > 0 && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Aguardando confirmação ({pendingEnrollments.length})
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Estes alunos ainda não entram no registro de presença até a inscrição ser confirmada.
          </p>
          <div className="divide-y divide-border">
            {pendingEnrollments.map(enrollment => (
              <div
                key={enrollment.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <p className="text-sm font-medium text-foreground">
                  {(enrollment.profiles as { full_name: string } | null)?.full_name ?? 'Aluno'}
                </p>
                <EnrollmentStatusBadge status="pending" />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
