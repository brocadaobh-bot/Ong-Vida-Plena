import Link from 'next/link'
import { Award, ArrowLeft } from 'lucide-react'
import { CertificateVerifyForm } from '@/components/certificates/CertificateVerifyForm'
import { CertificateVerifyResult } from '@/components/certificates/CertificateVerifyResult'
import { PublicAuthNav, getPublicBackHref } from '@/components/layout/PublicAuthNav'
import { verifyCertificateByCode } from '@/server/queries/certificates'
import { Card } from '@/components/ui/Card'

type VerificarCertificadoPageProps = {
  searchParams: Promise<{ codigo?: string }>
}

export default async function VerificarCertificadoPage({
  searchParams,
}: VerificarCertificadoPageProps) {
  const { codigo } = await searchParams
  const code = codigo?.trim() ?? ''
  const result = code ? await verifyCertificateByCode(code) : null
  const back = await getPublicBackHref()

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Link
            href={back.href}
            className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Vida Plena"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 shadow-soft-sm">
              <span className="text-xs font-bold text-white">VP</span>
            </div>
            <span className="hidden text-lg font-bold sm:block">Vida Plena</span>
          </Link>
          <PublicAuthNav />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          href={back.href}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {back.label}
        </Link>

        <div className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 dark:border-primary-800/50 dark:bg-primary-950/40">
            <Award className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300">
              Verificação oficial
            </span>
          </div>
          <h1 className="text-2xl font-bold sm:text-3xl">Verificar certificado</h1>
          <p className="mt-2 max-w-xl text-muted-foreground leading-relaxed">
            Empregadores, escolas e terceiros podem confirmar aqui se um certificado da ONG Vida
            Plena é autêntico. Use o código impresso no documento.
          </p>
        </div>

        <Card className="mb-8 p-6">
          <CertificateVerifyForm initialCode={code} />
        </Card>

        {result && <CertificateVerifyResult result={result} backHref={back.href} backLabel={back.label} />}

        {!result && (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            Digite o código e clique em <strong className="text-foreground">Verificar</strong> para
            consultar a autenticidade do certificado.
          </div>
        )}
      </main>
    </div>
  )
}
