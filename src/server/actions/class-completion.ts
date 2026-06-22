'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import { getClassCompletionPreview } from '@/server/queries/class-completion'
import { getStudentReportCard } from '@/server/queries/report-cards'
import { upsertReportCardSnapshot } from '@/server/services/report-cards'
import { logAudit } from '@/server/services/audit'
import type { ActionResult } from '@/types/domain'
import type { ClassCompletionPreview } from '@/lib/classes/completion-eligibility'
import type { AuthUser } from '@/types/domain'

async function assertCanCompleteClass(
  authUser: AuthUser,
  classId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (authUser.role === 'admin') return { ok: true }

  if (authUser.role === 'instructor') {
    const supabase = await createClient()
    const { data } = await supabase
      .from('classes')
      .select('instructor_id')
      .eq('id', classId)
      .single()

    if (data?.instructor_id === authUser.id) return { ok: true }
    return { ok: false, error: 'Você não é instrutor desta turma.' }
  }

  return { ok: false, error: 'Permissão negada.' }
}

export async function fetchClassCompletionPreviewAction(
  classId: string,
): Promise<ActionResult<ClassCompletionPreview>> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }

  const access = await assertCanCompleteClass(authUser, classId)
  if (!access.ok) return { success: false, error: access.error }

  const preview = await getClassCompletionPreview(classId)
  if (!preview) return { success: false, error: 'Turma não encontrada.' }

  return { success: true, data: preview }
}

export async function completeClassAction(classId: string): Promise<ActionResult> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }

  const access = await assertCanCompleteClass(authUser, classId)
  if (!access.ok) return { success: false, error: access.error }

  const preview = await getClassCompletionPreview(classId)
  if (!preview) return { success: false, error: 'Turma não encontrada.' }

  if (preview.classStatus === 'completed') {
    return { success: false, error: 'Esta turma já está concluída.' }
  }

  if (preview.classStatus === 'cancelled') {
    return { success: false, error: 'Não é possível concluir uma turma cancelada.' }
  }

  if (preview.totalSessions === 0) {
    return {
      success: false,
      error: 'Cadastre aulas e registre presenças antes de concluir a turma.',
    }
  }

  const writeClient = createServiceClient()

  const { error: classError } = await writeClient
    .from('classes')
    .update({ status: 'completed' })
    .eq('id', classId)

  if (classError) {
    return { success: false, error: 'Erro ao concluir a turma.' }
  }

  for (const student of preview.students) {
    const report = await getStudentReportCard(student.enrollmentId)
    if (!report) continue

    const approved = student.eligible
    await upsertReportCardSnapshot(
      writeClient,
      student.enrollmentId,
      classId,
      report,
      approved,
    )

    await writeClient
      .from('enrollments')
      .update({ status: approved ? 'completed' : 'recovery' })
      .eq('id', student.enrollmentId)
  }

  await logAudit({
    actorId:    authUser.id,
    action:     'class.updated',
    entityType: 'classes',
    entityId:   classId,
    newValues:  {
      status: 'completed',
      approved_enrollments: preview.eligibleCount,
      recovery_enrollments: preview.ineligibleCount,
    },
  })

  revalidatePath('/admin/turmas')
  revalidatePath('/instrutor/turmas')
  revalidatePath(`/instrutor/turmas/${classId}`)
  revalidatePath('/admin/inscricoes')
  revalidatePath('/assistente/inscricoes')
  revalidatePath('/beneficiario/inscricoes')
  revalidatePath('/beneficiario/historico')
  revalidatePath('/beneficiario/boletim')
  revalidatePath('/beneficiario/certificados')

  return { success: true, data: undefined }
}
