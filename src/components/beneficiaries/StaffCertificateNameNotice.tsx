import Link from 'next/link'
import { AlertTriangle, Award, Shield } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { formatCertificateDate } from '@/lib/certificates/format'
import type { CourseCertificate } from '@/types/domain'

type StaffCertificateNameNoticeProps = {
  certificates: CourseCertificate[]
  currentName: string
}

export function StaffCertificateNameNotice({
  certificates,
  currentName,
}: StaffCertificateNameNoticeProps) {
  if (certificates.length === 0) {
    return (
      <Alert variant="info">
        <p className="text-sm leading-relaxed">
          Este usuário ainda <strong>não possui certificados emitidos</strong>. O nome pode ser
          alterado livremente antes da conclusão de um curso.
        </p>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <Alert variant="warning">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div className="space-y-2 text-sm leading-relaxed">
            <p>
              Este usuário possui <strong>{certificates.length}</strong> certificado
              {certificates.length !== 1 ? 's' : ''} emitido{certificates.length !== 1 ? 's' : ''}.
              O beneficiário <strong>não pode</strong> alterar o próprio nome nem os documentos — apenas
              a equipe administrativa pode corrigir.
            </p>
            <p>
              Ao salvar um <strong>novo nome completo</strong>, todos os certificados serão
              atualizados automaticamente e a ação ficará registrada em auditoria.
            </p>
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" aria-hidden="true" />
              Nome atual no perfil e nos certificados: <strong>{currentName}</strong>
            </p>
          </div>
        </div>
      </Alert>

      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Award className="h-4 w-4 text-primary-600 dark:text-primary-400" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-foreground">Certificados emitidos</h3>
        </div>
        <ul className="space-y-2">
          {certificates.map(cert => (
            <li
              key={cert.id}
              className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm"
            >
              <p className="font-medium text-foreground">{cert.course_title}</p>
              <p className="text-xs text-muted-foreground">
                {cert.class_name} · {formatCertificateDate(cert.issued_at)} ·{' '}
                <span className="font-mono">{cert.certificate_code}</span>
              </p>
              {cert.name_corrected_at && (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                  Nome corrigido em {formatCertificateDate(cert.name_corrected_at)}
                </p>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Terceiros podem validar certificados em{' '}
          <Link
            href="/verificar-certificado"
            className="font-medium text-primary-600 underline underline-offset-2 dark:text-primary-400"
            target="_blank"
          >
            Verificar certificado
          </Link>
          .
        </p>
      </Card>
    </div>
  )
}
