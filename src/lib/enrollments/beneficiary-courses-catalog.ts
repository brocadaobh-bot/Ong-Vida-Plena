import type { ClassStatus } from '@/types/database'

export type BeneficiaryOpenClassRow = {
  id: string
  name: string
  start_date: string
  end_date: string | null
  capacity: number
  location: string | null
  status: ClassStatus
  courses: {
    id: string
    title: string
    description: string | null
    category: string
    workload_hours: number | null
  } | null
}

/**
 * Turmas abertas visíveis ao beneficiário.
 * Oculta cursos já certificados; mantém cada turma aberta (mesmo curso, nomes diferentes).
 */
export function filterOpenClassesForBeneficiaryCatalog(
  classes: BeneficiaryOpenClassRow[],
  certifiedCourseIds: Set<string>,
): BeneficiaryOpenClassRow[] {
  return classes
    .filter(cls => cls.courses?.id && !certifiedCourseIds.has(cls.courses.id))
    .sort((a, b) => {
      const byCourse = (a.courses?.title ?? '').localeCompare(b.courses?.title ?? '', 'pt-BR')
      if (byCourse !== 0) return byCourse
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    })
}
