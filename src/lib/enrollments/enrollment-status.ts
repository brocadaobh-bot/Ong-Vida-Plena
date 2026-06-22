import type { EnrollmentStatus } from '@/types/database'

/** Contagem de inscrições ativas no dashboard (alinhado a get_admin_dashboard_metrics). */
export const DASHBOARD_ACTIVE_ENROLLMENT_STATUSES: EnrollmentStatus[] = [
  'pending',
  'confirmed',
]

/** Inscrições em que o beneficiário ainda está participando (ou aguardando vaga). */
export const ACTIVE_BENEFICIARY_ENROLLMENT_STATUSES: EnrollmentStatus[] = [
  'pending',
  'confirmed',
  'waitlisted',
  'recovery',
]

/** Inscrições encerradas que podem ser reativadas com nova inscrição na mesma turma. */
export const REACTIVATABLE_ENROLLMENT_STATUSES: EnrollmentStatus[] = [
  'cancelled',
  'rejected',
  'dropped',
]

export function isActiveBeneficiaryEnrollment(status: EnrollmentStatus): boolean {
  return ACTIVE_BENEFICIARY_ENROLLMENT_STATUSES.includes(status)
}

export function isReactivatableEnrollment(status: EnrollmentStatus): boolean {
  return REACTIVATABLE_ENROLLMENT_STATUSES.includes(status)
}
