import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { getOwnProfileRow } from '@/lib/profile/get-own-profile'

export default async function InstrutorPerfilPage() {
  const profile = await getOwnProfileRow()
  if (!profile) redirect('/login')

  return <ProfileForm profile={profile} />
}
