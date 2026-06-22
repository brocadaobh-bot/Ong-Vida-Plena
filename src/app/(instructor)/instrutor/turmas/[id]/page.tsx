import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import { canAccessInstructorClass } from '@/lib/auth/instructor-access'
import { Card } from '@/components/ui/Card'
import { ClassStatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { ClassInfoManager } from '@/components/class-info/ClassInfoManager'
import { CompleteClassButton } from '@/components/class/CompleteClassButton'
import { ReevaluateRecoveryButton } from '@/components/activities/ReevaluateRecoveryButton'
import { Users, ClipboardCheck, Calendar, MapPin, ClipboardList } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function TurmaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getAuthUser()
  const supabase = await createClient()

  const { data: cls } = await supabase
    .from('classes')
    .select('*, courses(title, description, category, workload_hours)')
    .eq('id', id)
    .single()

  if (!cls || !canAccessInstructorClass(user, cls.instructor_id)) notFound()

  const { data: stats } = await supabase
    .rpc('get_class_enrollment_stats', { p_class_id: id })
    .single()

  const enrollmentStats = stats as {
    confirmed: number
    pending: number
    recovery: number
    completed: number
    available: number
  } | null

  const activeStudents =
    (enrollmentStats?.confirmed ?? 0) +
    (enrollmentStats?.recovery ?? 0) +
    (enrollmentStats?.completed ?? 0)

  const { data: sessions } = await supabase
    .from('class_sessions')
    .select('*')
    .eq('class_id', id)
    .order('session_date')

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">{(cls as any).courses?.title}</h1>
            <p className="text-muted-foreground">{cls.name}</p>
          </div>
          <span className="self-start shrink-0">
            <ClassStatusBadge status={cls.status} />
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {format(new Date(cls.start_date), 'dd/MM/yyyy', { locale: ptBR })}
            {cls.end_date && <> — {format(new Date(cls.end_date), 'dd/MM/yyyy', { locale: ptBR })}</>}
          </span>
          {cls.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {cls.location}{cls.room ? ` — ${cls.room}` : ''}
            </span>
          )}
        </div>
      </div>

      {enrollmentStats && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
            {[
              { label: 'Confirmados', value: enrollmentStats.confirmed },
              { label: 'Pendentes', value: enrollmentStats.pending },
              { label: 'Recuperação', value: enrollmentStats.recovery ?? 0 },
              { label: 'Concluídos', value: enrollmentStats.completed },
              { label: 'Vagas disp.', value: enrollmentStats.available },
            ].map(item => (
              <Card key={item.label}>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-2xl font-bold text-foreground">{item.value}</p>
              </Card>
            ))}
          </div>

          {activeStudents > 0 &&
            enrollmentStats.confirmed === 0 &&
            enrollmentStats.pending === 0 && (
              <p className="text-sm text-muted-foreground">
                Os alunos desta turma estão em recuperação ou já concluíram — por isso
                confirmados e pendentes aparecem zerados. Veja a lista completa em{' '}
                <Link href={`/instrutor/turmas/${id}/alunos`} className="text-primary-600 hover:underline dark:text-primary-400">
                  Ver Alunos
                </Link>
                .
              </p>
            )}

          {activeStudents === 0 && enrollmentStats.pending === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum aluno confirmado nesta turma. Inscrições precisam ser aprovadas pelo
              assistente ou admin antes de registrar presença.
            </p>
          )}
        </>
      )}

      <div className="flex flex-wrap gap-3">
        <ClassInfoManager
          classId={id}
          triggerLabel="Gerenciar avisos e informações"
          triggerVariant="primary"
          triggerSize="md"
        />
        <Link href={`/instrutor/turmas/${id}/alunos`}>
          <Button leftIcon={<Users className="h-4 w-4" />}>
            Ver Alunos
          </Button>
        </Link>
        <Link href={`/instrutor/turmas/${id}/presencas`}>
          <Button variant="secondary" leftIcon={<ClipboardCheck className="h-4 w-4" />}>
            Registrar Presença
          </Button>
        </Link>
        <Link href={`/instrutor/turmas/${id}/atividades`}>
          <Button variant="secondary" leftIcon={<ClipboardList className="h-4 w-4" />}>
            Atividades
          </Button>
        </Link>
        <CompleteClassButton classId={id} classStatus={cls.status} />
        {cls.status === 'completed' && (
          <ReevaluateRecoveryButton classId={id} />
        )}
      </div>

      {!['completed', 'cancelled'].includes(cls.status) && (
        <Alert
          variant="info"
          message="Encerrar turma finaliza o curso para todos os alunos de uma vez. Avaliar ou salvar notas de um aluno não encerra a turma."
        />
      )}

      <Card>
        <h2 className="mb-4 text-base font-semibold text-foreground">Aulas Programadas</h2>
        {!sessions || sessions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma aula programada.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {sessions.map((session: any) => (
              <div key={session.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {format(new Date(session.session_date), "dd 'de' MMMM", { locale: ptBR })}
                    {session.start_time && <> · {session.start_time}{session.end_time && ` — ${session.end_time}`}</>}
                  </p>
                  {session.topic && (
                    <p className="text-xs text-muted-foreground">{session.topic}</p>
                  )}
                </div>
                <Link href={`/instrutor/turmas/${id}/presencas?session=${session.id}`}>
                  <Button size="sm" variant="ghost">
                    <ClipboardCheck className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
