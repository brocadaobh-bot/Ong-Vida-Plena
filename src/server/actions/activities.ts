'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import {
  classActivitySchema,
  updateClassActivitySchema,
  activityGradeSchema,
} from '@/lib/validation/schemas'
import { logAudit } from '@/server/services/audit'
import { normalizeScore } from '@/lib/activities/evaluation'
import { mapSupabaseWriteError } from '@/lib/supabase/errors'
import { refreshEnrollmentReportCardSnapshot, refreshClassReportCards } from '@/server/services/refresh-report-card'
import type { ActionResult } from '@/types/domain'

async function assertCanManageClassActivities(
  classId: string,
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const authUser = await getAuthUser()
  if (!authUser) return { ok: false, error: 'Não autenticado.' }

  if (['admin', 'assistant'].includes(authUser.role)) {
    return { ok: true, userId: authUser.id }
  }

  if (authUser.role === 'instructor') {
    const supabase = await createClient()
    const { data } = await supabase
      .from('classes')
      .select('instructor_id')
      .eq('id', classId)
      .single()

    if (data?.instructor_id === authUser.id) {
      return { ok: true, userId: authUser.id }
    }
    return { ok: false, error: 'Você não é instrutor desta turma.' }
  }

  return { ok: false, error: 'Permissão negada.' }
}

function revalidateClassPaths(classId: string, activityId?: string) {
  revalidatePath(`/instrutor/turmas/${classId}`)
  revalidatePath(`/instrutor/turmas/${classId}/atividades`)
  revalidatePath(`/instrutor/turmas/${classId}/alunos`)
  revalidatePath('/beneficiario/boletim')
  if (activityId) {
    revalidatePath(`/instrutor/turmas/${classId}/atividades/${activityId}`)
  }
}

