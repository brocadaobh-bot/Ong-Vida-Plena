import type { AuthUser } from '@/types/domain'

export function canAccessInstructorClass(
  user: AuthUser | null,
  instructorId: string | null,
): boolean {
  if (!user) return false
  if (user.role === 'admin') return true
  return user.role === 'instructor' && instructorId === user.id
}
