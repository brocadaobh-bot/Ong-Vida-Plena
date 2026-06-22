import Link from 'next/link'
import { Award, ArrowRight, GraduationCap } from 'lucide-react'
import { getAuthUser } from '@/lib/auth/session'
import { getBeneficiaryCertificates } from '@/server/queries/certificates'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { formatCertificateDate, formatWorkloadHours } from '@/lib/certificates/format'

export default async function CertificadosPage() {
  const user = await getAuthUser()
  const certificates = await getBeneficiaryCertificates(user!.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meus Certificados</h1>
        <p className="mt-1 text-muted-foreground">
          Certificados digitais emitidos automaticamente ao concluir e ser aprovado(a) em um curso.
        </p>
      </div>

      <Alert variant="warning">
        <p className="text-sm leading-relaxed">
          O nome no certificado é registrado na <strong>conclusão do curso</strong> e não pode ser
          alterado pelo usuário, para garantir a autenticidade do documento.
        </p>
        <p className="mt-2 text-sm leading-relaxed">
          Se houver erro no nome, solicite correção em{' '}
          <Link href="/beneficiario/lgpd" className="font-medium underline underline-offset-2">
            Meus Dados (LGPD)
          </Link>{' '}
          — a administração valida antes de corrigir.
        </p>
        <p className="mt-2 text-sm leading-relaxed">
          Terceiros podem confirmar a autenticidade em{' '}
          <Link href="/verificar-certificado" className="font-medium underline underline-offset-2">
            Verificar certificado
          </Link>
          .
        </p>
      </Alert>

      {certificates.length === 0 ? (
        <Card className="py-14 text-center">
          <Award className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
          <h2 className="text-lg font-semibold text-foreground">Nenhum certificado ainda</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
            Quando você concluir um curso e for aprovado(a) pelo instrutor, seu certificado digital
            aparecerá aqui automaticamente.
          </p>
          <Link href="/beneficiario/cursos" className="mt-6 inline-block">
            <Button size="sm" leftIcon={<GraduationCap className="h-4 w-4" />}>
              Ver cursos disponíveis
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {certificates.map(certificate => {
            const workload = formatWorkloadHours(certificate.workload_hours)

            return (
              <Link
                key={certificate.id}
                href={`/beneficiario/certificados/${certificate.id}`}
                className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
              >
                <Card className="h-full p-5 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-soft-md">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-950/40">
                    <Award className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h2 className="font-semibold text-foreground leading-snug line-clamp-2">
                    {certificate.course_title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                    {certificate.class_name}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{formatCertificateDate(certificate.issued_at)}</span>
                    {workload && <span>· {workload}</span>}
                  </div>
                  <p className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400">
                    Ver certificado
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </p>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
