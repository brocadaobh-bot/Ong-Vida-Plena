import { cache } from 'react'
import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import { fetchWithRetry } from '@/lib/supabase/fetch-with-retry'
import {
  REMEMBER_LOGIN_COOKIE,
  REMEMBER_LOGIN_MAX_AGE_SEC,
  isRememberLoginCookie,
} from '@/lib/auth/remember-login'

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      'Configuração incompleta: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local',
    )
  }
  return { url, anonKey }
}

// Cliente para uso em Server Components, Server Actions e Route Handlers
export const createClient = cache(async () => createAuthClient())

/** Cliente de auth com opção de sessão persistente (login "Manter conectado"). */
export async function createAuthClient(options?: { persistLogin?: boolean }) {
  const cookieStore = await cookies()
  const { url, anonKey } = getSupabaseEnv()
  const persistLogin =
    options?.persistLogin ??
    isRememberLoginCookie(cookieStore.get(REMEMBER_LOGIN_COOKIE)?.value)

  return createServerClient<Database>(url, anonKey, {
    global: { fetch: fetchWithRetry },
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options: cookieOptions }) => {
            cookieStore.set(name, value, {
              ...cookieOptions,
              ...(persistLogin ? { maxAge: REMEMBER_LOGIN_MAX_AGE_SEC } : {}),
            })
          })
        } catch {
          // Em Server Components, set de cookie pode ser ignorado com segurança
        }
      },
    },
  })
}

// Cliente com service role — apenas server-side, sem cookies/sessão
export function createServiceClient() {
  const { url } = getSupabaseEnv()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error('Configuração incompleta: defina SUPABASE_SERVICE_ROLE_KEY em .env.local')
  }

  return createSupabaseClient<Database>(url, serviceKey, {
    global: { fetch: fetchWithRetry },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
