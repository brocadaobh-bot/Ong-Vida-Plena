import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageSquareText } from 'lucide-react'
import { LgpdStatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  DATA_REQUEST_STATUS_LABELS,
  DATA_REQUEST_TYPE_LABELS,
} from '@/types/domain'
import type { DataSubjectRequest } from '@/types/domain'
import type { DataRequestStatus, DataRequestType } from '@/types/database'

type LgpdRequestListItemProps = {
  request: DataSubjectRequest
  detailHref: string
  showProfile?: boolean
}

export function LgpdRequestListItem({
  request,
  detailHref,
  showProfile = false,
}: LgpdRequestListItemProps) {
  const requestedChanges = request.requested_changes as { full_name?: string } | null

  return (
    <div className="inset-box flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-foreground">
            {DATA_REQUEST_TYPE_LABELS[request.request_type as DataRequestType]}
          </p>
          <LgpdStatusBadge status={request.status} />
          {request.has_unread_reply && (
            <span className="inline-flex items-center rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              Nova resposta
            </span>
          )}
        </div>
        {showProfile && request.profile && (
          <p className="mt-0.5 text-sm text-muted-foreground">
            {request.profile.full_name} · {request.profile.email}
          </p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground">
          {format(new Date(request.requested_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          {' · '}
          {DATA_REQUEST_STATUS_LABELS[request.status as DataRequestStatus]}
        </p>
        {request.description && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{request.description}</p>
        )}
        {requestedChanges?.full_name && (
          <p className="mt-1 text-sm text-foreground">
            Nome solicitado: <strong>{requestedChanges.full_name}</strong>
          </p>
        )}
      </div>
      <Link href={detailHref} className="shrink-0">
        <Button
          size="sm"
          variant={request.has_unread_reply ? 'primary' : 'secondary'}
          leftIcon={<MessageSquareText className="h-4 w-4" />}
        >
          {request.has_unread_reply ? 'Ver resposta' : 'Abrir conversa'}
        </Button>
      </Link>
    </div>
  )
}
