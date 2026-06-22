import { cache } from 'react'
import { createClient as createAuthClient } from '@/lib/supabase/server'
import type { AuthUser } from '@/types/domain'
import type { UserRole } from '@/types/database'

// Retorna o usuário autenticado com perfil completo (deduplicado por request)
export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createAuthClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, role, full_name, status, avatar_url')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  let has_accepted_current_policy = true
  if (profile.role === 'beneficiary') {
    const { data: policyAccepted } = await supabase.rpc(
      'user_has_accepted_current_policy',
      { p_user_id: user.id },
    )
    has_accepted_current_policy = policyAccepted ?? true
  }

  return {
    id:                          user.id,
    email:                       user.email ?? profile.email,
    role:                        profile.role,
    full_name:                   profile.full_name,
    status:                      profile.status,
    avatar_url:                  profile.avatar_url,
    has_accepted_current_policy,
  }
})

// Retorna apenas o usuário autenticado (sem perfil)
export async function getUser() {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Retorna a URL de redirecionamento baseada no papel do usuário
export function getDashboardUrl(role: UserRole): string {
  switch (role) {
    case 'admin':       return '/admin'
    case 'assistant':   return '/assistente'
    case 'instructor':  return '/instrutor'
    case 'beneficiary': return '/beneficiario'
    default:            return '/beneficiario'
  }
}
