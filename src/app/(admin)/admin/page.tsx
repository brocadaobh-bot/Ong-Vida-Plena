import { getAdminMetrics } from '@/server/queries/reports'
import { createClient } from '@/lib/supabase/server'
import { StatCard, Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { ClassStatusBadge, DataRequestStatusBadge } from '@/components/ui/Badge'
import { EmptyState, EmptyIcons } from '@/components/ui/EmptyState'
import { Alert } from '@/components/ui/Alert'
import {
  Users, BookOpen, ClipboardList, ShieldCheck,
  TrendingUp, Calendar, ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const QUICK_ACTIONS = [
  { href: '/admin/cursos/novo',   label: 'Novo Curso',           icon: BookOpen,      color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40' },
  { href: '/admin/turmas',        label: 'Gerenciar Turmas',     icon: Calendar,      color: 'text-teal-600   dark:text-teal-400   bg-teal-50   dark:bg-teal-950/40'   },
  { href: '/admin/inscricoes',    label: 'Inscrições',           icon: ClipboardList, color: 'text-green-600  dark:text-green-400  bg-green-50  dark:bg-green-950/40'  },
  { href: '/admin/beneficiarios', label: 'Usuários',        icon: Users,         color: 'text-blue-600   dark:text-blue-400   bg-blue-50   dark:bg-blue-950/40'   },
]

export default async function AdminDashboard() {
  const today = new Date()
  let loadError: string | null = null
  let metrics: Awaited<ReturnType<typeof getAdminMetrics>> | null = null
  let pendingEnrollments = 0
  let recentClasses: Awaited<ReturnType<typeof loadRecentClasses>> = []
  let pendingRequests: Awaited<ReturnType<typeof loadPendingRequests>> = []

  try {
    const supabase = await createClient()

    const [metricsResult, pendingEnrollmentsResult, classes, requests] = await Promise.all([
      getAdminMetrics().catch(() => null),
      supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'waitlisted']),
      loadRecentClasses(supabase),
      loadPendingRequests(supabase),
    ])

    metrics = metricsResult
    pendingEnrollments = pendingEnrollmentsResult.count ?? 0
    recentClasses = classes
    pendingRequests = requests

    if (pendingEnrollmentsResult.error) {
      loadError = 'Não foi possível carregar todas as métricas. Tente recarregar a página.'
    }
  } catch {
    loadError =
      'Falha temporária ao conectar com o banco de dados. Verifique sua internet e recarregue a página.'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            {format(today, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          <h1 className="text-xl font-bold text-foreground tracking-tight sm:text-2xl">
            Dashboard Administrativo
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visão geral da plataforma Vida Plena
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/relatorios">
            <Button variant="outline" size="sm" leftIcon={<TrendingUp className="h-4 w-4" />}>
              Relatórios
            </Button>
          </Link>
        </div>
      </div>

      {loadError && (
        <Alert variant="warning" message={loadError} />
      )}

      {metrics && (
        <section aria-label="Métricas principais">
          <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              title="Usuários Ativos"
              value={metrics.total_beneficiaries.toLocaleString('pt-BR')}
              icon={Users}
              description={`+${metrics.new_beneficiaries_30d} nos últimos 30 dias`}
              trend={{ value: metrics.new_beneficiaries_30d, label: 'este mês' }}
              iconColor="text-blue-600 dark:text-blue-400"
              href="/admin/beneficiarios"
            />
            <StatCard
              title="Cursos Publicados"
              value={metrics.total_courses}
              icon={BookOpen}
              iconColor="text-purple-600 dark:text-purple-400"
              href="/admin/cursos"
            />
            <StatCard
              title="Turmas em Andamento"
              value={metrics.total_classes}
              icon={Calendar}
              iconColor="text-green-600 dark:text-green-400"
              href="/admin/turmas"
            />
            <StatCard
              title="Inscrições Ativas"
              value={metrics.total_enrollments.toLocaleString('pt-BR')}
              icon={ClipboardList}
              iconColor="text-orange-600 dark:text-orange-400"
              href="/admin/inscricoes?view=class"
            />
            <StatCard
              title="Aguardando Confirmação"
              value={pendingEnrollments}
              icon={BookOpen}
              description="Inscrições pendentes"
              iconColor={pendingEnrollments > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}
              href="/admin/inscricoes?status=pending&view=person"
            />
            <StatCard
              title="Solicitações LGPD"
              value={metrics.pending_lgpd_requests}
              icon={ShieldCheck}
              description="Pendentes de análise"
              iconColor={metrics.pending_lgpd_requests > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}
              href="/admin/lgpd"
            />
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Turmas Ativas</CardTitle>
              <Link href="/admin/turmas">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                  Ver todas
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            {recentClasses.length === 0 ? (
              <EmptyState
                icon={EmptyIcons.classes}
                title="Nenhuma turma ativa"
                description="Quando houver turmas em andamento, elas aparecerão aqui."
                size="sm"
              />
            ) : (
              <ul role="list" className="divide-y divide-border -mx-1">
                {recentClasses.map((cls: any) => (
                  <li key={cls.id}>
                    <Link
                      href={`/admin/inscricoes?class_id=${cls.id}`}
                      className="flex items-center justify-between rounded-lg hover:bg-accent px-3 py-2.5 transition-colors duration-100 group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {(cls.courses as any)?.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {cls.name} · {format(new Date(cls.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                      <ClassStatusBadge status={cls.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Solicitações LGPD Pendentes</CardTitle>
              <Link href="/admin/lgpd">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                  Ver todas
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            {pendingRequests.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                variant="default"
                title="Nenhuma solicitação pendente"
                description="Todas as solicitações LGPD foram processadas."
                size="sm"
              />
            ) : (
              <ul role="list" className="divide-y divide-border -mx-1">
                {pendingRequests.map((req) => (
                  <li key={req.id}>
                    <Link
                      href={`/admin/lgpd/${req.id}`}
                      className="flex items-center justify-between rounded-lg hover:bg-accent px-3 py-2.5 transition-colors duration-100 group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {req.profiles?.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {req.request_type} · {format(new Date(req.requested_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                      <DataRequestStatusBadge status={req.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="quick-actions-heading">
        <Card className="p-0">
          <CardHeader>
            <CardTitle id="quick-actions-heading">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {QUICK_ACTIONS.map(({ href, label, icon: Icon, color }) => (
                <Link key={href} href={href}>
                  <div
                    className="group flex items-center gap-3 rounded-xl border border-border p-4
                               hover:border-primary-200 dark:hover:border-primary-800/50
                               hover:bg-primary-50/50 dark:hover:bg-primary-950/20
                               transition-all duration-150 cursor-pointer"
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color} group-hover:scale-110 transition-transform duration-150`}>
                      <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{label}</span>
                    <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-150" aria-hidden="true" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

async function loadRecentClasses(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from('classes')
    .select('id, name, status, start_date, courses(title)')
    .in('status', ['open', 'in_progress'])
    .order('start_date')
    .limit(5)
  return data ?? []
}

async function loadPendingRequests(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from('data_subject_requests')
    .select('id, request_type, status, requested_at, profiles!profile_id(full_name)')
    .in('status', ['open', 'in_review'])
    .order('requested_at')
    .limit(5)
  return data ?? []
}
