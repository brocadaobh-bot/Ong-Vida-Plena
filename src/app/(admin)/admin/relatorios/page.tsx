import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { EnrollmentStatusBadge, ClassStatusBadge } from '@/components/ui/Badge'
import { BarChart3 } from 'lucide-react'

export default async function RelatoriosAdminPage() {
  const supabase = await createClient()

  const [
    { data: enrollmentsByStatus },
    { data: classesByStatus },
    { data: beneficiariesByMonth },
  ] = await Promise.all([
    supabase
      .from('enrollments')
      .select('status')
      .then(r => ({
        data: r.data?.reduce((acc: Record<string, number>, e) => {
          acc[e.status] = (acc[e.status] ?? 0) + 1
          return acc
        }, {}),
      })),
    supabase
      .from('classes')
      .select('status')
      .then(r => ({
        data: r.data?.reduce((acc: Record<string, number>, c) => {
          acc[c.status] = (acc[c.status] ?? 0) + 1
          return acc
        }, {}),
      })),
    supabase
      .from('profiles')
      .select('created_at')
      .eq('role', 'beneficiary')
      .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
        <p className="text-muted-foreground">Visão consolidada de métricas e indicadores.</p>
      </div>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-foreground">Inscrições por Status</h2>
        {enrollmentsByStatus ? (
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Object.entries(enrollmentsByStatus).map(([status, count]) => (
              <div key={status} className="stat-box">
                <div className="mb-1 flex justify-center">
                  <EnrollmentStatusBadge status={status as any} />
                </div>
                <p className="stat-value">{count as number}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Sem dados.</p>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-foreground">Turmas por Status</h2>
        {classesByStatus ? (
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Object.entries(classesByStatus).map(([status, count]) => (
              <div key={status} className="stat-box">
                <div className="mb-1 flex justify-center">
                  <ClassStatusBadge status={status as any} />
                </div>
                <p className="stat-value">{count as number}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Sem dados.</p>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-foreground">
          Novos Usuários — Últimos 6 meses
        </h2>
        <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
          {beneficiariesByMonth?.length ?? 0}
        </p>
        <p className="text-sm text-muted-foreground">
          usuários cadastrados nos últimos 180 dias
        </p>
      </Card>

      <Card>
        <div className="py-6 text-center text-muted-foreground/80">
          <BarChart3 className="mx-auto mb-3 h-10 w-10" />
          <p className="text-sm">
            Relatórios avançados com gráficos e exportação em CSV serão adicionados na próxima versão.
          </p>
        </div>
      </Card>
    </div>
  )
}
