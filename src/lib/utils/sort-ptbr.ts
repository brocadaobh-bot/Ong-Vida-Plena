import type { UserRole } from '@/types/database'
import { ROLE_ACCESS_RANK, STAFF_ROLES } from '@/types/domain'

/** Ordenação alfabética A→Z (português Brasil), ignorando acentos e maiúsculas. */
export function compareAlphabeticalPtBr(a: string, b: string): number {
  return a.trim().localeCompare(b.trim(), 'pt-BR', {
    sensitivity: 'base',
    ignorePunctuation: true,
    numeric: true,
  })
}

export function sortAlphabeticalPtBr<T>(
  items: T[],
  getLabel: (item: T) => string,
): T[] {
  return [...items].sort((x, y) => compareAlphabeticalPtBr(getLabel(x), getLabel(y)))
}

/** Gestão de usuários: equipe por cargo (maior→menor), depois usuários A→Z. */
export function sortUsersForManagement<T extends { role: UserRole; full_name: string }>(
  users: T[],
): T[] {
  const staff = users.filter(u => STAFF_ROLES.includes(u.role))
  const regular = users.filter(u => !STAFF_ROLES.includes(u.role))

  const sortedStaff = [...staff].sort((a, b) => {
    const byRank = ROLE_ACCESS_RANK[b.role] - ROLE_ACCESS_RANK[a.role]
    if (byRank !== 0) return byRank
    return compareAlphabeticalPtBr(a.full_name, b.full_name)
  })

  const sortedRegular = sortAlphabeticalPtBr(regular, u => u.full_name)

  return [...sortedStaff, ...sortedRegular]
}
