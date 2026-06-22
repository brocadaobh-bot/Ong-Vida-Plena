import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { CourseStatusBadge } from '@/components/ui/Badge'
import { CourseClassSummary } from '@/components/admin/CourseClassSummary'
import { ReopenCourseEnrollmentsButton } from '@/components/admin/CourseEnrollmentActions'
import { aggregateClassesByCourse, emptyClassStatusCounts } from '@/lib/classes/course-class-counts'
import { courseNeedsEnrollmentReopen } from '@/lib/courses/enrollment-availability'
import { COURSE_CATEGORY_LABELS } from '@/types/domain'
import type { CourseStatus } from '@/types/database'

export default async function CursosAssistentePage() {
  const supabase = await createClient()

  const [{ data: courses }, { data: classes }] = await Promise.all([
    supabase.from('courses').select('*').neq('status', 'draft').order('title'),
    supabase.from('classes').select('id, course_id, status'),
  ])

  const classCountByCourse = aggregateClassesByCourse(classes ?? [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cursos</h1>
        <p className="text-muted-foreground">
          Consulte os cursos cadastrados. Quando uma turma encerra, use{' '}
          <strong className="text-foreground">Abrir inscrições</strong> para liberar nova turma
          sem recriar o curso.
        </p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                {['Título', 'Categoria', 'Turmas', 'Status', 'Ações'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!courses || courses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    Nenhum curso disponível.
                  </td>
                </tr>
              ) : (
                courses.map(c => {
                  const counts = classCountByCourse.get(c.id) ?? {
                    total: 0,
                    byStatus: emptyClassStatusCounts(),
                  }
                  const needsReopen = courseNeedsEnrollmentReopen(
                    c.status as CourseStatus,
                    counts.byStatus,
                  )
                  return (
                    <tr key={c.id}>
                      <td className="cell-primary">{c.title}</td>
                      <td>
                        {COURSE_CATEGORY_LABELS[c.category as keyof typeof COURSE_CATEGORY_LABELS]}
                      </td>
                      <td>
                        <CourseClassSummary
                          total={counts.total}
                          byStatus={counts.byStatus}
                          courseId={c.id}
                          turmasBasePath="/assistente/turmas"
                        />
                      </td>
                      <td><CourseStatusBadge status={c.status} /></td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {needsReopen && (
                            <ReopenCourseEnrollmentsButton
                              courseId={c.id}
                              courseTitle={c.title}
                            />
                          )}
                          <Link href={`/assistente/turmas?course_id=${c.id}`}>
                            <span className="inline-flex h-8 items-center rounded-lg px-3 text-xs font-medium text-foreground hover:bg-muted">
                              Turmas
                            </span>
                          </Link>
                          <Link href={`/assistente/inscricoes?course_id=${c.id}`}>
                            <span className="inline-flex h-8 items-center rounded-lg px-3 text-xs font-medium text-foreground hover:bg-muted">
                              Inscrições
                            </span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
