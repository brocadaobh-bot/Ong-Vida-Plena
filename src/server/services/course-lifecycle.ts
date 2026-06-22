import type { SupabaseClient } from '@supabase/supabase-js'
import { getAppSetting } from '@/lib/settings/app-settings.server'
import { logAudit } from '@/server/services/audit'
import type { Database } from '@/types/database'

type Supabase = SupabaseClient<Database>

function formatClassName(courseTitle: string): string {
  const year = new Date().getFullYear()
  const month = new Date().toLocaleString('pt-BR', { month: 'long' })
  return `${courseTitle} — Turma ${month}/${year}`
}

function defaultStartDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().slice(0, 10)
}

/**
 * Garante uma turma com inscrições abertas quando o curso está ativo.
 * Não duplica se já existir turma aberta para o mesmo curso.
 */
export async function ensureOpenClassForActiveCourse(
  supabase: Supabase,
  params: {
    courseId:    string
    courseTitle: string
    actorId:     string
  },
): Promise<{ created: boolean; classId?: string }> {
  const { courseId, courseTitle, actorId } = params

  const { data: openClass } = await supabase
    .from('classes')
    .select('id')
    .eq('course_id', courseId)
    .eq('status', 'open')
    .limit(1)
    .maybeSingle()

  if (openClass) {
    return { created: false, classId: openClass.id }
  }

  const capacity = await getAppSetting('max_class_capacity', 50)
  const startDate = defaultStartDate()

  const classPayload = {
    course_id:            courseId,
    name:                 formatClassName(courseTitle),
    start_date:           startDate,
    end_date:             null,
    capacity:             capacity,
    location:             null,
    schedule_description: 'Turma criada automaticamente ao ativar o curso. Inscrições abertas.',
    status:               'open' as const,
    instructor_id:        null,
  }

  const { data: classItem, error } = await supabase
    .from('classes')
    .insert(classPayload)
    .select('id')
    .single()

  if (error || !classItem) {
    console.error('ensureOpenClassForActiveCourse error:', error)
    return { created: false }
  }

  await logAudit({
    actorId,
    action:     'class.created',
    entityType: 'classes',
    entityId:   classItem.id,
    newValues:  { ...classPayload, auto_created: true },
  })

  return { created: true, classId: classItem.id }
}
