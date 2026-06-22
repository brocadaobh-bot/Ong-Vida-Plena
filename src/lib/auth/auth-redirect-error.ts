/** Lê erros de auth vindos do Supabase na query (?error=) ou no hash (#error=). */
export function readAuthRedirectError(): {
  error: string | null
  errorCode: string | null
  description: string | null
} {
  if (typeof window === 'undefined') {
    return { error: null, errorCode: null, description: null }
  }

  const fromQuery = new URLSearchParams(window.location.search)
  const fromHash = new URLSearchParams(window.location.hash.slice(1))

  const error = fromQuery.get('error') ?? fromHash.get('error')
  const errorCode = fromQuery.get('error_code') ?? fromHash.get('error_code')
  const description =
    fromQuery.get('error_description') ?? fromHash.get('error_description')

  return { error, errorCode, description }
}

export function messageForAuthRedirectError(
  errorCode: string | null,
  description: string | null,
): string {
  if (errorCode === 'otp_expired') {
    return 'Este link expirou ou já foi usado. Cada link funciona apenas uma vez. Solicite um novo e-mail e clique nele em até 1 hora.'
  }

  if (errorCode === 'access_denied') {
    return 'Link inválido ou expirado. Solicite um novo e-mail de recuperação e use apenas o link mais recente.'
  }

  if (description) {
    return decodeURIComponent(description.replace(/\+/g, ' '))
  }

  return 'Não foi possível validar o link. Solicite um novo e-mail de recuperação.'
}

export function cleanAuthErrorFromUrl() {
  if (typeof window === 'undefined') return
  window.history.replaceState(null, '', window.location.pathname)
}
