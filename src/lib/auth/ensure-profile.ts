import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type ServiceClient = SupabaseClient<Database>

/**
 * Garante profile + beneficiary_profile após signup.
 * Usa RPC SECURITY DEFINER (ensure_user_profile) — funciona mesmo com grants restritos.
 */
export async function ensureUserProfile(
  serviceSupabase: ServiceClient,
  params: {
    userId: string
    email: string
    fullName: string
    role?: Database['public']['Enums']['user_role']
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const role = params.role ?? 'beneficiary'

  const { data: existing } = await serviceSupabase
    .from('profiles')
    .select('id')
    .eq('id', params.userId)
    .maybeSingle()

  if (existing) return { ok: true }

  // RPC roda como postgres (SECURITY DEFINER) — evita "permission denied for schema public"
  const { error: rpcError } = await serviceSupabase.rpc('ensure_user_profile', {
    p_user_id:   params.userId,
    p_email:     params.email,
    p_full_name: params.fullName,
    p_role:      role,
  })

  if (!rpcError) return { ok: true }

  // Fallback: insert direto (caso RPC ainda não exista no banco)
  const { error: insertError } = await serviceSupabase.from('profiles').insert({
    id:        params.userId,
    email:     params.email,
    full_name: params.fullName,
    role,
  })

  if (insertError) {
    return { ok: false, error: rpcError.message || insertError.message }
  }

  if (role === 'beneficiary') {
    await serviceSupabase
      .from('beneficiary_profiles')
      .insert({ profile_id: params.userId })
  }

  return { ok: true }
}
