import { getLgpdUsersWithRequests } from '@/server/queries/lgpd-requests'
import { Card } from '@/components/ui/Card'
import { LgpdUserSummaryCard } from '@/components/lgpd/LgpdUserSummaryCard'
import { ShieldCheck } from 'lucide-react'

type LgpdAdminListProps = {
  detailBasePath?: string
}

export async function LgpdAdminList({ detailBasePath = '/admin/lgpd' }: LgpdAdminListProps) {
  const users = await getLgpdUsersWithRequests()

  const withPending = users.filter(u => u.active_count > 0)
  const allClosed   = users.filter(u => u.active_count === 0)

  function renderUsers(items: typeof users) {
    return (
      <div className="space-y-3">
        {items.map(summary => (
          <LgpdUserSummaryCard
            key={summary.profile_id}
            summary={summary}
            userHref={`${detailBasePath}/usuario/${summary.profile_id}`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Solicitações LGPD</h1>
        <p className="text-muted-foreground">
          Um titular por linha. Clique em <strong className="text-foreground">Ver tickets</strong> para
          abrir todas as solicitações daquele usuário.
        </p>
      </div>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-foreground">
          Titulares com pendência ({withPending.length})
        </h2>
        {withPending.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum titular com solicitação em aberto.
          </p>
        ) : (
          renderUsers(withPending)
        )}
      </Card>

      {allClosed.length > 0 && (
        <Card>
          <h2 className="mb-4 text-base font-semibold text-foreground">
            Titulares sem pendência ({allClosed.length})
          </h2>
          {renderUsers(allClosed)}
        </Card>
      )}

      {users.length === 0 && (
        <Card>
          <div className="py-12 text-center">
            <ShieldCheck className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhuma solicitação registrada.</p>
          </div>
        </Card>
      )}
    </div>
  )
}
