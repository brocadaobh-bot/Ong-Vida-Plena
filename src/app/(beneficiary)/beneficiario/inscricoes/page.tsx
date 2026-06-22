import Link from 'next/link'
import { getAuthUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { EnrollmentStatusBadge, ClassStatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DropEnrollmentButton } from '@/components/beneficiary/DropEnrollmentButton'
import { canBeneficiaryAccessClassEnrollment } from '@/lib/enrollments/access'
import { ClipboardList, Calendar, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { EnrollmentStatus } from '@/types/database'

export default async function InscricoesPage() {
  const user     = await getAuthUser()
  const supabase = await createClient()

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, classes(id, name, start_date, end_date, location, status, courses(title, category, workload_hours))')
    .eq('beneficiary_id', user!.id)
    .order('enrolled_at', { ascending: false })

  const active    = enrollments?.filter(e => ['confirmed','pending','waitlisted','recovery'].includes(e.status)) ?? []
  const historic  = enrollments?.filter(e => ['completed','cancelled','dropped'].includes(e.status)) ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Minhas Inscrições</h1>
        <p className="text-muted-foreground">Acompanhe o status de todas as suas inscrições.</p>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Ativas</h2>
        {active.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground">Nenhuma inscrição ativa.</p>
        ) : (
          <div className="space-y-3">
            {active.map((enrollment: any) => {
              const canAccess = canBeneficiaryAccessClassEnrollment(
                enrollment.status as EnrollmentStatus,
              )

              return (
                <div key={enrollment.id} className="inset-box">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">
                        {enrollment.classes?.courses?.title}
                      </p>
                      <p className="text-sm text-muted-foreground">{enrollment.classes?.name}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(enrollment.classes?.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                          {enrollment.classes?.end_date && (
                            <> — {format(new Date(enrollment.classes.end_date), 'dd/MM/yyyy', { locale: ptBR })}</>
                          )}
                        </span>
                        {enrollment.classes?.location && (
                          <span>{enrollment.classes.location}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-row flex-wrap items-center gap-2 sm:flex-col sm:items-end shrink-0">
                      {enrollment.classes?.status && (
                        <ClassStatusBadge status={enrollment.classes.status} />
                      )}
                      <EnrollmentStatusBadge status={enrollment.status} />
                      <DropEnrollmentButton
                        enrollmentId={enrollment.id}
                        courseTitle={enrollment.classes?.courses?.title ?? 'Curso'}
                        status={enrollment.status as EnrollmentStatus}
                      />
                      {canAccess ? (
                        <Link href={`/beneficiario/inscricoes/${enrollment.classes?.id}`}>
                          <Button size="sm" variant="secondary" leftIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                            Acessar
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled
                          title="Disponível após confirmação da inscrição pela equipe"
                        >
                          Aguardando confirmação
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground/80">
                    Inscrito em {format(new Date(enrollment.enrolled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {historic.length > 0 && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Histórico</h2>
          <div className="space-y-2">
            {historic.map((enrollment: any) => {
              const canAccess = canBeneficiaryAccessClassEnrollment(
                enrollment.status as EnrollmentStatus,
              )

              return (
                <div key={enrollment.id} className="list-item-muted">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {enrollment.classes?.courses?.title} — {enrollment.classes?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(enrollment.enrolled_at), 'dd/MM/yyyy', { locale: ptBR })}
                      {enrollment.cancelled_at && (
                        <> · Cancelado em {format(new Date(enrollment.cancelled_at), 'dd/MM/yyyy', { locale: ptBR })}</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <EnrollmentStatusBadge status={enrollment.status} />
                    {canAccess && (
                      <Link href={`/beneficiario/inscricoes/${enrollment.classes?.id}`}>
                        <Button size="sm" variant="ghost">Acessar</Button>
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {(!enrollments || enrollments.length === 0) && (
        <Card>
          <div className="py-12 text-center">
            <ClipboardList className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">Você ainda não possui inscrições.</p>
          </div>
        </Card>
      )}
    </div>
  )
}
