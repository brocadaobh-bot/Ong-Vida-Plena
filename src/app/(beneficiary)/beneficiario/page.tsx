import { getAuthUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { getMyPlatformRating } from '@/server/queries/public-stats'
import { getCertificateCount } from '@/server/queries/certificates'
import { PlatformRatingForm } from '@/components/platform/PlatformRatingForm'
import { Card, StatCard } from '@/components/ui/Card'
import { EnrollmentStatusBadge, ClassStatusBadge } from '@/components/ui/Badge'
import { BookOpen, ClipboardList, CheckCircle, Clock, Award } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { COURSE_CATEGORY_LABELS } from '@/types/domain'
import { canBeneficiaryAccessClassEnrollment } from '@/lib/enrollments/access'
import type { EnrollmentStatus } from '@/types/database'

export default async function BeneficiarioDashboard() {
  const user     = await getAuthUser()
  const supabase = await createClient()
  const myRating = await getMyPlatformRating(user!.id)
  const certificateCount = await getCertificateCount(user!.id)

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, classes(id, name, start_date, status, courses(title, category))')
    .eq('beneficiary_id', user!.id)
    .order('enrolled_at', { ascending: false })
    .limit(5)

  const confirmed  = enrollments?.filter(e => e.status === 'confirmed').length  ?? 0
  const completed  = enrollments?.filter(e => e.status === 'completed').length  ?? 0
  const pending    = enrollments?.filter(e => e.status === 'pending').length    ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Olá, {user!.full_name.split(' ')[0]}! 👋
        </h1>
        <p className="text-muted-foreground">Acompanhe seus cursos e atividades.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard title="Inscrições Ativas" value={confirmed} icon={ClipboardList} />
        <StatCard title="Cursos Concluídos" value={completed} icon={CheckCircle} />
        <StatCard title="Certificados" value={certificateCount} icon={Award} />
        <StatCard title="Aguardando Confirmação" value={pending} icon={Clock} />
      </div>

      {certificateCount > 0 && (
        <Card className="border-primary-200 bg-primary-50/50 p-5 dark:border-primary-900/50 dark:bg-primary-950/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-foreground">Seus certificados digitais estão prontos</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Você tem {certificateCount} certificado{certificateCount === 1 ? '' : 's'} disponível{certificateCount === 1 ? '' : 's'} para visualizar e imprimir.
              </p>
            </div>
            <Link href="/beneficiario/certificados">
              <Button size="sm" leftIcon={<Award className="h-4 w-4" />}>
                Ver certificados
              </Button>
            </Link>
          </div>
        </Card>
      )}

      <PlatformRatingForm existingRating={myRating} />

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Minhas Inscrições</h2>
          <Link href="/beneficiario/inscricoes">
            <Button variant="ghost" size="sm">Ver todas</Button>
          </Link>
        </div>

        {!enrollments || enrollments.length === 0 ? (
          <div className="py-8 text-center">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">Você ainda não possui inscrições.</p>
            <Link href="/beneficiario/cursos" className="mt-3 inline-block">
              <Button size="sm">Explorar cursos</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {enrollments.map((enrollment: any) => {
              const canAccess = canBeneficiaryAccessClassEnrollment(
                enrollment.status as EnrollmentStatus,
              )
              const inner = (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{enrollment.classes?.courses?.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {enrollment.classes?.name} ·{' '}
                      {enrollment.classes?.courses?.category
                        ? COURSE_CATEGORY_LABELS[enrollment.classes.courses.category as keyof typeof COURSE_CATEGORY_LABELS]
                        : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {enrollment.classes?.status && (
                      <ClassStatusBadge status={enrollment.classes.status} />
                    )}
                    <EnrollmentStatusBadge status={enrollment.status} />
                  </div>
                </div>
              )

              if (!canAccess) {
                return (
                  <div key={enrollment.id} className="list-item-muted opacity-90">
                    {inner}
                  </div>
                )
              }

              return (
                <Link
                  key={enrollment.id}
                  href={`/beneficiario/inscricoes/${enrollment.classes?.id}`}
                  className="list-item-interactive block"
                >
                  {inner}
                </Link>
              )
            })}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Ações Rápidas</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/beneficiario/cursos">
            <div className="quick-action-primary">
              <BookOpen className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              <div>
                <p className="quick-action-title">Ver cursos disponíveis</p>
                <p className="quick-action-desc">Inscreva-se em novos cursos</p>
              </div>
            </div>
          </Link>
          <Link href="/beneficiario/certificados">
            <div className="quick-action-secondary">
              <Award className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              <div>
                <p className="quick-action-title">Meus certificados</p>
                <p className="quick-action-desc">Certificados digitais de conclusão</p>
              </div>
            </div>
          </Link>
          <Link href="/beneficiario/lgpd">
            <div className="quick-action-secondary">
              <CheckCircle className="h-6 w-6 text-muted-foreground" />
              <div>
                <p className="quick-action-title">Gerenciar meus dados</p>
                <p className="quick-action-desc">LGPD — solicitar correção ou exclusão</p>
              </div>
            </div>
          </Link>
        </div>
      </Card>
    </div>
  )
}
