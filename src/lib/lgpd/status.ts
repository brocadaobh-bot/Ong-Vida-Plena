export const ACTIVE_LGPD_STATUSES = ['open', 'in_review', 'waiting_user'] as const

export function isLgpdRequestActive(status: string): boolean {
  return (ACTIVE_LGPD_STATUSES as readonly string[]).includes(status)
}
