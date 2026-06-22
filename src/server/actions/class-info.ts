'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import { assertCanManageClass } from '@/lib/auth/class-access'
import {
  classInfoSchema,
  classAnnouncementSchema,
  classSessionSchema,
} from '@/lib/validation/schemas'
import { logAudit } from '@/server/services/audit'
import type { ActionResult } from '@/types/domain'

function revalidateClassPaths(classId: string) {
  revalidatePath('/admin/turmas')
  revalidatePath(`/instrutor/turmas/${classId}`)
  revalidatePath(`/beneficiario/inscricoes/${classId}`)
  revalidatePath('/beneficiario/inscricoes')
}

function parseOptionalText(v: FormDataEntryValue | null): string | null {
  if (v === null || v === undefined || v === '') return null
  return String(v)
}

// ─────────────────────────────────────────────────────────────
// Atualizar informações da turma (local, sala, WhatsApp, horário)
// ─────────────────────────────────────────────────────────────
export async function updateClassInfoAction(
  classId: string,
  formData: FormData,
): Promise<ActionResult> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }

  const access = await assertCanManageClass(authUser, classId)
  if (!access.ok) return { success: false, error: access.error }

  const parsed = classInfoSchema.safeParse({
    location:             parseOptionalText(formData.get('location')),
    room:                 parseOptionalText(formData.get('room')),
    whatsapp_link:        parseOptionalText(formData.get('whatsapp_link')),
    schedule_description: parseOptionalText(formData.get('schedule_description')),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('classes')
    .update(parsed.data)
    .eq('id', classId)

  if (error) return { success: false, error: 'Erro ao salvar informações da turma.' }

  await logAudit({
    actorId:    authUser.id,
    action:     'class.info_updated',
    entityType: 'classes',
    entityId:   classId,
    newValues:  parsed.data as Record<string, unknown>,
  })

  revalidateClassPaths(classId)
  return { success: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// Avisos da turma
// ─────────────────────────────────────────────────────────────
export async function createClassAnnouncementAction(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }

  const classId = String(formData.get('class_id') ?? '')
  const access = await assertCanManageClass(authUser, classId)
  if (!access.ok) return { success: false, error: access.error }

  const parsed = classAnnouncementSchema.safeParse({
    class_id:  classId,
    title:     formData.get('title'),
    body:      formData.get('body'),
    is_pinned: formData.get('is_pinned') === 'on' || formData.get('is_pinned') === 'true',
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('class_announcements')
    .insert({ ...parsed.data, created_by: authUser.id })
    .select('id')
    .single()

  if (error) return { success: false, error: 'Erro ao publicar aviso.' }

  revalidateClassPaths(classId)
  return { success: true, data: { id: data.id } }
}

export async function deleteClassAnnouncementAction(
  announcementId: string,
  classId: string,
): Promise<ActionResult> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }

  const access = await assertCanManageClass(authUser, classId)
  if (!access.ok) return { success: false, error: access.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('class_announcements')
    .delete()
    .eq('id', announcementId)
    .eq('class_id', classId)

  if (error) return { success: false, error: 'Erro ao remover aviso.' }

  revalidateClassPaths(classId)
  return { success: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// Aulas presenciais
// ─────────────────────────────────────────────────────────────
export async function upsertClassSessionAction(
  formData: FormData,
  sessionId?: string,
): Promise<ActionResult<{ id: string }>> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }

  const classId = String(formData.get('class_id') ?? '')
  const access = await assertCanManageClass(authUser, classId)
  if (!access.ok) return { success: false, error: access.error }

  const parsed = classSessionSchema.safeParse({
    class_id:     classId,
    session_date: formData.get('session_date'),
    start_time:   parseOptionalText(formData.get('start_time')),
    end_time:     parseOptionalText(formData.get('end_time')),
    topic:        parseOptionalText(formData.get('topic')),
    room:         parseOptionalText(formData.get('room')),
    status:       formData.get('status') || 'scheduled',
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()

  if (sessionId) {
    const { error } = await supabase
      .from('class_sessions')
      .update(parsed.data)
      .eq('id', sessionId)
      .eq('class_id', classId)

    if (error) return { success: false, error: 'Erro ao atualizar aula.' }
    revalidateClassPaths(classId)
    return { success: true, data: { id: sessionId } }
  }

  const { data, error } = await supabase
    .from('class_sessions')
    .insert(parsed.data)
    .select('id')
    .single()

  if (error) return { success: false, error: 'Erro ao criar aula.' }

  revalidateClassPaths(classId)
  return { success: true, data: { id: data.id } }
}

export async function deleteClassSessionAction(
  sessionId: string,
  classId: string,
): Promise<ActionResult> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }

  const access = await assertCanManageClass(authUser, classId)
  if (!access.ok) return { success: false, error: access.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('class_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('class_id', classId)

  if (error) return { success: false, error: 'Erro ao remover aula.' }

  revalidateClassPaths(classId)
  return { success: true, data: undefined }
}
