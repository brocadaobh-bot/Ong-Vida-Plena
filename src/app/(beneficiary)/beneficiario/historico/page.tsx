import Link from 'next/link'
import { getAuthUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { getBeneficiaryCertificates } from '@/server/queries/certificates'
import { Card } from '@/components/ui/Card'
import { EnrollmentStatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { History, CheckCircle, Award } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function HistoricoPage() {
  const user     = await getAuthUser()
  const supabase = await createClient()

  const { data: completed } = await supabase
    .from('enrollments')
    .select('*, classes(id, name, start_date, end_date, courses(title, category, workload_hours))')
    .eq('beneficiary_id', user!.id)
    .in('status', ['completed', 'cancelled', 'dropped'])
    .order('enrolled_at', { ascending: false })

  const certificates = await getBeneficiaryCertificates(user!.id)
  const certificateByEnrollment = new Map(
    certificates.map(c => [c.enrollment_id, c.id]),
  )
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Histórico de Cursos</h1>
        <p className="text-muted-foreground">Registro de todos os cursos que você participou.</p>
      </div>

      <Card>
        {!completed || completed.length === 0 ? (
          <div className="py-12 text-center">
            <History className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">Seu histórico está vazio por enquanto.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {completed.map((enrollment: any) => (
              <div key={enrollment.id} className="inset-box">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      enrollment.status === 'completed'
                        ? 'bg-green-100 dark:bg-green-950/50'
                        : 'bg-muted'
                    }`}>
                      <CheckCircle className={`h-4 w-4 ${
                        enrollment.status === 'completed'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {enrollment.classes?.courses?.title}
                      </p>
                      <p className="text-sm text-muted-foreground">{enrollment.classes?.name}</p>
                      <div className="mt-1 text-xs text-muted-foreground/80">
                        {enrollment.classes?.start_date && (
                          <>
                            {format(new Date(enrollment.classes.start_date), 'MM/yyyy', { locale: ptBR })}
                            {enrollment.classes?.end_date && (
                              <> — {format(new Date(enrollment.classes.end_date), 'MM/yyyy', { locale: ptBR })}</>
                            )}
                          </>
                        )}
                        {enrollment.classes?.courses?.workload_hours && (
                          <> · {enrollment.classes.courses.workload_hours}h</>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <EnrollmentStatusBadge status={enrollment.status} />
                    {enrollment.status === 'completed' && certificateByEnrollment.has(enrollment.id) && (
                      <Link href={`/beneficiario/certificados/${certificateByEnrollment.get(enrollment.id)}`}>
                        <Button size="sm" variant="outline" leftIcon={<Award className="h-3.5 w-3.5" />}>
                          Certificado
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
