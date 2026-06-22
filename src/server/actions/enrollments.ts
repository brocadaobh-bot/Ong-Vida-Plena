'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { formatZodError } from '@/lib/validation/format-zod-error'
import { getAuthUser } from '@/lib/auth/session'
import { requireAdminOrAssistant } from '@/lib/auth/permissions'
import { getAppSetting } from '@/lib/settings/app-settings.server'
import { enrollmentSchema, updateEnrollmentStatusSchema } from '@/lib/validation/schemas'
import { logAudit } from '@/server/services/audit'
import {
  beneficiaryHasCertificateForCourse,
  CERTIFIED_COURSE_REENROLL_MESSAGE,
} from '@/server/queries/certificates'
import { isReactivatableEnrollment, ACTIVE_BENEFICIARY_ENROLLMENT_STATUSES } from '@/lib/enrollments/enrollment-status'
import type { ActionResult } from '@/types/domain'
import type { EnrollmentStatus } from '@/types/database'

// ─────────────────────────────────────────────────────────────
// Auto-inscrição pelo beneficiário
// ─────────────────────────────────────────────────────────────
export async function selfEnrollAction(classId: string): Promise<ActionResult<{ id: string; status: EnrollmentStatus }>> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }
  if (authUser.role !== 'beneficiary') {
    return { success: false, error: 'Apenas usuários podem se inscrever.' }
  }

  const supabase = await createClient()

  // Verifica se turma está aberta
  const { data: classData } = await supabase
    .from('classes')
    .select('id, status, capacity, course_id')
    .eq('id', classId)
    .single()

  if (!classData || classData.status !== 'open') {
    return { success: false, error: 'Esta turma não está aceitando inscrições.' }
  }

  if (await beneficiaryHasCertificateForCourse(authUser.id, classData.course_id)) {
    return { success: false, error: CERTIFIED_COURSE_REENROLL_MESSAGE }
  }

  // Verifica inscrição duplicada
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id, status')
    .eq('beneficiary_id', authUser.id)
    .eq('class_id', classId)
    .maybeSingle()

  const requiresApproval = await getAppSetting('enrollment_requires_approval', false)
  const initialStatus = requiresApproval ? 'pending' : 'confirmed'

  if (existing) {
    if (isReactivatableEnrollment(existing.status)) {
      const { data: hasCapacity } = await supabase
        .rpc('class_has_capacity', { p_class_id: classId })

      if (!hasCapacity) {
        return {
          success: false,
          error: 'Não há vagas disponíveis nesta turma no momento. Entre em contato com a equipe se precisar de ajuda.',
        }
      }

      const writeClient = createServiceClient()
      const { data: reactivated, error } = await writeClient
        .from('enrollments')
        .update({
          status: initialStatus,
          cancelled_at: null,
          cancellation_reason: null,
        })
        .eq('id', existing.id)
        .eq('beneficiary_id', authUser.id)
        .select('id')
        .single()

      if (error || !reactivated) {
        return { success: false, error: 'Erro ao reativar inscrição.' }
      }
      revalidatePath('/beneficiario/inscricoes')
      revalidatePath('/beneficiario/cursos')
      return { success: true, data: { id: existing.id, status: initialStatus } }
    }
    return { success: false, error: 'Você já está inscrito nesta turma.' }
  }

  // Verifica capacidade — sem vaga, não inscreve (não usa lista de espera)
  const { data: hasCapacity } = await supabase
    .rpc('class_has_capacity', { p_class_id: classId })

  if (!hasCapacity) {
    return {
      success: false,
      error: 'Não há vagas disponíveis nesta turma no momento. Entre em contato com a equipe se precisar de ajuda.',
    }
  }

  const { data: enrollment, error } = await supabase
    .from('enrollments')
    .insert({
      beneficiary_id: authUser.id,
      class_id:       classId,
      status:         initialStatus,
      enrolled_by:    authUser.id,
    })
    .select('id')
    .single()

  if (error) {
    return { success: false, error: 'Erro ao realizar inscrição.' }
  }

  await logAudit({
    actorId:    authUser.id,
    action:     'enrollment.created',
    entityType: 'enrollments',
    entityId:   enrollment.id,
    newValues:  { class_id: classId, status: initialStatus },
  })

  revalidatePath('/beneficiario/inscricoes')
  revalidatePath('/beneficiario/cursos')
  return { success: true, data: { id: enrollment.id, status: initialStatus } }
}

