'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import { attendanceRecordSchema } from '@/lib/validation/schemas'
import { logAudit } from '@/server/services/audit'
import type { ActionResult } from '@/types/domain'

// ─────────────────────────────────────────────────────────────
// Registrar/Atualizar presença (instrutor, admin, assistente)
// ─────────────────────────────────────────────────────────────
export async function recordAttendanceAction(formData: FormData): Promise<ActionResult> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }

  if (!['admin', 'assistant', 'instructor'].includes(authUser.role)) {
    return { success: false, error: 'Permissão negada.' }
  }

  const parsed = attendanceRecordSchema.safeParse({
    session_id:    formData.get('session_id'),
    enrollment_id: formData.get('enrollment_id'),
    status:        formData.get('status'),
    notes:         formData.get('notes') || null,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('attendance_records')
    .select('id, status')
    .eq('session_id', parsed.data.session_id)
    .eq('enrollment_id', parsed.data.enrollment_id)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('attendance_records')
      .update({
        status:      parsed.data.status,
        notes:       parsed.data.notes ?? null,
        recorded_by: authUser.id,
        recorded_at: new Date().toISOString(),
      })
      .eq('id', existing.id)

    if (error) return { success: false, error: 'Erro ao atualizar presença.' }

    await logAudit({
      actorId:    authUser.id,
      action:     'attendance.updated',
      entityType: 'attendance_records',
      entityId:   existing.id,
      oldValues:  { status: existing.status },
      newValues:  { status: parsed.data.status },
    })
  } else {
    const { data: record, error } = await supabase
      .from('attendance_records')
      .insert({
        session_id:    parsed.data.session_id,
        enrollment_id: parsed.data.enrollment_id,
        status:        parsed.data.status,
        notes:         parsed.data.notes ?? null,
        recorded_by:   authUser.id,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: 'Erro ao registrar presença.' }

    await logAudit({
      actorId:    authUser.id,
      action:     'attendance.recorded',
      entityType: 'attendance_records',
      entityId:   record.id,
      newValues:  { status: parsed.data.status },
    })
  }

  revalidatePath('/instrutor/turmas')
  return { success: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// Registrar presença em lote para uma sessão
// ─────────────────────────────────────────────────────────────
export async function bulkRecordAttendanceAction(
  sessionId: string,
  records: { enrollment_id: string; status: 'present' | 'absent' | 'justified' | 'late'; notes?: string }[]
): Promise<ActionResult> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }

  if (!['admin', 'assistant', 'instructor'].includes(authUser.role)) {
    return { success: false, error: 'Permissão negada.' }
  }

  const supabase = await createClient()

  for (const record of records) {
    await supabase
      .from('attendance_records')
      .upsert({
        session_id:    sessionId,
        enrollment_id: record.enrollment_id,
        status:        record.status,
        notes:         record.notes ?? null,
        recorded_by:   authUser.id,
        recorded_at:   new Date().toISOString(),
      }, { onConflict: 'session_id,enrollment_id' })
  }

  await logAudit({
    actorId:    authUser.id,
    action:     'attendance.recorded',
    entityType: 'class_sessions',
    entityId:   sessionId,
    newValues:  { count: records.length },
  })

  revalidatePath('/instrutor/turmas')
  return { success: true, data: undefined }
}
