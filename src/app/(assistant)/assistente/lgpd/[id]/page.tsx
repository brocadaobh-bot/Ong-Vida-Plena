import { LgpdRequestDetailView } from '@/components/lgpd/LgpdRequestDetailView'

type AssistenteLgpdDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function AssistenteLgpdDetailPage({ params }: AssistenteLgpdDetailPageProps) {
  const { id } = await params
  return <LgpdRequestDetailView requestId={id} lgpdBasePath="/assistente/lgpd" />
}