// ─────────────────────────────────────────────────────────────
// Inscrever beneficiário (admin/assistente)
// ─────────────────────────────────────────────────────────────
export async function enrollBeneficiaryAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }
  requireAdminOrAssistant(authUser.role)

  const parsed = enrollmentSchema.safeParse({
    beneficiary_id: formData.get('beneficiary_id'),
    class_id:       formData.get('class_id'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()

  const { data: classData } = await supabase
    .from('classes')
    .select('course_id')
    .eq('id', parsed.data.class_id)
    .single()

  if (
    classData?.course_id &&
    (await beneficiaryHasCertificateForCourse(parsed.data.beneficiary_id, classData.course_id))
  ) {
    return { success: false, error: CERTIFIED_COURSE_REENROLL_MESSAGE }
  }

  // Verifica inscrição duplicada
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id, status')
    .eq('beneficiary_id', parsed.data.beneficiary_id)
    .eq('class_id', parsed.data.class_id)
    .single()

  if (existing && !isReactivatableEnrollment(existing.status)) {
    return { success: false, error: 'Usuário já inscrito nesta turma.' }
  }

  const requiresApproval = await getAppSetting('enrollment_requires_approval', false)
  const enrollmentStatus: EnrollmentStatus = requiresApproval ? 'pending' : 'confirmed'

  const enrollmentPayload = {
    beneficiary_id: parsed.data.beneficiary_id,
    class_id:       parsed.data.class_id,
    status:         enrollmentStatus,
    enrolled_by:    authUser.id,
    cancelled_at:   null,
    cancellation_reason: null,
  }

  const { data: enrollment, error } = existing
    ? await supabase
        .from('enrollments')
        .update(enrollmentPayload)
        .eq('id', existing.id)
        .select('id')
        .single()
    : await supabase
        .from('enrollments')
        .insert(enrollmentPayload)
        .select('id')
        .single()

  if (error) {
    return { success: false, error: 'Erro ao inscrever usuário.' }
  }

  await logAudit({
    actorId:    authUser.id,
    action:     'enrollment.created',
    entityType: 'enrollments',
    entityId:   enrollment.id,
    newValues:  { beneficiary_id: parsed.data.beneficiary_id, class_id: parsed.data.class_id },
  })

  revalidatePath('/assistente/inscricoes')
  revalidatePath('/admin/inscricoes')
  return { success: true, data: { id: enrollment.id } }
}

// ─────────────────────────────────────────────────────────────
// Atualizar status de inscrição
// ─────────────────────────────────────────────────────────────
export async function updateEnrollmentStatusAction(formData: FormData): Promise<ActionResult> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }

  if (!['admin', 'assistant', 'instructor'].includes(authUser.role)) {
    return { success: false, error: 'Permissão negada.' }
  }

  const parsed = updateEnrollmentStatusSchema.safeParse({
    enrollment_id: formData.get('enrollment_id'),
    status:        formData.get('status'),
    reason:        formData.get('reason') || null,
  })

  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) }
  }

  const supabase = await createClient()

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, status, class_id, classes(instructor_id)')
    .eq('id', parsed.data.enrollment_id)
    .single()

  if (!enrollment) {
    return { success: false, error: 'Inscrição não encontrada.' }
  }

  if (authUser.role === 'instructor') {
    const instructorId = (enrollment.classes as { instructor_id: string | null } | null)?.instructor_id
    if (instructorId !== authUser.id) {
      return { success: false, error: 'Permissão negada para alterar esta inscrição.' }
    }
  }

  const oldStatus = enrollment.status

  const updateData: Record<string, unknown> = { status: parsed.data.status }
  if (parsed.data.status === 'cancelled') {
    updateData.cancelled_at = new Date().toISOString()
    updateData.cancellation_reason = parsed.data.reason ?? null
  } else if (['cancelled', 'rejected', 'dropped'].includes(oldStatus)) {
    updateData.cancelled_at = null
    updateData.cancellation_reason = null
  }

  // Service role evita falha do trigger de histórico (RLS em participant_status_history)
  const writeClient = createServiceClient()
  const { error } = await writeClient
    .from('enrollments')
    .update(updateData as import('@/types/database').Database['public']['Tables']['enrollments']['Update'])
    .eq('id', parsed.data.enrollment_id)

  if (error) {
    console.error('updateEnrollmentStatus error:', error)
    return {
      success: false,
      error: 'Não foi possível alterar o status. Tente novamente ou contate o suporte.',
    }
  }

  await logAudit({
    actorId:    authUser.id,
    action:     'enrollment.status_changed',
    entityType: 'enrollments',
    entityId:   parsed.data.enrollment_id,
    oldValues:  { status: oldStatus },
    newValues:  { status: parsed.data.status, reason: parsed.data.reason },
  })

  revalidatePath('/admin/inscricoes')
  revalidatePath('/assistente/inscricoes')
  revalidatePath('/beneficiario/inscricoes')
  revalidatePath('/beneficiario/cursos')
  return { success: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// Cancelar inscrição (própria — beneficiário)
// ─────────────────────────────────────────────────────────────
export async function cancelOwnEnrollmentAction(
  enrollmentId: string,
  reason?: string
): Promise<ActionResult> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }

  const supabase = await createClient()

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, beneficiary_id, status')
    .eq('id', enrollmentId)
    .single()

  if (!enrollment || enrollment.beneficiary_id !== authUser.id) {
    return { success: false, error: 'Inscrição não encontrada.' }
  }

  if (['cancelled', 'completed'].includes(enrollment.status)) {
    return { success: false, error: 'Esta inscrição não pode ser cancelada.' }
  }

  const { error } = await createServiceClient()
    .from('enrollments')
    .update({
      status:              'cancelled',
      cancelled_at:        new Date().toISOString(),
      cancellation_reason: reason ?? 'Cancelamento pelo usuário',
    })
    .eq('id', enrollmentId)
    .eq('beneficiary_id', authUser.id)

  if (error) {
    return { success: false, error: 'Erro ao cancelar inscrição.' }
  }

  await logAudit({
    actorId:    authUser.id,
    action:     'enrollment.cancelled',
    entityType: 'enrollments',
    entityId:   enrollmentId,
    oldValues:  { status: enrollment.status },
    newValues:  { status: 'cancelled' },
  })

  revalidatePath('/beneficiario/inscricoes')
  return { success: true, data: undefined }
}

