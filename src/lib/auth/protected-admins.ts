import 'server-only'

/**
 * E-mails de administradores protegidos — não podem ser rebaixados,
 * bloqueados ou ter papel alterado pelo painel.
 *
 * Configure em .env.local (separados por vírgula):
 * PROTECTED_ADMIN_EMAILS=seu@email.com,backup@email.com
 *
 * Só alterável no servidor (deploy), não pelo painel admin.
 */
export function getProtectedAdminEmails(): string[] {
  const raw = process.env.PROTECTED_ADMIN_EMAILS ?? ''
  return raw
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isProtectedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const protectedList = getProtectedAdminEmails()
  if (protectedList.length === 0) return false
  return protectedList.includes(email.trim().toLowerCase())
}
