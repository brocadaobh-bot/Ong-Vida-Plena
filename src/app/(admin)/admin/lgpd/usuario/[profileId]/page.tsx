import { LgpdUserTicketsView } from '@/components/lgpd/LgpdUserTicketsView'

type LgpdUserPageProps = {
  params: Promise<{ profileId: string }>
}

export default async function AdminLgpdUserPage({ params }: LgpdUserPageProps) {
  const { profileId } = await params
  return (
    <LgpdUserTicketsView
      profileId={profileId}
      backHref="/admin/lgpd"
      detailBasePath="/admin/lgpd"
    />
  )
}
