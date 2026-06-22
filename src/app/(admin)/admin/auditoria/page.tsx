import { getAuditLogs } from '@/server/queries/reports'
import { Card } from '@/components/ui/Card'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

const ACTION_LABELS: Record<string, string> = {
  'auth.login':              'Login',
  'auth.logout':             'Logout',
  'profile.updated':         'Perfil atualizado',
  'profile.role_changed':    'Papel alterado',
  'profile.status_changed':  'Status alterado',
  'beneficiary.created':     'Usuário criado',
  'beneficiary.updated':     'Usuário editado',
  'beneficiary.deleted':     'Usuário anonimizado',
  'enrollment.created':      'Inscrição criada',
  'enrollment.status_changed':'Status de inscrição alterado',
  'enrollment.cancelled':    'Inscrição cancelada',
  'attendance.recorded':     'Presença registrada',
  'attendance.updated':      'Presença atualizada',
  'course.created':          'Curso criado',
  'course.updated':          'Curso atualizado',
  'class.created':           'Turma criada',
  'class.updated':           'Turma atualizada',
  'class.info_updated':      'Info da turma atualizada',
  'consent.granted':         'Consentimento concedido',
  'consent.revoked':         'Consentimento revogado',
  'lgpd_request.created':    'Solicitação LGPD criada',
  'lgpd_request.status_changed': 'Solicitação LGPD atualizada',
  'data_export.created':     'Exportação de dados gerada',
  'settings.updated':        'Configurações alteradas',
}

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string }>
}) {
  const sp = await searchParams
  const page   = parseInt(sp.page ?? '1')
  const limit  = 50
  const offset = (page - 1) * limit

  const { data: logs, count } = await getAuditLogs({ limit, offset }).catch(() => ({ data: [], count: 0 }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Logs de Auditoria</h1>
        <p className="text-muted-foreground">
          Registro imutável de todas as ações sensíveis na plataforma.
          Total: {count} registros.
        </p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                {['Data/Hora', 'Ação', 'Executor', 'Entidade', 'ID da Entidade'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    Nenhum log de auditoria.
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log.id}>
                    <td className="text-xs whitespace-nowrap">
                      {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                    </td>
                    <td>
                      <span className="code-tag">
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="text-foreground">
                      {(log.profiles as any)?.full_name ?? log.actor_id?.slice(0, 8) ?? 'Sistema'}
                    </td>
                    <td>{log.entity_type ?? '—'}</td>
                    <td className="text-xs font-mono opacity-70">
                      {log.entity_id?.slice(0, 8) ?? '—'}...
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {count > limit && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Página {page} de {Math.ceil(count / limit)}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`?page=${page - 1}`} className="pagination-link">
                Anterior
              </Link>
            )}
            {page < Math.ceil(count / limit) && (
              <Link href={`?page=${page + 1}`} className="pagination-link">
                Próximo
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
