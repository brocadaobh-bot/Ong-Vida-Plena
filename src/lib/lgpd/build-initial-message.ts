import type { DataSubjectRequest } from '@/types/domain'

/** Texto da primeira mensagem do ticket (titular). */
export function buildInitialLgpdMessageBody(
  request: Pick<DataSubjectRequest, 'description' | 'requested_changes' | 'request_type'>,
): string | null {
  const parts: string[] = []
  const requestedChanges = request.requested_changes as { full_name?: string } | null

  if (request.request_type === 'correction' && requestedChanges?.full_name?.trim()) {
    parts.push(`Nome completo solicitado: ${requestedChanges.full_name.trim()}`)
  }

  const description = request.description?.trim()
  if (description) parts.push(description)

  return parts.length > 0 ? parts.join('\n\n') : null
}
