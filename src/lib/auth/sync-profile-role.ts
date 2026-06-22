import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { UserRole } from '@/types/database'

type ServiceClient = SupabaseClient<Database>

const STAFF_ROLES: UserRole[] = ['admin', 'assistant', 'instructor']

/**
 * Garante beneficiary_profiles / staff_profiles após mudança de papel.
 */
export async function syncProfileRoleExtensions(
  supabase: ServiceClient,
  userId: string,
  role: UserRole,
): Promise<void> {
  if (role === 'beneficiary') {
    const { data: existing } = await supabase
      .from('beneficiary_profiles')
      .select('id')
      .eq('profile_id', userId)
      .maybeSingle()

    if (!existing) {
      await supabase.from('beneficiary_profiles').insert({ profile_id: userId })
    }
    return
  }

  if (STAFF_ROLES.includes(role)) {
    const { data: existing } = await supabase
      .from('staff_profiles')
      .select('id')
      .eq('profile_id', userId)
      .maybeSingle()

    if (!existing) {
      await supabase.from('staff_profiles').insert({ profile_id: userId })
    }
  }
}
