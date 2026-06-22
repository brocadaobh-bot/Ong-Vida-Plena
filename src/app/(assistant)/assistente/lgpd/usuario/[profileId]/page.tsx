import { LgpdUserTicketsView } from '@/components/lgpd/LgpdUserTicketsView'

type AssistenteLgpdUserPageProps = {
  params: Promise<{ profileId: string }>
}

export default async function AssistenteLgpdUserPage({ params }: AssistenteLgpdUserPageProps) {
  const { profileId } = await params
  return (
    <LgpdUserTicketsView
      profileId={profileId}
      backHref="/assistente/lgpd"
      detailBasePath="/assistente/lgpd"
    />
  )
}
