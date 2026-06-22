import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getAuthUser } from '@/lib/auth/session'
import { requireAdminOrAssistant } from '@/lib/auth/permissions'
import {
  assertCanAccessLgpdRequest,
  getLgpdRequestById,
  getLgpdThreadForRequest,
} from '@/server/queries/lgpd-requests'
import { isLgpdRequestActive } from '@/lib/lgpd/status'
import { LgpdRequestThread } from '@/components/lgpd/LgpdRequestThread'
import { LgpdRequestActions } from '@/components/lgpd/LgpdRequestActions'
import { Card } from '@/components/ui/Card'
import { LgpdStatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  DATA_REQUEST_STATUS_LABELS,
  DATA_REQUEST_TYPE_LABELS,
} from '@/types/domain'
import type { DataRequestStatus, DataRequestType } from '@/types/database'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type LgpdRequestDetailViewProps = {
  requestId: string
  lgpdBasePath?: string
}

export async function LgpdRequestDetailView({
  requestId,
  lgpdBasePath = '/admin/lgpd',
}: LgpdRequestDetailViewProps) {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  requireAdminOrAssistant(user.role)

  const request = await getLgpdRequestById(requestId)
  if (!request) notFound()

  const canAccess = await assertCanAccessLgpdRequest(request)
  if (!canAccess) notFound()

  const messages = await getLgpdThreadForRequest(request)
  const requestedChanges = request.requested_changes as { full_name?: string } | null
  const editBeneficiaryHref = `/assistente/beneficiarios/${request.profile_id}`
  const isActive = isLgpdRequestActive(request.status)
  const userTicketsHref = `${lgpdBasePath}/usuario/${request.profile_id}`

  return (
    <div className="space-y-6">
      <div>
        <Link href={userTicketsHref}>
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} className="mb-2">
            Voltar aos tickets do titular
          </Button>
        </Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                {DATA_REQUEST_TYPE_LABELS[request.request_type as DataRequestType]}
              </h1>
              <LgpdStatusBadge status={request.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {request.profile?.full_name} · {request.profile?.email}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(request.requested_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              {' · '}
              {DATA_REQUEST_STATUS_LABELS[request.status as DataRequestStatus]}
            </p>
          </div>
          <LgpdRequestActions
            requestId={requestId}
            currentStatus={request.status}
            requestType={request.request_type}
            requestedName={requestedChanges?.full_name ?? null}
          />
        </div>
      </div>

      {request.request_type === 'correction' && isActive && (
        <Card className="border-primary-200 bg-primary-50/50 p-5 dark:border-primary-900/40 dark:bg-primary-950/20">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Passo a passo (correção de nome)</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            <li>Confira RG e nome na <strong className="text-foreground">conversa</strong> abaixo.</li>
            <li>
              Corrija o cadastro em{' '}
              <Link href={editBeneficiaryHref} className="font-medium text-primary-600 underline underline-offset-2 dark:text-primary-400">
                Editar usuário
              </Link>{' '}
              (atualiza certificados automaticamente).
            </li>
            <li>
              Clique em <strong className="text-foreground">Concluir solicitação</strong> para encerrar o ticket e avisar o titular.
            </li>
          </ol>
        </Card>
      )}

      {request.request_type === 'correction' && !isActive && (
        <Card className="border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <p className="text-sm text-foreground">
            Esta solicitação foi encerrada. O titular vê o status{' '}
            <strong>{DATA_REQUEST_STATUS_LABELS[request.status as DataRequestStatus]}</strong> em Meus Dados (LGPD).
          </p>
        </Card>
      )}

      {!isActive && request.request_type !== 'correction' && (
        <Card className="border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <p className="text-sm text-foreground">
            Solicitação encerrada — status:{' '}
            <strong>{DATA_REQUEST_STATUS_LABELS[request.status as DataRequestStatus]}</strong>.
          </p>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-base font-semibold text-foreground">Conversa com o titular</h2>
        <LgpdRequestThread
          requestId={requestId}
          ticketOwnerId={request.profile_id}
          messages={messages}
          currentUserId={user.id}
          canReply={isActive}
          legacyResponseNotes={request.response_notes}
        />
      </div>
    </div>
  )
}
