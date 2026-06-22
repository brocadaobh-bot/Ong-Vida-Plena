import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { NovaInscricaoButton } from '@/components/admin/NovaInscricaoButton'
import { InscricoesGroupedList } from '@/components/admin/InscricoesGroupedList'
import { InscricoesByClassList } from '@/components/admin/InscricoesByClassList'
import { InscricoesViewTabs } from '@/components/admin/InscricoesViewTabs'
import { AdminFilterBar } from '@/components/admin/AdminFilterBar'
import { groupEnrollmentsByEmail } from '@/lib/enrollments/group-by-person'
import { groupEnrollmentsByClass } from '@/lib/enrollments/group-by-class'
import {
  buildInscricoesQueryString,
  fetchEnrollmentsList,
  isValidEnrollmentStatusFilter,
} from '@/lib/enrollments/inscricoes-query'
import { sortAlphabeticalPtBr } from '@/lib/utils/sort-ptbr'
import { ENROLLMENT_STATUS_LABELS } from '@/types/domain'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const BASE_PATH = '/assistente/inscricoes'

export default async function InscricoesAssistantPage({
  searchParams,
}: {
  searchParams: Promise<{
    class_id?: string
    beneficiary_id?: string
    course_id?: string
    q?: string
    status?: string
    view?: string
  }>
}) {
  const {
    class_id: classId,
    beneficiary_id: beneficiaryId,
    course_id: courseId,
    q: search,
    status: statusFilter,
    view: viewParam,
  } = await searchParams

  const supabase = await createClient()
  const view: 'class' | 'person' =
    statusFilter === 'pending' || viewParam === 'person' ? 'person' : 'class'

  const enrollments = await fetchEnrollmentsList(supabase, {
    classId,
    beneficiaryId,
    courseId,
    search,
    status: statusFilter,
  })

  const [
    { data: beneficiaries },
    { data: openClasses },
    classMeta,
    beneficiaryMeta,
    courseMeta,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'beneficiary')
      .eq('status', 'active')
      .order('full_name'),
    supabase
      .from('classes')
      .select('id, name, start_date, status, courses(title)')
      .in('status', ['open', 'in_progress', 'planned'])
      .order('start_date'),
    classId
      ? supabase
          .from('classes')
          .select('name, status, courses(title)')
          .eq('id', classId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    beneficiaryId
      ? supabase.from('profiles').select('full_name').eq('id', beneficiaryId).maybeSingle()
      : Promise.resolve({ data: null }),
    courseId
      ? supabase.from('courses').select('title').eq('id', courseId).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const groupedByPerson = groupEnrollmentsByEmail(enrollments)
  const groupedByClass = groupEnrollmentsByClass(enrollments)
  const totalEnrollments = enrollments.length

  const classOptions = sortAlphabeticalPtBr(
    (openClasses ?? []).map((c: {
      id: string
      name: string
      start_date: string
      courses: { title: string } | null
    }) => ({
      id: c.id,
      label: `${c.courses?.title} — ${c.name} (${format(new Date(c.start_date), 'dd/MM/yyyy', { locale: ptBR })})`,
    })),
    c => c.label,
  )

  const listParams = {
    classId,
    beneficiaryId,
    courseId,
    search,
    status: statusFilter,
  }

  const filters = [
    classMeta.data?.courses?.title
      ? {
          key: 'class',
          label: `Turma: ${classMeta.data.courses.title} — ${classMeta.data.name}`,
          value: classId!,
        }
      : null,
    beneficiaryMeta.data?.full_name
      ? {
          key: 'beneficiary',
          label: `Usuário: ${beneficiaryMeta.data.full_name}`,
          value: beneficiaryId!,
        }
      : null,
    courseMeta.data?.title
      ? { key: 'course', label: `Curso: ${courseMeta.data.title}`, value: courseId! }
      : null,
    isValidEnrollmentStatusFilter(statusFilter)
      ? {
          key: 'status',
          label: `Status: ${ENROLLMENT_STATUS_LABELS[statusFilter]}`,
          value: statusFilter,
        }
      : null,
    search?.trim()
      ? { key: 'q', label: `Busca: "${search.trim()}"`, value: search.trim() }
      : null,
  ].filter(Boolean) as { key: string; label: string; value: string }[]

  const pageTitle =
    statusFilter === 'pending' ? 'Aguardando Confirmação' : 'Inscrições'

  const pageDescription =
    classId && classMeta.data
      ? `${totalEnrollments} inscriç${totalEnrollments !== 1 ? 'ões' : 'ão'} na turma ${classMeta.data.name}${
          classMeta.data.status === 'completed' ? ' (encerrada)' : ''
        }.`
      : courseId && courseMeta.data
        ? `${totalEnrollments} inscriç${totalEnrollments !== 1 ? 'ões' : 'ão'} em ${groupedByClass.length} turma${groupedByClass.length !== 1 ? 's' : ''} do curso ${courseMeta.data.title}. Confira o nome da turma ao inscrever.`
        : statusFilter === 'pending'
        ? `${groupedByPerson.length} usuário${groupedByPerson.length !== 1 ? 's' : ''} aguardando confirmação · ${totalEnrollments} inscriç${totalEnrollments !== 1 ? 'ões' : 'ão'} em turmas abertas ou em andamento.`
        : view === 'class'
          ? `${groupedByClass.length} turma${groupedByClass.length !== 1 ? 's' : ''} ativa${groupedByClass.length !== 1 ? 's' : ''} · ${totalEnrollments} inscriç${totalEnrollments !== 1 ? 'ões' : 'ão'}.`
          : `${groupedByPerson.length} inscrito${groupedByPerson.length !== 1 ? 's' : ''} · ${totalEnrollments} inscriç${totalEnrollments !== 1 ? 'ões' : 'ão'} em turmas abertas ou em andamento.`

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
          <p className="text-muted-foreground">{pageDescription}</p>
        </div>
        <NovaInscricaoButton
          beneficiaries={beneficiaries ?? []}
          classes={classOptions}
          defaultClassId={classId}
          defaultBeneficiaryId={beneficiaryId}
        />
      </div>

      {statusFilter !== 'pending' && (
        <InscricoesViewTabs basePath={BASE_PATH} currentView={view} params={listParams} />
      )}

      <form method="get" action={BASE_PATH} className="flex flex-wrap gap-2">
        {classId && <input type="hidden" name="class_id" value={classId} />}
        {beneficiaryId && <input type="hidden" name="beneficiary_id" value={beneficiaryId} />}
        {courseId && <input type="hidden" name="course_id" value={courseId} />}
        {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
        <input type="hidden" name="view" value={view} />
        <input
          name="q"
          defaultValue={search ?? ''}
          placeholder="Buscar por nome, e-mail ou telefone..."
          className="input-base min-w-[220px] flex-1 max-w-lg"
        />
        {!statusFilter && (
          <select
            name="status"
            defaultValue=""
            className="input-base min-w-[160px]"
            aria-label="Filtrar por status"
          >
            <option value="">Todos os status</option>
            {Object.entries(ENROLLMENT_STATUS_LABELS)
              .filter(([value]) => value !== 'waitlisted')
              .map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        )}
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
        {(search || (statusFilter && statusFilter !== 'pending')) && (
          <Button type="button" variant="ghost" asChild>
            <Link
              href={`${BASE_PATH}${buildInscricoesQueryString({
                classId,
                beneficiaryId,
                courseId,
                view,
                status: statusFilter === 'pending' ? statusFilter : undefined,
              })}`}
            >
              Limpar busca
            </Link>
          </Button>
        )}
      </form>

      <AdminFilterBar filters={filters} basePath={`${BASE_PATH}${buildInscricoesQueryString({ view, status: statusFilter === 'pending' ? statusFilter : undefined })}`} />

      <Card className="overflow-hidden p-0">
        {view === 'class' ? (
          <InscricoesByClassList
            classes={groupedByClass}
            basePath={BASE_PATH}
            autoExpandAll={Boolean(courseId)}
          />
        ) : (
          <InscricoesGroupedList
            people={groupedByPerson}
            basePath={BASE_PATH}
            courseLinkBase={BASE_PATH}
          />
        )}
      </Card>
    </div>
  )
}
