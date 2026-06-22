import { notFound, redirect } from 'next/navigation'
import { EditBeneficiaryForm } from '@/components/beneficiaries/EditBeneficiaryForm'
import { getAuthUser } from '@/lib/auth/session'
import { getBeneficiaryById } from '@/server/queries/beneficiaries'
import { getBeneficiaryCertificates } from '@/server/queries/certificates'

type EditarBeneficiarioPageProps = {
  params: Promise<{ id: string }>
}

export default async function EditarBeneficiarioPage({ params }: EditarBeneficiarioPageProps) {
  const { id } = await params
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')
  if (authUser.role !== 'admin' && authUser.role !== 'assistant') redirect('/login')

  const beneficiary = await getBeneficiaryById(id)
  if (!beneficiary) notFound()

  const certificates = await getBeneficiaryCertificates(id)
  const backHref = authUser.role === 'admin' ? '/admin/beneficiarios' : '/assistente/beneficiarios'

  return (
    <EditBeneficiaryForm
      beneficiary={beneficiary}
      certificates={certificates}
      backHref={backHref}
    />
  )
}
