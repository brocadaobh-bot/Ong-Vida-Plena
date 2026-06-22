import Link from 'next/link'
import { getAuthUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { getCertifiedCourseIdsForBeneficiary } from '@/server/queries/certificates'
import {
  filterOpenClassesForBeneficiaryCatalog,
  type BeneficiaryOpenClassRow,
} from '@/lib/enrollments/beneficiary-courses-catalog'
import { ACTIVE_BENEFICIARY_ENROLLMENT_STATUSES } from '@/lib/enrollments/enrollment-status'
import { Card } from '@/components/ui/Card'
import { ClassStatusBadge, EnrollmentStatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EnrollButton } from './EnrollButton'
import { BookOpen, MapPin, Calendar, Users, Clock } from 'lucide-react'
import { COURSE_CATEGORY_LABELS } from '@/types/domain'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function CursosPage() {
  const user     = await getAuthUser()
  const supabase = await createClient()

  const { data: classes } = await supabase
    .from('classes')
    .select('*, courses(id, title, description, category, workload_hours)')
    .eq('status', 'open')
    .order('start_date')

  const { data: myEnrollments } = await supabase
    .from('enrollments')
    .select('class_id, status')
    .eq('beneficiary_id', user!.id)
    .in('status', ACTIVE_BENEFICIARY_ENROLLMENT_STATUSES)

  const enrollmentByClass = new Map(
    (myEnrollments ?? []).map(e => [e.class_id, e.status]),
  )

  const certifiedCourseIds = await getCertifiedCourseIdsForBeneficiary(user!.id)

  const availableClasses = filterOpenClassesForBeneficiaryCatalog(
    (classes ?? []) as BeneficiaryOpenClassRow[],
    certifiedCourseIds,
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cursos Disponíveis</h1>
        <p className="text-muted-foreground">Inscreva-se nas turmas abertas e comece a aprender.</p>
      </div>

      {!availableClasses.length ? (
        <Card>
          <div className="py-12 text-center">
            <BookOpen className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            {certifiedCourseIds.size > 0 && (classes?.length ?? 0) > 0 ? (
              <>
                <p className="text-muted-foreground">
                  Não há novos cursos para inscrição no momento.
                </p>
                <p className="mt-1 text-sm text-muted-foreground/80">
                  Cursos que você já concluiu aparecem em{' '}
                  <Link href="/beneficiario/certificados" className="font-medium text-primary-600 underline dark:text-primary-400">
                    Meus certificados
                  </Link>
                  .
                </p>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">Nenhum curso com inscrições abertas no momento.</p>
                <p className="mt-1 text-sm text-muted-foreground/80">Volte em breve para conferir novidades.</p>
              </>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {availableClasses.map(classItem => {
            const enrollmentStatus = enrollmentByClass.get(classItem.id)
            const isEnrolled = Boolean(enrollmentStatus)

            return (
              <Card key={classItem.id} className="flex flex-col">
                <div className="flex-1">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-600 dark:bg-primary-950/50 dark:text-primary-400">
                      {COURSE_CATEGORY_LABELS[classItem.courses?.category as keyof typeof COURSE_CATEGORY_LABELS] ?? 'Curso'}
                    </span>
                    <ClassStatusBadge status={classItem.status} />
                  </div>

                  <h3 className="font-semibold text-foreground">{classItem.courses?.title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{classItem.name}</p>

                  {classItem.courses?.description && (
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                      {classItem.courses.description}
                    </p>
                  )}

                  <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Início: {format(new Date(classItem.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </div>
                    {classItem.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {classItem.location}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      Vagas: {classItem.capacity}
                    </div>
                    {classItem.courses?.workload_hours && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {classItem.courses.workload_hours}h de carga horária
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  {isEnrolled ? (
                    <div className="space-y-2">
                      <EnrollmentStatusBadge status={enrollmentStatus!} />
                      <Button variant="secondary" className="w-full" disabled>
                        Já inscrito
                      </Button>
                    </div>
                  ) : (
                    <EnrollButton classId={classItem.id} />
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
