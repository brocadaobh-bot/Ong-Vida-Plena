import Link from 'next/link'
import { Award, Sparkles } from 'lucide-react'
import type { CourseCertificate } from '@/types/domain'
import {
  formatCertificateDate,
  formatWorkloadHours,
} from '@/lib/certificates/format'
import { cn } from '@/lib/utils/cn'

type CertificateDocumentProps = {
  certificate: CourseCertificate
  compact?: boolean
}

export function CertificateDocument({ certificate, compact = false }: CertificateDocumentProps) {
  const workload = formatWorkloadHours(certificate.workload_hours)
  const issuedLabel = formatCertificateDate(certificate.issued_at)

  return (
    <div
      className={cn(
        'certificate-document relative mx-auto overflow-hidden shadow-soft-lg print:shadow-none',
        'bg-[#fafbf9] text-[#111827]',
        'dark:bg-[#121a14] dark:text-[#eef2ea]',
        compact ? 'max-w-2xl rounded-2xl' : 'max-w-4xl rounded-3xl',
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          'cert-gradient pointer-events-none absolute inset-0 print:hidden',
          'bg-[radial-gradient(circle_at_top_right,_rgba(22,101,52,0.1),_transparent_45%),radial-gradient(circle_at_bottom_left,_rgba(37,99,235,0.08),_transparent_40%)]',
          'dark:bg-[radial-gradient(circle_at_top_right,_rgba(74,222,128,0.12),_transparent_45%),radial-gradient(circle_at_bottom_left,_rgba(96,165,250,0.1),_transparent_40%)]',
        )}
      />

      <div
        className={cn(
          'cert-border-outer relative m-3 rounded-2xl border-[3px] border-double sm:m-4',
          'border-primary-600 dark:border-primary-400/70',
          compact ? 'p-6 sm:p-8' : 'p-8 sm:p-12',
        )}
      >
        <div
          aria-hidden="true"
          className={cn(
            'cert-border-inner absolute inset-3 rounded-xl border',
            'border-primary-400/80 dark:border-primary-500/45',
          )}
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div
            className={cn(
              'cert-logo mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-soft-sm print:shadow-none',
              'bg-primary-600 text-white dark:bg-primary-500',
            )}
          >
            <span className="text-lg font-bold tracking-wide">VP</span>
          </div>

          <p
            className={cn(
              'cert-brand text-[11px] font-semibold uppercase tracking-[0.35em]',
              'text-primary-800 dark:text-primary-300',
            )}
          >
            Plataforma Vida Plena
          </p>
          <p
            className={cn(
              'cert-muted mt-1 text-xs uppercase tracking-[0.25em]',
              'text-[#4b5563] dark:text-[#a8b4a0]',
            )}
          >
            ONG Vida Plena · Educação e Capacitação
          </p>

          <div
            className={cn(
              'cert-icon-row my-5 flex items-center gap-3',
              'text-primary-700 dark:text-primary-400',
            )}
          >
            <span className="cert-divider h-px w-12 bg-current" aria-hidden="true" />
            <Award className="h-5 w-5" aria-hidden="true" />
            <span className="cert-divider h-px w-12 bg-current" aria-hidden="true" />
          </div>

          <h1
            className={cn(
              'cert-title font-serif font-bold text-[#111827] dark:text-[#f4f7f0]',
              compact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl',
            )}
          >
            Certificado de Conclusão
          </h1>

          <p
            className={cn(
              'cert-body mt-4 max-w-xl text-sm leading-relaxed sm:text-base',
              'text-[#374151] dark:text-[#c5cfc0]',
            )}
          >
            Certificamos que
          </p>

          <p
            className={cn(
              'cert-name mt-2 font-serif font-bold text-primary-900 dark:text-primary-300',
              compact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-[2.2rem]',
            )}
          >
            {certificate.beneficiary_name}
          </p>

          <p
            className={cn(
              'cert-body mt-5 max-w-2xl text-sm leading-relaxed sm:text-base',
              'text-[#374151] dark:text-[#c5cfc0]',
            )}
          >
            concluiu com aproveitamento o curso
          </p>

          <p
            className={cn(
              'cert-course mt-2 font-semibold text-[#111827] dark:text-[#f0f4eb]',
              compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl',
            )}
          >
            {certificate.course_title}
          </p>

          <p
            className={cn(
              'cert-muted mt-2 text-sm text-[#4b5563] dark:text-[#9fb09a]',
            )}
          >
            Turma: {certificate.class_name}
          </p>

          {workload && (
            <div
              className={cn(
                'cert-badge mt-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold',
                'border-primary-300 bg-primary-50 text-primary-950',
                'dark:border-primary-500/50 dark:bg-primary-950/60 dark:text-primary-100',
              )}
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Carga horária: {workload}
            </div>
          )}

          <p
            className={cn(
              'cert-body mt-8 max-w-lg text-sm leading-relaxed text-[#374151] dark:text-[#c5cfc0]',
            )}
          >
            Emitido em{' '}
            <strong className="cert-strong font-bold text-[#111827] dark:text-[#e2eadc]">
              {issuedLabel}
            </strong>
            , pela plataforma digital da ONG Vida Plena, reconhecendo a participação e o
            cumprimento dos requisitos do programa.
          </p>

          <div className="mt-10 grid w-full max-w-md grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
            <div className="text-center">
              <div
                className={cn(
                  'cert-divider mx-auto mb-2 h-0.5 w-full max-w-[140px]',
                  'bg-[#6b7280] dark:bg-[#5f6f58]',
                )}
              />
              <p
                className={cn(
                  'cert-footer-label text-xs font-bold uppercase tracking-wide',
                  'text-[#374151] dark:text-[#d1dcc8]',
                )}
              >
                Plataforma Vida Plena
              </p>
              <p className="cert-muted mt-0.5 text-[11px] text-[#4b5563] dark:text-[#9fb09a]">
                Certificado digital
              </p>
            </div>
            <div className="text-center">
              <div
                className={cn(
                  'cert-divider mx-auto mb-2 h-0.5 w-full max-w-[140px]',
                  'bg-[#6b7280] dark:bg-[#5f6f58]',
                )}
              />
              <p
                className={cn(
                  'cert-footer-label text-xs font-bold uppercase tracking-wide',
                  'text-[#374151] dark:text-[#d1dcc8]',
                )}
              >
                Código de verificação
              </p>
              <p
                className={cn(
                  'cert-code mt-0.5 font-mono text-[11px] font-semibold',
                  'text-[#111827] dark:text-[#e2eadc]',
                )}
              >
                {certificate.certificate_code}
              </p>
              <p
                className={cn(
                  'cert-integrity-note mt-3 text-[10px] leading-snug',
                  'text-[#6b7280] dark:text-[#9ca89a]',
                )}
              >
                Nome registrado na emissão do certificado. Documento autenticado pela ONG Vida Plena.
              </p>
              <Link
                href={`/verificar-certificado?codigo=${encodeURIComponent(certificate.certificate_code)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'cert-verify-link mt-2 inline-block text-[10px] font-medium underline underline-offset-2',
                  'text-primary-700 dark:text-primary-300 print:text-[#166534]',
                )}
              >
                Verificar autenticidade online
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
