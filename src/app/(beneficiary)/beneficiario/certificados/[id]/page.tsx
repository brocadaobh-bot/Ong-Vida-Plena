import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getAuthUser } from '@/lib/auth/session'
import { getCertificateById } from '@/server/queries/certificates'
import { CertificateDocument } from '@/components/certificates/CertificateDocument'
import { CertificatePrintButton } from '@/components/certificates/CertificatePrintButton'
import { Button } from '@/components/ui/Button'

type CertificateDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function CertificateDetailPage({ params }: CertificateDetailPageProps) {
  const { id } = await params
  const user = await getAuthUser()
  const certificate = await getCertificateById(id, user!.id)

  if (!certificate) notFound()

  return (
    <div className="certificate-page space-y-6 pb-10">
      <div className="certificate-toolbar flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/beneficiario/certificados">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Voltar aos certificados
          </Button>
        </Link>
        <CertificatePrintButton />
      </div>

      <CertificateDocument certificate={certificate} />
    </div>
  )
}
