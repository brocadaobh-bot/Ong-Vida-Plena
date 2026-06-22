import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'
import {
  REMEMBER_LOGIN_COOKIE,
  REMEMBER_LOGIN_MAX_AGE_SEC,
  isRememberLoginCookie,
} from '@/lib/auth/remember-login'

// Atualiza a sessão do usuário nos cookies a cada request
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const hasAuthCookies = request.cookies.getAll().some(
    cookie => cookie.name.includes('-auth-token') || cookie.name.includes('-refresh-token'),
  )

  if (!hasAuthCookies) {
    return { supabaseResponse, user: null, supabase: null }
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          const persistLogin = isRememberLoginCookie(
            request.cookies.get(REMEMBER_LOGIN_COOKIE)?.value,
          )
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              ...(persistLogin ? { maxAge: REMEMBER_LOGIN_MAX_AGE_SEC } : {}),
            })
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabaseResponse, user, supabase }
}
