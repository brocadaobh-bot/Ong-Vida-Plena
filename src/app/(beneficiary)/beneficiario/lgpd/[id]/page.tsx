import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getAuthUser } from '@/lib/auth/session'
import {
  assertCanAccessLgpdRequest,
  getLgpdRequestById,
  getLgpdThreadForRequest,
} from '@/server/queries/lgpd-requests'
import { isLgpdRequestActive } from '@/lib/lgpd/status'
import { LgpdRequestThread } from '@/components/lgpd/LgpdRequestThread'
import { LgpdMarkReadOnMount } from '@/components/lgpd/LgpdMarkReadOnMount'
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

type BeneficiaryLgpdDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function BeneficiaryLgpdDetailPage({ params }: BeneficiaryLgpdDetailPageProps) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const request = await getLgpdRequestById(id)
  if (!request) notFound()

  const canAccess = await assertCanAccessLgpdRequest(request)
  if (!canAccess) notFound()

  const messages = await getLgpdThreadForRequest(request)

  return (
    <div className="space-y-6">
      <LgpdMarkReadOnMount requestId={id} />
      <div>
        <Link href="/beneficiario/lgpd">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} className="mb-2">
            Voltar
          </Button>
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">
            {DATA_REQUEST_TYPE_LABELS[request.request_type as DataRequestType]}
          </h1>
          <LgpdStatusBadge status={request.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Aberta em {format(new Date(request.requested_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          {' · '}
          {DATA_REQUEST_STATUS_LABELS[request.status as DataRequestStatus]}
        </p>
      </div>

      {request.status === 'waiting_user' && (
        <Card className="border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <p className="text-sm leading-relaxed text-foreground">
            A equipe precisa de mais informações. Responda abaixo e, se solicitado, envie foto do RG.
          </p>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-base font-semibold text-foreground">Conversa</h2>
        <LgpdRequestThread
          requestId={id}
          ticketOwnerId={request.profile_id}
          messages={messages}
          currentUserId={user.id}
          canReply={isLgpdRequestActive(request.status)}
          legacyResponseNotes={request.response_notes}
        />
      </div>
    </div>
  )
}
