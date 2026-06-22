import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { BeneficiaryAdditionalProfileForm } from '@/components/profile/BeneficiaryAdditionalProfileForm'
import { CertificateNameNotice } from '@/components/certificates/CertificateNameNotice'
import { getOwnProfileRow } from '@/lib/profile/get-own-profile'
import { getAuthUser } from '@/lib/auth/session'
import { beneficiaryHasIssuedCertificates } from '@/server/queries/certificates'

export default async function PerfilPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const profile = await getOwnProfileRow()
  if (!profile) redirect('/login')

  const identityLocked = await beneficiaryHasIssuedCertificates(authUser.id)

  return (
    <div className="space-y-6">
      <CertificateNameNotice identityLocked={identityLocked} />
      <ProfileForm profile={profile} lockCertificateIdentity={identityLocked} />
      <BeneficiaryAdditionalProfileForm />
    </div>
  )
}
