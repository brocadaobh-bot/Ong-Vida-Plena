import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/session'

import type { OwnProfileData } from '@/types/domain'

export async function getOwnProfileRow(): Promise<OwnProfileData | null> {
  const authUser = await getAuthUser()
  if (!authUser) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('full_name, email, phone, birth_date, document_type, document_number, role')
    .eq('id', authUser.id)
    .single()

  return data
}
