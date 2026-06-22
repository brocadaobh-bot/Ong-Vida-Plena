import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

function loginRedirect(
  request: NextRequest,
  origin: string,
  params: Record<string, string>,
) {
  const url = new URL('/login', origin)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const response = NextResponse.redirect(url.toString())
  copyRequestCookies(request, response)
  return response
}

function resolveNextPath(searchParams: URLSearchParams): string {
  const type = searchParams.get('type')
  const next = searchParams.get('next')

  if (next?.startsWith('/')) return next
  if (type === 'recovery') return '/redefinir-senha'
  return '/beneficiario'
}

function copyRequestCookies(request: NextRequest, response: NextResponse) {
  request.cookies.getAll().forEach(({ name, value }) => {
    response.cookies.set(name, value)
  })
}

function createCallbackSupabase(request: NextRequest, response: NextResponse) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )
}

function dashboardRedirect(origin: string, next: string, request: NextRequest) {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'

  const target =
    isLocalEnv || !forwardedHost
      ? `${origin}${next}`
      : `https://${forwardedHost}${next}`

  const response = NextResponse.redirect(target)
  copyRequestCookies(request, response)
  return response
}

export async function handleAuthCallback(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = resolveNextPath(searchParams)
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error || errorDescription) {
    const msg = errorDescription ?? error ?? 'Erro na confirmação do e-mail.'
    console.error('auth callback error params:', { error, errorDescription })
    return loginRedirect(request, origin, { error: msg })
  }

  // Fluxo PKCE: ?code=...
  if (code) {
    const response = dashboardRedirect(origin, next, request)
    const supabase = createCallbackSupabase(request, response)
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('exchangeCodeForSession error:', exchangeError)
      return loginRedirect(request, origin, {
        error:
          type === 'recovery'
            ? 'Link de recuperação expirado ou inválido. Solicite um novo e-mail.'
            : 'Link expirado ou inválido. Cadastre-se de novo ou solicite um novo e-mail de confirmação.',
      })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      return response
    }

    return loginRedirect(request, origin, {
      message: 'E-mail confirmado! Entre com sua senha.',
    })
  }

  // Fluxo alternativo: ?token_hash=...&type=recovery|signup|...
  if (tokenHash && type) {
    const response = dashboardRedirect(origin, next, request)
    const supabase = createCallbackSupabase(request, response)
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    })

    if (verifyError) {
      console.error('verifyOtp error:', verifyError)
      return loginRedirect(request, origin, {
        error:
          type === 'recovery'
            ? 'Link de recuperação expirado ou inválido. Solicite um novo e-mail.'
            : 'Link expirado ou inválido. Cadastre-se de novo ou solicite um novo e-mail de confirmação.',
      })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      return response
    }

    return loginRedirect(request, origin, {
      message: 'E-mail confirmado! Entre com sua senha.',
    })
  }

  // Tokens no hash (#access_token=...) são tratados no cliente em /redefinir-senha
  if (type === 'recovery') {
    return dashboardRedirect(origin, '/redefinir-senha', request)
  }

  return loginRedirect(request, origin, {
    error: 'Link de confirmação inválido. Use o link mais recente ou cadastre-se novamente.',
  })
}
