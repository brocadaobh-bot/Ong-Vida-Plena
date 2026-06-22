import type { AuthError } from '@supabase/supabase-js'

const RATE_LIMIT_MESSAGE =
  'Limite de e-mails do Supabase atingido. Aguarde cerca de 1 hora, confirme manualmente no Dashboard (Authentication → Users) ou desative "Confirm email" em dev.'

export function formatAuthError(error: AuthError): string {
  const message = error.message?.trim()
  const code = 'code' in error ? (error.code as string | undefined) : undefined

  if (
    code === 'over_email_send_rate_limit' ||
    message?.toLowerCase().includes('rate limit')
  ) {
    return RATE_LIMIT_MESSAGE
  }

  const secondsMatch = message?.match(/after (\d+) seconds?/i)
  if (secondsMatch) {
    return `Aguarde ${secondsMatch[1]} segundos antes de solicitar outro e-mail.`
  }

  if (message && message !== '{}') {
    return message
  }

  const status = 'status' in error ? (error.status as number | undefined) : undefined

  if (code === 'user_already_exists' || code === 'email_exists') {
    return 'Este e-mail já está cadastrado.'
  }

  if (status === 429) {
    return RATE_LIMIT_MESSAGE
  }

  if (status === 500) {
    return (
      'Erro interno ao criar a conta no Supabase. ' +
      'Execute supabase/migrations/010_auth_fix.sql no SQL Editor (ou 000_reset + 001–010 se o banco estiver inconsistente).'
    )
  }

  if (status === 422) {
    return 'URL de redirecionamento inválida. Confira NEXT_PUBLIC_APP_URL e as Redirect URLs no Supabase.'
  }

  if (status === 401 || status === 403) {
    return 'Chave de API do Supabase inválida. Verifique NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local.'
  }

  return status
    ? `Erro ao criar conta (HTTP ${status}). Tente novamente.`
    : 'Erro ao criar conta. Tente novamente.'
}

export { RATE_LIMIT_MESSAGE }