export async function createClassActivityAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const classId = String(formData.get('class_id') ?? '')
  const access = await assertCanManageClassActivities(classId)
  if (!access.ok) return { success: false, error: access.error }

  const parsed = classActivitySchema.safeParse({
    class_id:           classId,
    session_id:         formData.get('session_id'),
    title:              formData.get('title'),
    description:        formData.get('description') || null,
    max_score:          formData.get('max_score'),
    min_passing_score:  formData.get('min_passing_score'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  if (parsed.data.min_passing_score > parsed.data.max_score) {
    return { success: false, error: 'Nota mínima não pode ser maior que a nota máxima.' }
  }

  const readClient = await createClient()
  const { data: session } = await readClient
    .from('class_sessions')
    .select('id')
    .eq('id', parsed.data.session_id)
    .eq('class_id', classId)
    .maybeSingle()

  if (!session) {
    return { success: false, error: 'Selecione uma aula válida desta turma.' }
  }

  const writeClient = createServiceClient()
  const { data, error } = await writeClient
    .from('class_activities')
    .insert({ ...parsed.data, created_by: access.userId })
    .select('id')
    .single()

  if (error || !data) {
    return { success: false, error: mapSupabaseWriteError(error, 'Erro ao criar atividade.') }
  }

  await logAudit({
    actorId:    access.userId,
    action:     'class_activity.created',
    entityType: 'class_activities',
    entityId:   data.id,
    newValues:  parsed.data as Record<string, unknown>,
  })

  await refreshClassReportCards(classId)

  revalidateClassPaths(classId)
  return { success: true, data: { id: data.id } }
}

export async function updateClassActivityAction(formData: FormData): Promise<ActionResult> {
  const activityId = String(formData.get('activity_id') ?? '')

  const readClient = await createClient()
  const { data: existing } = await readClient
    .from('class_activities')
    .select('class_id')
    .eq('id', activityId)
    .single()

  if (!existing) return { success: false, error: 'Atividade não encontrada.' }

  const access = await assertCanManageClassActivities(existing.class_id)
  if (!access.ok) return { success: false, error: access.error }

  const parsed = updateClassActivitySchema.safeParse({
    activity_id:       activityId,
    session_id:        formData.get('session_id'),
    title:             formData.get('title'),
    description:       formData.get('description') || null,
    max_score:         formData.get('max_score'),
    min_passing_score: formData.get('min_passing_score'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  if (parsed.data.min_passing_score > parsed.data.max_score) {
    return { success: false, error: 'Nota mínima não pode ser maior que a nota máxima.' }
  }

  const { data: session } = await readClient
    .from('class_sessions')
    .select('id')
    .eq('id', parsed.data.session_id)
    .eq('class_id', existing.class_id)
    .maybeSingle()

  if (!session) {
    return { success: false, error: 'Selecione uma aula válida desta turma.' }
  }

  const { activity_id: _id, ...updateData } = parsed.data

  const writeClient = createServiceClient()
  const { error } = await writeClient
    .from('class_activities')
    .update(updateData)
    .eq('id', activityId)

  if (error) {
    return { success: false, error: mapSupabaseWriteError(error, 'Erro ao atualizar atividade.') }
  }

  await logAudit({
    actorId:    access.userId,
    action:     'class_activity.updated',
    entityType: 'class_activities',
    entityId:   activityId,
    newValues:  updateData as Record<string, unknown>,
  })

  revalidateClassPaths(existing.class_id, activityId)
  return { success: true, data: undefined }
}

export async function deleteClassActivityAction(activityId: string): Promise<ActionResult> {
  const readClient = await createClient()
  const { data: activity } = await readClient
    .from('class_activities')
    .select('class_id')
    .eq('id', activityId)
    .single()

  if (!activity) return { success: false, error: 'Atividade não encontrada.' }

  const access = await assertCanManageClassActivities(activity.class_id)
  if (!access.ok) return { success: false, error: access.error }

  const writeClient = createServiceClient()
  const { error } = await writeClient
    .from('class_activities')
    .delete()
    .eq('id', activityId)

  if (error) {
    return { success: false, error: mapSupabaseWriteError(error, 'Erro ao excluir atividade.') }
  }

  revalidateClassPaths(activity.class_id)
  return { success: true, data: undefined }
}

export async function saveActivityGradeAction(formData: FormData): Promise<ActionResult> {
  const parsed = activityGradeSchema.safeParse({
    activity_id:   formData.get('activity_id'),
    enrollment_id: formData.get('enrollment_id'),
    score:         formData.get('score'),
    feedback:      formData.get('feedback') || null,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const readClient = await createClient()

  const { data: activity } = await readClient
    .from('class_activities')
    .select('class_id, max_score')
    .eq('id', parsed.data.activity_id)
    .single()

  if (!activity) return { success: false, error: 'Atividade não encontrada.' }

  const access = await assertCanManageClassActivities(activity.class_id)
  if (!access.ok) return { success: false, error: access.error }

  const score = normalizeScore(parsed.data.score, Number(activity.max_score))
  const writeClient = createServiceClient()

  const { data: existing } = await writeClient
    .from('activity_grades')
    .select('id')
    .eq('activity_id', parsed.data.activity_id)
    .eq('enrollment_id', parsed.data.enrollment_id)
    .maybeSingle()

  const payload = {
    score,
    feedback:  parsed.data.feedback ?? null,
    graded_by: access.userId,
    graded_at: new Date().toISOString(),
  }

  if (existing) {
    const { error } = await writeClient
      .from('activity_grades')
      .update(payload)
      .eq('id', existing.id)

    if (error) {
      return { success: false, error: mapSupabaseWriteError(error, 'Erro ao atualizar nota.') }
    }
  } else {
    const { error } = await writeClient
      .from('activity_grades')
      .insert({
        activity_id:   parsed.data.activity_id,
        enrollment_id: parsed.data.enrollment_id,
        ...payload,
      })

    if (error) {
      return { success: false, error: mapSupabaseWriteError(error, 'Erro ao salvar nota.') }
    }
  }

  await refreshEnrollmentReportCardSnapshot(parsed.data.enrollment_id)

  revalidateClassPaths(activity.class_id, parsed.data.activity_id)
  revalidatePath(`/instrutor/turmas/${activity.class_id}/alunos/${parsed.data.enrollment_id}`)
  revalidatePath('/beneficiario/boletim')

  return { success: true, data: undefined }
}
