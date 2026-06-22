import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { CourseStatusBadge } from '@/components/ui/Badge'
import { CourseClassSummary } from '@/components/admin/CourseClassSummary'
import { aggregateClassesByCourse, emptyClassStatusCounts } from '@/lib/classes/course-class-counts'
import { courseNeedsEnrollmentReopen } from '@/lib/courses/enrollment-availability'
import { COURSE_CATEGORY_LABELS } from '@/types/domain'
import type { CourseStatus } from '@/types/database'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { NovoCursoButton } from './NovoCursoButton'
import { EditCourseButton } from './EditCourseButton'
import {
  DeleteCourseButton,
  ReopenCourseEnrollmentsButton,
} from '@/components/admin/CourseEnrollmentActions'

export default async function CursosAdminPage() {
  const supabase = await createClient()

  const [{ data: courses }, { data: classes }] = await Promise.all([
    supabase.from('courses').select('*').order('title'),
    supabase.from('classes').select('id, course_id, status'),
  ])

  const classCountByCourse = aggregateClassesByCourse(classes ?? [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cursos</h1>
          <p className="text-muted-foreground">
            O curso é o cadastro permanente. Quando uma turma encerra, use{' '}
            <strong className="text-foreground">Abrir inscrições</strong> para nova turma — sem recriar o curso.
          </p>
        </div>
        <NovoCursoButton />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                {['Título', 'Categoria', 'Carga Horária', 'Turmas', 'Status', 'Criado em', 'Ações'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!courses || courses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    Nenhum curso cadastrado.{' '}
                    <Link href="/admin/cursos/novo" className="font-medium text-primary-600 underline dark:text-primary-400">
                      Criar o primeiro curso
                    </Link>
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
                      <td>{c.workload_hours ? `${c.workload_hours}h` : '—'}</td>
                      <td>
                        <CourseClassSummary
                          total={counts.total}
                          byStatus={counts.byStatus}
                          courseId={c.id}
                          turmasBasePath="/admin/turmas"
                        />
                      </td>
                      <td><CourseStatusBadge status={c.status} /></td>
                      <td className="text-xs whitespace-nowrap">
                        {format(new Date(c.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td>
                        <div className="flex flex-wrap items-center gap-1">
                          <EditCourseButton
                            course={{
                              id: c.id,
                              title: c.title,
                              description: c.description,
                              category: c.category,
                              workload_hours: c.workload_hours,
                              requirements: c.requirements,
                              status: c.status,
                            }}
                          />
                          {needsReopen && (
                            <ReopenCourseEnrollmentsButton
                              courseId={c.id}
                              courseTitle={c.title}
                            />
                          )}
                          <Link href={`/admin/inscricoes?course_id=${c.id}`}>
                            <span className="inline-flex h-8 items-center rounded-lg px-3 text-xs font-medium text-foreground hover:bg-muted">
                              Inscrições
                            </span>
                          </Link>
                          <DeleteCourseButton courseId={c.id} courseTitle={c.title} />
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
