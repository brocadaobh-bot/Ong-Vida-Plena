'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import { requireAdmin, requireAdminOrAssistant } from '@/lib/auth/permissions'
import { courseSchema, classSchema, classSessionSchema } from '@/lib/validation/schemas'
import { logAudit } from '@/server/services/audit'
import { ensureOpenClassForActiveCourse } from '@/server/services/course-lifecycle'
import { assertSingleOpenClassPerCourse } from '@/lib/classes/open-class-policy'
import type { ActionResult } from '@/types/domain'

// ─────────────────────────────────────────────────────────────
// Criar curso
// ─────────────────────────────────────────────────────────────

function parseCourseFormData(formData: FormData) {
  const raw = Object.fromEntries(formData)
  const optionalText = (v: unknown) => (v === '' || v === undefined ? null : v)

  return {
    ...raw,
    description:    optionalText(raw.description),
    requirements:   optionalText(raw.requirements),
    workload_hours: raw.workload_hours === '' || raw.workload_hours === undefined
      ? null
      : raw.workload_hours,
  }
}

export async function createCourseAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }
  requireAdmin(authUser.role)

  const parsed = courseSchema.safeParse(parseCourseFormData(formData))
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()
  const { data: course, error } = await supabase
    .from('courses')
    .insert({ ...parsed.data, created_by: authUser.id })
    .select('id')
    .single()

  if (error) return { success: false, error: 'Erro ao criar curso.' }

  if (parsed.data.status === 'active') {
    await ensureOpenClassForActiveCourse(supabase, {
      courseId:    course.id,
      courseTitle: parsed.data.title,
      actorId:     authUser.id,
    })
  }

  await logAudit({
    actorId:    authUser.id,
    action:     'course.created',
    entityType: 'courses',
    entityId:   course.id,
    newValues:  parsed.data as Record<string, unknown>,
  })

  revalidatePath('/admin/cursos')
  revalidatePath('/admin/turmas')
  revalidatePath('/beneficiario/cursos')
  return { success: true, data: { id: course.id } }
}

// ─────────────────────────────────────────────────────────────
// Atualizar curso
// ─────────────────────────────────────────────────────────────
export async function updateCourseAction(
  courseId: string,
  formData: FormData
): Promise<ActionResult> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }
  requireAdmin(authUser.role)

  const parsed = courseSchema.safeParse(parseCourseFormData(formData))
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()

  const { data: old } = await supabase.from('courses').select('*').eq('id', courseId).single()

  const { error } = await supabase
    .from('courses')
    .update(parsed.data)
    .eq('id', courseId)

  if (error) return { success: false, error: 'Erro ao atualizar curso.' }

  if (parsed.data.status === 'active') {
    await ensureOpenClassForActiveCourse(supabase, {
      courseId,
      courseTitle: parsed.data.title,
      actorId:     authUser.id,
    })
  }

  await logAudit({
    actorId:    authUser.id,
    action:     'course.updated',
    entityType: 'courses',
    entityId:   courseId,
    oldValues:  old ?? undefined,
    newValues:  parsed.data as Record<string, unknown>,
  })

  revalidatePath('/admin/cursos')
  revalidatePath('/admin/turmas')
  revalidatePath('/beneficiario/cursos')
  return { success: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// Reabrir inscrições (nova turma no mesmo curso)
// ─────────────────────────────────────────────────────────────
export async function reopenCourseEnrollmentsAction(
  courseId: string,
): Promise<ActionResult<{ classId?: string; created: boolean }>> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }
  requireAdminOrAssistant(authUser.role)

  const supabase = await createClient()
  const { data: course, error: fetchError } = await supabase
    .from('courses')
    .select('id, title, status')
    .eq('id', courseId)
    .single()

  if (fetchError || !course) {
    return { success: false, error: 'Curso não encontrado.' }
  }

  if (course.status === 'draft') {
    return {
      success: false,
      error: 'Este curso ainda é rascunho. Edite e marque como Ativo primeiro.',
    }
  }

  if (course.status !== 'active') {
    const { error: activateError } = await supabase
      .from('courses')
      .update({ status: 'active' })
      .eq('id', courseId)

    if (activateError) {
      return { success: false, error: 'Erro ao reativar o curso.' }
    }

    await logAudit({
      actorId:    authUser.id,
      action:     'course.status_changed',
      entityType: 'courses',
      entityId:   courseId,
      oldValues:  { status: course.status },
      newValues:  { status: 'active' },
    })
  }

  const result = await ensureOpenClassForActiveCourse(supabase, {
    courseId:    course.id,
    courseTitle: course.title,
    actorId:     authUser.id,
  })

  if (!result.classId) {
    return { success: false, error: 'Não foi possível abrir uma nova turma.' }
  }

  revalidatePath('/admin/cursos')
  revalidatePath('/admin/turmas')
  revalidatePath('/assistente/turmas')
  revalidatePath('/assistente/inscricoes')
  revalidatePath('/beneficiario/cursos')

  return {
    success: true,
    data: {
      classId: result.classId,
      created: result.created,
    },
  }
}

