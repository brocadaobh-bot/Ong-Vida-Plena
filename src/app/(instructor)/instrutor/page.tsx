import { getAuthUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { Card, StatCard } from '@/components/ui/Card'
import { ClassStatusBadge } from '@/components/ui/Badge'
import { BookOpen, ClipboardCheck } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function InstructorDashboard() {
  const user     = await getAuthUser()
  const supabase = await createClient()

  const { data: classes } = await supabase
    .from('classes')
    .select('*, courses(title)')
    .eq('instructor_id', user!.id)
    .in('status', ['open', 'in_progress', 'planned'])
    .order('start_date')

  const active   = classes?.filter(c => c.status === 'in_progress').length ?? 0
  const upcoming = classes?.filter(c => ['open','planned'].includes(c.status)).length ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Olá, {user!.full_name.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground">Gerencie suas turmas e registros de presença.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard title="Turmas em Andamento" value={active} icon={BookOpen} />
        <StatCard title="Próximas Turmas" value={upcoming} icon={ClipboardCheck} />
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Minhas Turmas</h2>
          <Link href="/instrutor/turmas">
            <Button variant="ghost" size="sm">Ver todas</Button>
          </Link>
        </div>

        {!classes || classes.length === 0 ? (
          <div className="py-8 text-center">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">Você não possui turmas atribuídas.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {classes.map((cls: any) => (
              <Link
                key={cls.id}
                href={`/instrutor/turmas/${cls.id}`}
                className="list-item-interactive block"
              >
                <div>
                  <p className="font-medium text-foreground">{cls.courses?.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {cls.name} ·{' '}
                    Início: {format(new Date(cls.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <ClassStatusBadge status={cls.status} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
