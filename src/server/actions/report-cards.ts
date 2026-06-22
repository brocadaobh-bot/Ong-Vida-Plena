'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import { getStudentReportCard } from '@/server/queries/report-cards'
import { getClassCompletionPreview } from '@/server/queries/class-completion'
import { upsertReportCardSnapshot } from '@/server/services/report-cards'
import { refreshClassReportCards } from '@/server/services/refresh-report-card'
import { logAudit } from '@/server/services/audit'
import type { ActionResult } from '@/types/domain'
import type { AuthUser } from '@/types/domain'

async function assertCanManageEnrollment(
  authUser: AuthUser,
  enrollmentId: string,
): Promise<{ ok: true; classId: string } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('class_id, classes(instructor_id)')
    .eq('id', enrollmentId)
    .single()

  if (!enrollment) return { ok: false, error: 'Inscrição não encontrada.' }

  if (authUser.role === 'admin' || authUser.role === 'assistant') {
    return { ok: true, classId: enrollment.class_id }
  }

  if (authUser.role === 'instructor') {
    const instructorId = (enrollment.classes as { instructor_id: string | null } | null)?.instructor_id
    if (instructorId === authUser.id) {
      return { ok: true, classId: enrollment.class_id }
    }
  }

  return { ok: false, error: 'Permissão negada.' }
}

export async function reopenRecoveryAction(enrollmentId: string): Promise<ActionResult> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }

  const access = await assertCanManageEnrollment(authUser, enrollmentId)
  if (!access.ok) return { success: false, error: access.error }

  const supabase = await createClient()
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('status')
    .eq('id', enrollmentId)
    .single()

  if (!enrollment) return { success: false, error: 'Inscrição não encontrada.' }
  if (enrollment.status !== 'recovery') {
    return { success: false, error: 'Esta inscrição não está em recuperação.' }
  }

  const writeClient = createServiceClient()

  await writeClient
    .from('enrollments')
    .update({ status: 'confirmed' })
    .eq('id', enrollmentId)

  await writeClient
    .from('enrollment_report_cards')
    .update({
      recovery_reopened_at: new Date().toISOString(),
      recovery_reopened_by: authUser.id,
      approved:             false,
    })
    .eq('enrollment_id', enrollmentId)

  await logAudit({
    actorId:    authUser.id,
    action:     'enrollment.recovery_reopened',
    entityType: 'enrollments',
    entityId:   enrollmentId,
  })

  revalidatePaths(access.classId, enrollmentId)
  return { success: true, data: undefined }
}

export async function approveStudentAfterRecoveryAction(
  enrollmentId: string,
): Promise<ActionResult> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }

  const access = await assertCanManageEnrollment(authUser, enrollmentId)
  if (!access.ok) return { success: false, error: access.error }

  const report = await getStudentReportCard(enrollmentId)
  if (!report) return { success: false, error: 'Boletim não encontrado.' }

  if (!report.attendanceMet || !report.activitiesMet) {
    return {
      success: false,
      error: 'Aluno ainda não atinge presença mínima ou notas nas atividades.',
    }
  }

  const writeClient = createServiceClient()

  await writeClient
    .from('enrollments')
    .update({ status: 'completed' })
    .eq('id', enrollmentId)

  await upsertReportCardSnapshot(writeClient, enrollmentId, access.classId, report, true)

  await logAudit({
    actorId:    authUser.id,
    action:     'enrollment.approved_after_recovery',
    entityType: 'enrollments',
    entityId:   enrollmentId,
  })

  revalidatePaths(access.classId, enrollmentId)
  return { success: true, data: undefined }
}

export async function reevaluateClassStudentsAction(classId: string): Promise<ActionResult<{ approved: number }>> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }

  if (!['admin', 'assistant', 'instructor'].includes(authUser.role)) {
    return { success: false, error: 'Permissão negada.' }
  }

  const preview = await getClassCompletionPreview(classId)
  if (!preview) return { success: false, error: 'Turma não encontrada.' }

  const writeClient = createServiceClient()
  let approved = 0

  for (const student of preview.students) {
    if (!student.eligible) continue
    if (student.enrollmentStatus === 'completed') continue

    await writeClient
      .from('enrollments')
      .update({ status: 'completed' })
      .eq('id', student.enrollmentId)

    const report = await getStudentReportCard(student.enrollmentId)
    if (report) {
      await upsertReportCardSnapshot(
        writeClient,
        student.enrollmentId,
        classId,
        report,
        true,
      )
    }

    approved++
  }

  revalidatePaths(classId)
  return { success: true, data: { approved } }
}

export async function refreshClassReportCardsAction(
  classId: string,
): Promise<ActionResult<{ updated: number }>> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }

  if (!['admin', 'assistant', 'instructor'].includes(authUser.role)) {
    return { success: false, error: 'Permissão negada.' }
  }

  if (authUser.role === 'instructor') {
    const supabase = await createClient()
    const { data } = await supabase
      .from('classes')
      .select('instructor_id')
      .eq('id', classId)
      .single()

    if (data?.instructor_id !== authUser.id) {
      return { success: false, error: 'Você não é instrutor desta turma.' }
    }
  }

  const updated = await refreshClassReportCards(classId)
  revalidatePaths(classId)
  revalidatePath(`/instrutor/turmas/${classId}/atividades`)

  return { success: true, data: { updated } }
}

function revalidatePaths(classId: string, enrollmentId?: string) {
  revalidatePath('/admin/inscricoes')
  revalidatePath('/assistente/inscricoes')
  revalidatePath('/beneficiario/inscricoes')
  revalidatePath('/beneficiario/historico')
  revalidatePath('/beneficiario/boletim')
  revalidatePath('/beneficiario/certificados')
  revalidatePath(`/instrutor/turmas/${classId}`)
  revalidatePath(`/instrutor/turmas/${classId}/alunos`)
  if (enrollmentId) {
    revalidatePath(`/instrutor/turmas/${classId}/alunos/${enrollmentId}`)
  }
}