// ─────────────────────────────────────────────────────────────
// Excluir curso (remove turmas, inscrições e histórico vinculado)
// ─────────────────────────────────────────────────────────────
export async function deleteCourseAction(courseId: string): Promise<ActionResult> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }
  requireAdmin(authUser.role)

  const supabase = await createClient()
  const { data: course, error: fetchError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()

  if (fetchError || !course) {
    return { success: false, error: 'Curso não encontrado.' }
  }

  const serviceSupabase = createServiceClient()
  const { error: deleteError } = await serviceSupabase
    .from('courses')
    .delete()
    .eq('id', courseId)

  if (deleteError) {
    console.error('[deleteCourseAction]', deleteError)
    return { success: false, error: 'Erro ao excluir curso.' }
  }

  await logAudit({
    actorId:    authUser.id,
    action:     'course.deleted',
    entityType: 'courses',
    entityId:   courseId,
    oldValues:  course as Record<string, unknown>,
  })

  revalidatePath('/admin/cursos')
  revalidatePath('/admin/turmas')
  revalidatePath('/admin/inscricoes')
  revalidatePath('/beneficiario/cursos')

  return { success: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// Criar turma
// ─────────────────────────────────────────────────────────────
export async function createClassAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }
  requireAdminOrAssistant(authUser.role)

  const parsed = classSchema.safeParse({
    ...Object.fromEntries(formData),
    capacity:      formData.get('capacity'),
    instructor_id: formData.get('instructor_id') || null,
    end_date:      formData.get('end_date') || null,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()

  const openCheck = await assertSingleOpenClassPerCourse(
    supabase,
    parsed.data.course_id,
    parsed.data.status,
  )
  if (!openCheck.ok) {
    return { success: false, error: openCheck.error }
  }

  const { data: classItem, error } = await supabase
    .from('classes')
    .insert(parsed.data)
    .select('id')
    .single()

  if (error) return { success: false, error: 'Erro ao criar turma.' }

  await logAudit({
    actorId:    authUser.id,
    action:     'class.created',
    entityType: 'classes',
    entityId:   classItem.id,
    newValues:  parsed.data as Record<string, unknown>,
  })

  revalidatePath('/admin/turmas')
  revalidatePath('/admin/cursos')
  revalidatePath('/assistente/turmas')
  revalidatePath('/assistente/inscricoes')
  return { success: true, data: { id: classItem.id } }
}

// ─────────────────────────────────────────────────────────────
// Atualizar turma
// ─────────────────────────────────────────────────────────────
export async function updateClassAction(
  classId: string,
  formData: FormData
): Promise<ActionResult> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }
  requireAdminOrAssistant(authUser.role)

  const parsed = classSchema.safeParse({
    ...Object.fromEntries(formData),
    capacity:      formData.get('capacity'),
    instructor_id: formData.get('instructor_id') || null,
    end_date:      formData.get('end_date') || null,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()
  const { data: old } = await supabase.from('classes').select('*').eq('id', classId).single()
  if (!old) return { success: false, error: 'Turma não encontrada.' }

  const openCheck = await assertSingleOpenClassPerCourse(
    supabase,
    parsed.data.course_id,
    parsed.data.status,
    classId,
  )
  if (!openCheck.ok) {
    return { success: false, error: openCheck.error }
  }

  const { data: updated, error } = await createServiceClient()
    .from('classes')
    .update(parsed.data)
    .eq('id', classId)
    .select('id')
    .single()

  if (error || !updated) {
    console.error('[updateClassAction]', error)
    return { success: false, error: 'Erro ao atualizar turma.' }
  }

  await logAudit({
    actorId:    authUser.id,
    action:     'class.updated',
    entityType: 'classes',
    entityId:   classId,
    oldValues:  old ?? undefined,
    newValues:  parsed.data as Record<string, unknown>,
  })

  revalidatePath('/admin/turmas')
  revalidatePath('/admin/cursos')
  revalidatePath('/assistente/turmas')
  return { success: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// Atribuir instrutor à turma (admin / assistente)
// ─────────────────────────────────────────────────────────────
export async function assignClassInstructorAction(
  classId: string,
  instructorId: string | null,
): Promise<ActionResult> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }
  requireAdminOrAssistant(authUser.role)

  const supabase = await createClient()
  const { data: old } = await supabase.from('classes').select('*').eq('id', classId).single()
  if (!old) return { success: false, error: 'Turma não encontrada.' }

  if (instructorId) {
    const { data: instructor } = await createServiceClient()
      .from('profiles')
      .select('id, role, status')
      .eq('id', instructorId)
      .single()

    if (!instructor || instructor.status !== 'active') {
      return { success: false, error: 'Instrutor inválido ou inativo.' }
    }

    if (!['instructor', 'admin', 'assistant'].includes(instructor.role)) {
      return { success: false, error: 'O usuário selecionado não pode ser instrutor.' }
    }
  }

  const { data: updated, error } = await createServiceClient()
    .from('classes')
    .update({ instructor_id: instructorId })
    .eq('id', classId)
    .select('id')
    .single()

  if (error || !updated) {
    console.error('[assignClassInstructorAction]', error)
    return { success: false, error: 'Erro ao atribuir instrutor.' }
  }

  await logAudit({
    actorId:    authUser.id,
    action:     'class.updated',
    entityType: 'classes',
    entityId:   classId,
    oldValues:  { instructor_id: old.instructor_id },
    newValues:  { instructor_id: instructorId },
  })

  revalidatePath('/admin/turmas')
  revalidatePath('/assistente/turmas')
  revalidatePath('/instrutor/turmas')
  revalidatePath(`/instrutor/turmas/${classId}`)

  return { success: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// Criar sessão de aula
// ─────────────────────────────────────────────────────────────
export async function createClassSessionAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }
  requireAdminOrAssistant(authUser.role)

  const parsed = classSessionSchema.safeParse({
    ...Object.fromEntries(formData),
    start_time: formData.get('start_time') || null,
    end_time:   formData.get('end_time') || null,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()
  const { data: session, error } = await supabase
    .from('class_sessions')
    .insert(parsed.data)
    .select('id')
    .single()

  if (error) return { success: false, error: 'Erro ao criar sessão.' }

  revalidatePath('/admin/turmas')
  return { success: true, data: { id: session.id } }
}
