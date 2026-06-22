/** URL pública do app (fallback para dev na porta 3001). */
export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'
}

/** URL de retorno após clicar no link de recuperação de senha no e-mail. */
export function getPasswordRecoveryRedirectUrl(): string {
  return `${getAppUrl()}/auth/confirm`
}
