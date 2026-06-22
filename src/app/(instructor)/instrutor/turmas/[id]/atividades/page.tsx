import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import { canAccessInstructorClass } from '@/lib/auth/instructor-access'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { ClassActivitiesManager } from '@/components/activities/ClassActivitiesManager'
import { RefreshClassReportCardsButton } from '@/components/activities/RefreshClassReportCardsButton'
import { getClassActivities } from '@/server/queries/report-cards'
import type { SessionRef } from '@/lib/activities/session-label'

export default async function AtividadesTurmaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getAuthUser()
  const supabase = await createClient()

  const { data: cls } = await supabase
    .from('classes')
    .select('id, name, instructor_id, courses(title)')
    .eq('id', id)
    .single()

  if (!cls || !canAccessInstructorClass(user, cls.instructor_id)) notFound()

  const [{ data: sessions }, activities] = await Promise.all([
    supabase
      .from('class_sessions')
      .select('id, session_date, topic, start_time')
      .eq('class_id', id)
      .neq('status', 'cancelled')
      .order('session_date'),
    getClassActivities(id),
  ])

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/instrutor/turmas/${id}`}>
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} className="mb-2">
            Voltar para a turma
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Atividades</h1>
        <p className="text-muted-foreground">
          {(cls as { courses?: { title: string } }).courses?.title} — {cls.name}
        </p>
      </div>

      <Alert
        variant="info"
        message="Se a turma já foi encerrada e você cadastrou atividades depois, lance a nota de cada aluno em Acessar e use Atualizar boletins. Pendente significa que a nota ainda não foi salva — a coluna Nota mínima é só o critério exigido."
      />

      <RefreshClassReportCardsButton classId={id} />

      <ClassActivitiesManager
        classId={id}
        sessions={(sessions ?? []) as SessionRef[]}
        activities={activities.map(a => ({
          id: a.id,
          title: a.title,
          description: a.description,
          max_score: Number(a.max_score),
          min_passing_score: Number(a.min_passing_score),
          session_id: a.session_id ?? null,
          class_sessions: (a.class_sessions as SessionRef | null) ?? null,
        }))}
      />
    </div>
  )
}
