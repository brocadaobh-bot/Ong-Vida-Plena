import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import type { UserRole } from '@/types/database'

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/cadastro',
  '/recuperar-senha',
  '/redefinir-senha',
  '/politica-de-privacidade',
  '/verificar-certificado',
  '/auth/callback',
  '/auth/confirm',
]

const PROTECTED_PREFIXES: { prefix: string; roles: UserRole[] }[] = [
  { prefix: '/admin',      roles: ['admin'] },
  { prefix: '/assistente', roles: ['admin', 'assistant'] },
  { prefix: '/instrutor',  roles: ['admin', 'instructor'] },
  { prefix: '/beneficiario', roles: ['admin', 'assistant', 'instructor', 'beneficiary'] },
]

function hasAuthCookies(request: NextRequest): boolean {
  return request.cookies.getAll().some(
    cookie => cookie.name.includes('-auth-token') || cookie.name.includes('-refresh-token'),
  )
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (route === '/') return pathname === '/'
    return pathname === route || pathname.startsWith(`${route}/`)
  })
}

function getAllowedRoles(pathname: string): UserRole[] | null {
  const match = PROTECTED_PREFIXES.find(p => pathname.startsWith(p.prefix))
  return match?.roles ?? null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  if (pathname === '/redefinir-senha' || pathname === '/auth/callback') {
    const code = request.nextUrl.searchParams.get('code')
    const tokenHash = request.nextUrl.searchParams.get('token_hash')
    const type = request.nextUrl.searchParams.get('type')
    const isRecovery =
      type === 'recovery' ||
      pathname === '/redefinir-senha' ||
      request.nextUrl.searchParams.get('next')?.includes('redefinir-senha')

    if (isRecovery && (code || (tokenHash && type))) {
      const confirm = new URL('/auth/confirm', request.url)
      if (code) confirm.searchParams.set('code', code)
      if (tokenHash) confirm.searchParams.set('token_hash', tokenHash)
      if (type) confirm.searchParams.set('type', type)
      confirm.searchParams.set('next', '/redefinir-senha')
      return NextResponse.redirect(confirm)
    }
  }

  const isPublic = isPublicRoute(pathname)
  const needsLoggedInRedirect = pathname === '/login' || pathname === '/cadastro'

  // Rotas públicas: pula Supabase (exceto login/cadastro com sessão ativa)
  if (isPublic && (!needsLoggedInRedirect || !hasAuthCookies(request))) {
    return NextResponse.next()
  }

  const { supabaseResponse, user, supabase } = await updateSession(request)

  if (isPublic) {
    if (user && supabase && needsLoggedInRedirect) {
      return redirectToDashboard(request, supabase, user.id)
    }
    return supabaseResponse
  }

  if (!user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  const { data: profile } = await supabase!
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (profile.status === 'blocked') {
    const url = new URL('/login', request.url)
    url.searchParams.set('error', 'blocked')
    return NextResponse.redirect(url)
  }

  const allowedRoles = getAllowedRoles(pathname)
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return redirectByRole(request, profile.role)
  }

  return supabaseResponse
}

async function redirectToDashboard(
  request: NextRequest,
  supabase: NonNullable<Awaited<ReturnType<typeof updateSession>>['supabase']>,
  userId: string,
) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  return redirectByRole(request, profile?.role ?? 'beneficiary')
}

function redirectByRole(request: NextRequest, role: UserRole) {
  const dashboardMap: Record<UserRole, string> = {
    admin:       '/admin',
    assistant:   '/assistente',
    instructor:  '/instrutor',
    beneficiary: '/beneficiario',
  }
  const url = new URL(dashboardMap[role] ?? '/beneficiario', request.url)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
