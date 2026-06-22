import type { EnrollmentStatus } from '@/types/database'

/** Status em que o usuário pode abrir a página da turma (conteúdo, avisos, etc.). */
export const BENEFICIARY_CLASS_ACCESS_STATUSES: EnrollmentStatus[] = ['confirmed', 'completed', 'recovery']

/** Alunos ativos na turma (presença, atividades, boletim, conclusão). */
export const ACTIVE_CLASS_ENROLLMENT_STATUSES: EnrollmentStatus[] = [
  'confirmed',
  'recovery',
  'completed',
]

export function canBeneficiaryAccessClassEnrollment(status: EnrollmentStatus): boolean {
  return BENEFICIARY_CLASS_ACCESS_STATUSES.includes(status)
}
