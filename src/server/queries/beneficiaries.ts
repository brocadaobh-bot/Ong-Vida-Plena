import { createClient } from '@/lib/supabase/server'
import type { UserStatus } from '@/types/database'
import type { BeneficiaryFull, Profile } from '@/types/domain'

export async function getBeneficiaries(options?: {
  search?: string
  status?: string
  limit?: number
  offset?: number
}): Promise<{ data: Profile[]; count: number }> {
  const supabase = await createClient()
  const limit  = options?.limit  ?? 20
  const offset = options?.offset ?? 0

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .eq('role', 'beneficiary')
    .order('full_name')
    .range(offset, offset + limit - 1)

  if (options?.status) {
    query = query.eq('status', options.status as UserStatus)
  }

  if (options?.search) {
    query = query.or(
      `full_name.ilike.%${options.search}%,email.ilike.%${options.search}%`
    )
  }

  const { data, count, error } = await query
  if (error) throw error

  return { data: (data ?? []) as Profile[], count: count ?? 0 }
}

export async function getBeneficiaryById(id: string): Promise<BeneficiaryFull | null> {
  const supabase = await createClient()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('role', 'beneficiary')
    .single()

  if (profileError || !profile) return null

  const { data: bp } = await supabase
    .from('beneficiary_profiles')
    .select('*, addresses(*)')
    .eq('profile_id', id)
    .single()

  return {
    ...profile,
    beneficiary_profile: bp
      ? {
          ...bp,
          address: bp.addresses ?? null,
        }
      : null,
  } as BeneficiaryFull
}
