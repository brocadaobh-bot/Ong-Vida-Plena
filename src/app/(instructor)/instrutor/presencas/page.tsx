import { getAuthUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ClipboardCheck, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function InstrutorPresencasHubPage() {
  const user = await getAuthUser()
  const supabase = await createClient()

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, start_date, courses(title)')
    .eq('instructor_id', user!.id)
    .in('status', ['open', 'in_progress', 'planned'])
    .order('start_date', { ascending: false })

  const classIds = classes?.map(c => c.id) ?? []
  const sessionCount = new Map<string, number>()

  if (classIds.length > 0) {
    const { data: sessions } = await supabase
      .from('class_sessions')
      .select('class_id')
      .in('class_id', classIds)
      .in('status', ['scheduled', 'completed'])

    sessions?.forEach(s => {
      sessionCount.set(s.class_id, (sessionCount.get(s.class_id) ?? 0) + 1)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Presenças</h1>
        <p className="text-muted-foreground">
          Selecione uma turma para registrar presença nas aulas.
        </p>
      </div>

      {!classes || classes.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <ClipboardCheck className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhuma turma ativa atribuída a você.</p>
            <Link href="/instrutor/turmas" className="mt-4 inline-block">
              <Button variant="secondary" size="sm">Ver turmas</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {classes.map((cls: any) => (
            <Card key={cls.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">{cls.courses?.title}</p>
                <p className="text-sm text-muted-foreground">
                  {cls.name} · {format(new Date(cls.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {sessionCount.get(cls.id) ?? 0} aula(s) programada(s)
                </p>
              </div>
              <Link href={`/instrutor/turmas/${cls.id}/presencas`}>
                <Button size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Registrar presença
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
