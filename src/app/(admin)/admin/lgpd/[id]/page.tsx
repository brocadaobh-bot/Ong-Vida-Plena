import { LgpdRequestDetailView } from '@/components/lgpd/LgpdRequestDetailView'

type AdminLgpdDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function AdminLgpdDetailPage({ params }: AdminLgpdDetailPageProps) {
  const { id } = await params
  return <LgpdRequestDetailView requestId={id} lgpdBasePath="/admin/lgpd" />
}
