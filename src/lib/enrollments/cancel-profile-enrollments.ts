import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, EnrollmentStatus, UserRole } from '@/types/database'

/** Inscrições que podem ser canceladas ao remover aluno da turma. */
export const CANCELLABLE_ENROLLMENT_STATUSES: EnrollmentStatus[] = [
  'pending',
  'confirmed',
  'waitlisted',
  'recovery',
  'completed',
]

export function shouldCancelEnrollmentsOnRoleChange(
  oldRole: UserRole,
  newRole: UserRole,
): boolean {
  return oldRole === 'beneficiary' && newRole !== 'beneficiary'
}

export function cancellationReasonForRoleChange(newRole: UserRole): string {
  return `Conta promovida para ${newRole} — inscrições como aluno canceladas automaticamente.`
}

export async function cancelProfileStudentEnrollments(
  supabase: SupabaseClient<Database>,
  profileId: string,
  reason: string,
): Promise<number> {
  const { data: enrollments, error: fetchError } = await supabase
    .from('enrollments')
    .select('id')
    .eq('beneficiary_id', profileId)
    .in('status', CANCELLABLE_ENROLLMENT_STATUSES)

  if (fetchError) {
    console.error('cancelProfileStudentEnrollments fetch:', fetchError)
    throw fetchError
  }

  if (!enrollments?.length) return 0

  const now = new Date().toISOString()
  const { error: updateError } = await supabase
    .from('enrollments')
    .update({
      status: 'cancelled',
      cancelled_at: now,
      cancellation_reason: reason,
    })
    .in(
      'id',
      enrollments.map(e => e.id),
    )

  if (updateError) {
    console.error('cancelProfileStudentEnrollments update:', updateError)
    throw updateError
  }

  return enrollments.length
}

export async function countActiveStudentEnrollmentsForProfile(
  supabase: SupabaseClient<Database>,
  profileId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from('enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('beneficiary_id', profileId)
    .in('status', CANCELLABLE_ENROLLMENT_STATUSES)

  if (error) {
    console.error('countActiveStudentEnrollmentsForProfile:', error)
    return 0
  }

  return count ?? 0
}