const ACTIVE_ENROLLMENT_STATUSES = ACTIVE_BENEFICIARY_ENROLLMENT_STATUSES

// ─────────────────────────────────────────────────────────────
// Remover aluno do curso (desistência — admin/assistente/instrutor)
// ─────────────────────────────────────────────────────────────
export async function removeEnrollmentFromCourseAction(
  enrollmentId: string,
  reason?: string,
): Promise<ActionResult> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }

  if (!['admin', 'assistant', 'instructor'].includes(authUser.role)) {
    return { success: false, error: 'Permissão negada.' }
  }

  const supabase = await createClient()

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, status, class_id, beneficiary_id, classes(instructor_id)')
    .eq('id', enrollmentId)
    .single()

  if (!enrollment) {
    return { success: false, error: 'Inscrição não encontrada.' }
  }

  if (!ACTIVE_ENROLLMENT_STATUSES.includes(enrollment.status)) {
    return { success: false, error: 'Esta inscrição já está encerrada.' }
  }

  if (authUser.role === 'instructor') {
    const instructorId = (enrollment.classes as { instructor_id: string | null } | null)?.instructor_id
    if (instructorId !== authUser.id) {
      return { success: false, error: 'Permissão negada para alterar esta inscrição.' }
    }
  }

  const writeClient = createServiceClient()
  const { error } = await writeClient
    .from('enrollments')
    .update({
      status: 'dropped',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason?.trim() || 'Desistência registrada pela equipe',
    })
    .eq('id', enrollmentId)

  if (error) {
    console.error('removeEnrollmentFromCourseAction:', error)
    return { success: false, error: 'Não foi possível remover o aluno do curso.' }
  }

  await logAudit({
    actorId: authUser.id,
    action: 'enrollment.cancelled',
    entityType: 'enrollments',
    entityId: enrollmentId,
    oldValues: { status: enrollment.status },
    newValues: { status: 'dropped', reason: reason ?? null },
  })

  revalidatePath('/admin/inscricoes')
  revalidatePath('/assistente/inscricoes')
  revalidatePath('/admin/turmas')
  revalidatePath('/assistente/turmas')
  revalidatePath('/beneficiario/inscricoes')
  revalidatePath('/beneficiario/cursos')
  return { success: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// Desistir do curso (própria — beneficiário)
// ─────────────────────────────────────────────────────────────
export async function dropOwnEnrollmentAction(
  enrollmentId: string,
  reason?: string,
): Promise<ActionResult> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }
  if (authUser.role !== 'beneficiary') {
    return { success: false, error: 'Apenas beneficiários podem desistir pelo painel.' }
  }

  const supabase = await createClient()

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, beneficiary_id, status')
    .eq('id', enrollmentId)
    .single()

  if (!enrollment || enrollment.beneficiary_id !== authUser.id) {
    return { success: false, error: 'Inscrição não encontrada.' }
  }

  if (!ACTIVE_ENROLLMENT_STATUSES.includes(enrollment.status)) {
    return { success: false, error: 'Esta inscrição não pode ser encerrada.' }
  }

  const { error } = await createServiceClient()
    .from('enrollments')
    .update({
      status: 'dropped',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason?.trim() || 'Desistência solicitada pelo usuário',
    })
    .eq('id', enrollmentId)
    .eq('beneficiary_id', authUser.id)

  if (error) {
    return { success: false, error: 'Erro ao registrar desistência.' }
  }

  await logAudit({
    actorId: authUser.id,
    action: 'enrollment.cancelled',
    entityType: 'enrollments',
    entityId: enrollmentId,
    oldValues: { status: enrollment.status },
    newValues: { status: 'dropped' },
  })

  revalidatePath('/beneficiario/inscricoes')
  revalidatePath('/beneficiario/cursos')
  return { success: true, data: undefined }
}
