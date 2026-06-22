import type { LgpdRequestMessage } from '@/types/domain'
import type { UserRole } from '@/types/database'
import { ROLE_LABELS } from '@/types/domain'

export function isLgpdStaffRole(role?: UserRole | string): boolean {
  return role === 'admin' || role === 'assistant'
}

export function getLgpdSenderLabel(
  message: LgpdRequestMessage,
  ticketOwnerId: string,
): string {
  const role = message.profiles?.role
  const name = message.profiles?.full_name?.trim()

  if (message.sender_id === ticketOwnerId) {
    return name || 'Você'
  }

  if (isLgpdStaffRole(role)) {
    return name ? `${name} · ${ROLE_LABELS[role as UserRole]}` : 'Equipe ONG Vida Plena'
  }

  return name || 'Equipe ONG Vida Plena'
}
