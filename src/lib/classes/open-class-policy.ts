import type { SupabaseClient } from '@supabase/supabase-js'
import type { ClassStatusCounts } from '@/lib/classes/course-class-counts'
import type { Database } from '@/types/database'

export const ONE_OPEN_CLASS_PER_COURSE_MESSAGE =
  'Este curso já possui uma turma com inscrições abertas. Encerre a turma atual ou altere o status dela antes de abrir outra.'

export function courseHasMultipleOpenClasses(byStatus: ClassStatusCounts): boolean {
  return byStatus.open > 1
}

export type MultipleOpenCourseSummary = {
  courseId: string
  courseTitle: string
  openCount: number
}

export function findCoursesWithMultipleOpenClasses(
  classes: {
    course_id: string
    status: string
    courses?: { title?: string } | null
  }[],
): MultipleOpenCourseSummary[] {
  const byCourse = new Map<string, MultipleOpenCourseSummary>()

  for (const cls of classes) {
    if (cls.status !== 'open') continue

    const existing = byCourse.get(cls.course_id)
    if (existing) {
      existing.openCount += 1
      continue
    }

    byCourse.set(cls.course_id, {
      courseId: cls.course_id,
      courseTitle: cls.courses?.title ?? 'Curso',
      openCount: 1,
    })
  }

  return [...byCourse.values()].filter(c => c.openCount > 1)
}

export async function findOtherOpenClassForCourse(
  supabase: SupabaseClient<Database>,
  courseId: string,
  excludeClassId?: string,
) {
  let query = supabase
    .from('classes')
    .select('id, name')
    .eq('course_id', courseId)
    .eq('status', 'open')

  if (excludeClassId) {
    query = query.neq('id', excludeClassId)
  }

  return query.limit(1).maybeSingle()
}

export async function assertSingleOpenClassPerCourse(
  supabase: SupabaseClient<Database>,
  courseId: string,
  status: string,
  excludeClassId?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (status !== 'open') return { ok: true }

  const { data } = await findOtherOpenClassForCourse(supabase, courseId, excludeClassId)
  if (data) {
    return { ok: false, error: ONE_OPEN_CLASS_PER_COURSE_MESSAGE }
  }

  return { ok: true }
}
