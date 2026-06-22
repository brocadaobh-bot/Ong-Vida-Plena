import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getAuthUser } from '@/lib/auth/session'
import { requireAdminOrAssistant } from '@/lib/auth/permissions'
import { getLgpdRequestsByProfileId } from '@/server/queries/lgpd-requests'
import { isLgpdRequestActive } from '@/lib/lgpd/status'
import { LgpdRequestListItem } from '@/components/lgpd/LgpdRequestListItem'
import { LgpdRequestActions } from '@/components/lgpd/LgpdRequestActions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

type LgpdUserTicketsViewProps = {
  profileId: string
  backHref?: string
  detailBasePath?: string
}

export async function LgpdUserTicketsView({
  profileId,
  backHref = '/admin/lgpd',
  detailBasePath = '/admin/lgpd',
}: LgpdUserTicketsViewProps) {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  requireAdminOrAssistant(user.role)

  const requests = await getLgpdRequestsByProfileId(profileId)
  if (requests.length === 0) notFound()

  const profile = requests[0].profile
  const active = requests.filter(r => isLgpdRequestActive(r.status))
  const closed = requests.filter(r => !isLgpdRequestActive(r.status))

  function renderTickets(items: typeof requests) {
    return (
      <div className="space-y-3">
        {items.map(request => {
          const requestedChanges = request.requested_changes as { full_name?: string } | null
          return (
            <div key={request.id} className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
              <LgpdRequestListItem
                request={request}
                detailHref={`${detailBasePath}/${request.id}`}
              />
              {isLgpdRequestActive(request.status) && (
                <div className="flex justify-end border-t border-border pt-3">
                  <LgpdRequestActions
                    requestId={request.id}
                    currentStatus={request.status}
                    requestType={request.request_type}
                    requestedName={requestedChanges?.full_name ?? null}
                    compact
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={backHref}>
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} className="mb-2">
            Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{profile?.full_name}</h1>
        <p className="text-sm text-muted-foreground">{profile?.email}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {requests.length} solicitação{requests.length !== 1 ? 'ões' : ''} LGPD deste titular
        </p>
      </div>

      <Card className="p-4">
        <p className="text-sm text-muted-foreground">
          Cadastro:{' '}
          <Link
            href={`/assistente/beneficiarios/${profileId}`}
            className="font-medium text-primary-600 underline underline-offset-2 dark:text-primary-400"
          >
            Editar usuário
          </Link>
        </p>
      </Card>

      {active.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            Em andamento ({active.length})
          </h2>
          {renderTickets(active)}
        </Card>
      )}

      {closed.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            Concluídas / Encerradas ({closed.length})
          </h2>
          {renderTickets(closed)}
        </Card>
      )}
    </div>
  )
}
