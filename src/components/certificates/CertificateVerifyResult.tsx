import Link from 'next/link'
import { Award, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  formatCertificateDate,
  formatWorkloadHours,
} from '@/lib/certificates/format'
import type { VerifiedCertificate } from '@/types/domain'

type CertificateVerifyResultProps = {
  result: VerifiedCertificate
  backHref?: string
  backLabel?: string
}

const ERROR_MESSAGES: Record<Extract<VerifiedCertificate, { valid: false }>['error'], string> = {
  invalid_code: 'Informe um código válido (ex.: VP-2026-XXXXXXXX).',
  not_found:    'Nenhum certificado encontrado com este código. Confira se digitou corretamente.',
}

export function CertificateVerifyResult({
  result,
  backHref = '/',
  backLabel = 'Voltar ao início',
}: CertificateVerifyResultProps) {
  if (!result.valid) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
            <XCircle className="h-6 w-6 text-destructive" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Certificado não encontrado</h2>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {ERROR_MESSAGES[result.error]}
            </p>
          </div>
        </div>
      </Card>
    )
  }

  const workload = formatWorkloadHours(result.workload_hours)

  return (
    <Card className="overflow-hidden border-primary-200 dark:border-primary-800/50">
      <div className="border-b border-primary-100 bg-primary-50/80 px-6 py-4 dark:border-primary-900/50 dark:bg-primary-950/30">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-white shadow-soft-sm">
            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300">
              Certificado autêntico
            </p>
            <p className="text-xs text-muted-foreground">
              Emitido pela ONG Vida Plena · Plataforma Vida Plena
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary-600 dark:text-primary-400" aria-hidden="true" />
          Documento verificado com sucesso. Os dados abaixo correspondem ao registro oficial.
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Participante
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">{result.beneficiary_name}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Curso
              </p>
              <p className="mt-1 font-medium text-foreground">{result.course_title}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Turma
              </p>
              <p className="mt-1 font-medium text-foreground">{result.class_name}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Data de emissão
              </p>
              <p className="mt-1 font-medium text-foreground">
                {formatCertificateDate(result.issued_at)}
              </p>
            </div>
            {workload && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Carga horária
                </p>
                <p className="mt-1 font-medium text-foreground">{workload}</p>
              </div>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Código de verificação
            </p>
            <p className="mt-1 font-mono text-sm font-semibold text-foreground">
              {result.certificate_code}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href={backHref}>
            <Button variant="secondary" size="sm">{backLabel}</Button>
          </Link>
          <Link href="/verificar-certificado">
            <Button variant="ghost" size="sm" leftIcon={<Award className="h-4 w-4" />}>
              Verificar outro
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}
