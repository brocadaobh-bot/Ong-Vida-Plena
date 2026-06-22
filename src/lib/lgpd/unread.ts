import type { DataSubjectRequest } from '@/types/domain'

type LgpdReadCursor = Pick<
  DataSubjectRequest,
  'profile_id' | 'titular_last_read_at' | 'requested_at'
>

type LatestMessage = {
  sender_id: string
  created_at: string
}

/** Última mensagem da equipe ainda não lida pelo titular. */
export function hasUnreadStaffReply(
  request: LgpdReadCursor,
  latestMessage: LatestMessage | null,
): boolean {
  if (!latestMessage) return false
  if (latestMessage.sender_id === request.profile_id) return false

  const lastReadAt = request.titular_last_read_at ?? request.requested_at
  return new Date(latestMessage.created_at).getTime() > new Date(lastReadAt).getTime()
}
