import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { ClassStatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EditClassButton } from '@/components/admin/EditClassButton'
import { AssignInstructorButton } from '@/components/admin/AssignInstructorButton'
import { ClassInfoManager } from '@/components/class-info/ClassInfoManager'
import { CompleteClassButton } from '@/components/class/CompleteClassButton'
import { TurmasArchivedSection } from '@/components/admin/TurmasArchivedSection'
import { MultipleOpenClassesBanner } from '@/components/admin/MultipleOpenClassesBanner'
import { AdminFilterBar, AdminNavLink } from '@/components/admin/AdminFilterBar'
import { CourseReopenBanner } from '@/components/admin/CourseEnrollmentActions'
import {
  aggregateClassesByCourse,
  emptyClassStatusCounts,
} from '@/lib/classes/course-class-counts'
import {
  buildTurmasAdminFilters,
  isValidClassStatusFilter,
} from '@/lib/classes/turmas-filter'
import {
  isActiveClassStatus,
  isArchivedClassStatus,
} from '@/lib/classes/instructor-class-groups'
import {
  courseHasMultipleOpenClasses,
  findCoursesWithMultipleOpenClasses,
} from '@/lib/classes/open-class-policy'
import { sortClassesForAdminDisplay } from '@/lib/classes/sort-classes-display'
import { courseNeedsEnrollmentReopen } from '@/lib/courses/enrollment-availability'
import type { CourseStatus } from '@/types/database'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function TurmasAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ course_id?: string; status?: string }>
}) {
  const { course_id: courseId, status: statusParam } = await searchParams
  const statusFilter = isValidClassStatusFilter(statusParam) ? statusParam : undefined
  const supabase = await createClient()

  let classesQuery = supabase
    .from('classes')
    .select('*, courses(id, title), profiles!instructor_id(full_name)')
    .order('start_date', { ascending: false })

  if (courseId) {
    classesQuery = classesQuery.eq('course_id', courseId)
  }

  if (statusFilter) {
    classesQuery = classesQuery.eq('status', statusFilter)
  }

  const [
    { data: classes },
    { data: courses },
    { data: instructors },
    { data: enrollments },
    { data: filteredCourse },
    { data: courseClassesForCounts },
  ] = await Promise.all([
    classesQuery,
    supabase.from('courses').select('id, title').order('title'),
    supabase
      .from('profiles')
      .select('id, full_name')
      .in('role', ['instructor', 'admin', 'assistant'])
      .eq('status', 'active')
      .order('full_name'),
    supabase.from('enrollments').select('class_id').not('status', 'eq', 'cancelled'),
    courseId
      ? supabase.from('courses').select('id, title, status').eq('id', courseId).maybeSingle()
      : Promise.resolve({ data: null }),
    courseId
      ? supabase.from('classes').select('id, course_id, status').eq('course_id', courseId)
      : Promise.resolve({ data: null }),
  ])

  const classCountByCourse = aggregateClassesByCourse(
    (courseClassesForCounts ?? []).map(c => ({ course_id: c.course_id, status: c.status })),
  )
  const filteredCourseCounts = courseId
    ? classCountByCourse.get(courseId) ?? { total: 0, byStatus: emptyClassStatusCounts() }
    : null
  const showReopenBanner =
    filteredCourse?.title &&
    filteredCourseCounts &&
    courseNeedsEnrollmentReopen(
      filteredCourse.status as CourseStatus,
      filteredCourseCounts.byStatus,
    )

  const enrollmentCount = new Map<string, number>()
  enrollments?.forEach(e => {
    enrollmentCount.set(e.class_id, (enrollmentCount.get(e.class_id) ?? 0) + 1)
  })

  const filters = buildTurmasAdminFilters({
    courseId,
    courseTitle: filteredCourse?.title,
    status: statusFilter,
  })

  const novaHref = courseId ? `/admin/turmas/novo?course_id=${courseId}` : '/admin/turmas/novo'

  const activeClasses = sortClassesForAdminDisplay(
    (classes ?? []).filter(c => isActiveClassStatus(c.status)),
  )
  const archivedClasses = sortClassesForAdminDisplay(
    (classes ?? []).filter(c => isArchivedClassStatus(c.status)),
  )
  const showClassSections =
    !statusFilter && activeClasses.length > 0 && archivedClasses.length > 0

  const multipleOpenCourses =
    courseId && filteredCourse && filteredCourseCounts &&
    courseHasMultipleOpenClasses(filteredCourseCounts.byStatus)
      ? [{
          courseId,
          courseTitle: filteredCourse.title,
          openCount: filteredCourseCounts.byStatus.open,
        }]
      : findCoursesWithMultipleOpenClasses(classes ?? [])

  function renderClassRow(cls: NonNullable<typeof classes>[number]) {
    return (
      <tr key={cls.id}>
        <td>
          <AdminNavLink href={`/admin/turmas?course_id=${cls.courses?.id}`}>
            {cls.courses?.title}
          </AdminNavLink>
        </td>
        <td className="cell-primary">{cls.name}</td>
        <td>{cls.profiles?.full_name ?? '—'}</td>
        <td className="text-xs whitespace-nowrap">
          {format(new Date(cls.start_date), 'dd/MM/yyyy', { locale: ptBR })}
        </td>
        <td>{cls.capacity}</td>
        <td>
          <AdminNavLink href={`/admin/inscricoes?class_id=${cls.id}`}>
            {enrollmentCount.get(cls.id) ?? 0}
          </AdminNavLink>
        </td>
        <td><ClassStatusBadge status={cls.status} /></td>
        <td>
          <div className="flex flex-wrap gap-1">
            <AssignInstructorButton
              classId={cls.id}
              className={cls.name}
              currentInstructorId={cls.instructor_id}
              currentInstructorName={cls.profiles?.full_name}
              instructors={instructors ?? []}
            />
            <EditClassButton
              classData={{
                id: cls.id,
                course_id: cls.course_id,
                instructor_id: cls.instructor_id,
                name: cls.name,
                start_date: cls.start_date,
                end_date: cls.end_date,
                capacity: cls.capacity,
                location: cls.location,
                schedule_description: cls.schedule_description,
                status: cls.status,
              }}
              courses={courses ?? []}
              instructors={instructors ?? []}
            />
            <ClassInfoManager classId={cls.id} triggerLabel="Avisos" />
            <CompleteClassButton
              classId={cls.id}
              classStatus={cls.status}
              size="sm"
              variant="ghost"
            />
            <Link href={`/admin/inscricoes?class_id=${cls.id}`}>
              <Button size="sm" variant="ghost">Inscrições</Button>
            </Link>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Turmas</h1>
          <p className="text-muted-foreground">
            Cada turma pertence a um curso. Abra inscrições e gerencie vagas e instrutores.
          </p>
        </div>
        <Link href={novaHref}>
          <Button leftIcon={<Plus className="h-4 w-4" />}>Nova Turma</Button>
        </Link>
      </div>

      <AdminFilterBar filters={filters} basePath="/admin/turmas" />

      <MultipleOpenClassesBanner
        courses={multipleOpenCourses}
        turmasBasePath="/admin/turmas"
      />

      {showReopenBanner && filteredCourse && courseId && (
        <CourseReopenBanner
          courseId={courseId}
          courseTitle={filteredCourse.title}
          courseStatus={filteredCourse.status}
        />
      )}

      <Card className="overflow-hidden p-0">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                {['Curso', 'Turma', 'Instrutor', 'Início', 'Vagas', 'Inscritos', 'Status', 'Ações'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!classes || classes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    {statusFilter || courseId
                      ? 'Nenhuma turma encontrada com os filtros selecionados.'
                      : 'Nenhuma turma cadastrada.'}{' '}
                    {!statusFilter && (
                      <>
                        <AdminNavLink href={novaHref}>Criar turma</AdminNavLink>
                        {courseId && (
                          <>
                            {' '}ou use <strong>Abrir inscrições</strong> na lista de cursos.
                          </>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ) : showClassSections ? (
                <>
                  {activeClasses.map(cls => renderClassRow(cls))}
                  <TurmasArchivedSection count={archivedClasses.length}>
                    {archivedClasses.map(cls => renderClassRow(cls))}
                  </TurmasArchivedSection>
                </>
              ) : (
                sortClassesForAdminDisplay(classes ?? []).map(cls => renderClassRow(cls))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
