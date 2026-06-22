import Link from 'next/link'
import { getAuthUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { DASHBOARD_ACTIVE_ENROLLMENT_STATUSES } from '@/lib/enrollments/enrollment-status'
import { Card, StatCard } from '@/components/ui/Card'
import { Users, ClipboardList, BookOpen, Calendar } from 'lucide-react'

export default async function AssistantDashboard() {
  const user     = await getAuthUser()
  const supabase = await createClient()

  const [
    { count: totalBeneficiaries },
    { count: activeEnrollments },
    { count: pendingEnrollments },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'beneficiary'),
    supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .in('status', DASHBOARD_ACTIVE_ENROLLMENT_STATUSES),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }).in('status', ['pending', 'waitlisted']),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Olá, {user!.full_name.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground">Painel operacional da ONG Vida Plena.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Usuários"
          value={totalBeneficiaries ?? 0}
          icon={Users}
          href="/assistente/beneficiarios"
        />
        <StatCard
          title="Inscrições Ativas"
          value={activeEnrollments ?? 0}
          icon={ClipboardList}
          href="/assistente/inscricoes?view=class"
        />
        <StatCard
          title="Aguardando Confirmação"
          value={pendingEnrollments ?? 0}
          icon={BookOpen}
          href="/assistente/inscricoes?status=pending&view=person"
        />
      </div>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-foreground">Ações Rápidas</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/assistente/beneficiarios/novo">
            <div className="quick-action-primary">
              <Users className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              <div>
                <p className="quick-action-title">Cadastrar Usuário</p>
                <p className="quick-action-desc">Adicionar novo usuário</p>
              </div>
            </div>
          </Link>
          <Link href="/assistente/inscricoes?view=class">
            <div className="quick-action-secondary">
              <ClipboardList className="h-6 w-6 text-muted-foreground" />
              <div>
                <p className="quick-action-title">Gerenciar Inscrições</p>
                <p className="quick-action-desc">Confirmar, cancelar ou realizar inscrições</p>
              </div>
            </div>
          </Link>
          <Link href="/assistente/turmas">
            <div className="quick-action-secondary">
              <Calendar className="h-6 w-6 text-muted-foreground" />
              <div>
                <p className="quick-action-title">Atribuir Instrutor</p>
                <p className="quick-action-desc">Escalar instrutor nas turmas</p>
              </div>
            </div>
          </Link>
        </div>
      </Card>
    </div>
  )
}
