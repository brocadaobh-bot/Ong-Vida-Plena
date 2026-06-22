import { createClient } from '@/lib/supabase/server'
import { DASHBOARD_ACTIVE_ENROLLMENT_STATUSES } from '@/lib/enrollments/enrollment-status'
import { Card, StatCard } from '@/components/ui/Card'
import { Users, ClipboardList, BookOpen } from 'lucide-react'

export default async function RelatoriosAssistantPage() {
  const supabase = await createClient()

  const [
    { count: totalBeneficiaries },
    { count: totalEnrollments },
    { count: confirmedEnrollments },
    { count: openClasses },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'beneficiary').eq('status', 'active'),
    supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .in('status', DASHBOARD_ACTIVE_ENROLLMENT_STATUSES),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabase.from('classes').select('*', { count: 'exact', head: true }).eq('status', 'open'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
        <p className="text-muted-foreground">Resumo operacional.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Usuários Ativos"   value={totalBeneficiaries  ?? 0} icon={Users} />
        <StatCard title="Inscrições Ativas" value={totalEnrollments ?? 0} icon={ClipboardList} />
        <StatCard title="Inscrições Confirmadas" value={confirmedEnrollments ?? 0} icon={ClipboardList} />
        <StatCard title="Turmas Abertas"         value={openClasses         ?? 0} icon={BookOpen} />
      </div>

      <Card>
        <p className="py-6 text-center text-sm text-muted-foreground">
          Relatórios detalhados com filtros de data, curso e exportação serão disponibilizados em breve.
        </p>
      </Card>
    </div>
  )
}
