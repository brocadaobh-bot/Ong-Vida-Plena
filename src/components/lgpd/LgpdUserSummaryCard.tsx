import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronRight, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { LgpdUserSummary } from '@/types/domain'

type LgpdUserSummaryCardProps = {
  summary: LgpdUserSummary
  userHref: string
}

export function LgpdUserSummaryCard({ summary, userHref }: LgpdUserSummaryCardProps) {
  const ticketLabel =
    summary.total_count === 1
      ? '1 solicitação'
      : `${summary.total_count} solicitações`

  const activeLabel =
    summary.active_count === 0
      ? 'nenhuma em aberto'
      : summary.active_count === 1
        ? '1 em aberto'
        : `${summary.active_count} em aberto`

  return (
    <div className="inset-box flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-950/40">
          <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{summary.profile.full_name}</p>
            {summary.active_count > 0 && (
              <Badge variant="warning" dot>
                {activeLabel}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{summary.profile.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {ticketLabel} · Última em{' '}
            {format(new Date(summary.latest_requested_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>
      <Link href={userHref} className="shrink-0">
        <Button size="sm" variant="secondary" rightIcon={<ChevronRight className="h-4 w-4" />}>
          Ver tickets
        </Button>
      </Link>
    </div>
  )
}
