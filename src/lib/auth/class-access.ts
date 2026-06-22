import { createClient } from '@/lib/supabase/server'
import type { AuthUser } from '@/types/domain'

export async function assertCanManageClass(
  authUser: AuthUser,
  classId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (['admin', 'assistant'].includes(authUser.role)) {
    return { ok: true }
  }

  if (authUser.role !== 'instructor') {
    return { ok: false, error: 'Permissão negada.' }
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('classes')
    .select('instructor_id')
    .eq('id', classId)
    .single()

  if (!data || data.instructor_id !== authUser.id) {
    return { ok: false, error: 'Você não é instrutor desta turma.' }
  }

  return { ok: true }
}

export async function assertEnrolledInClass(
  authUser: AuthUser,
  classId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('enrollments')
    .select('id')
    .eq('beneficiary_id', authUser.id)
    .eq('class_id', classId)
    .in('status', ['confirmed', 'completed'])
    .maybeSingle()

  if (!data) {
    return { ok: false, error: 'Inscrição não encontrada.' }
  }

  return { ok: true }
}
