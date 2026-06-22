import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getAuthUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { assertEnrolledInClass } from '@/lib/auth/class-access'
import { fetchClassInfoPanelAction } from '@/server/queries/class-info'
import { ClassInfoView } from '@/components/class-info/ClassInfoManager'
import { EnrollmentStatusBadge, ClassStatusBadge } from '@/components/ui/Badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function InscricaoDetalhePage({
  params,
}: {
  params: Promise<{ classId: string }>
}) {
  const { classId } = await params
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const access = await assertEnrolledInClass(authUser, classId)
  if (!access.ok) notFound()

  const supabase = await createClient()
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('status, enrolled_at, classes(status)')
    .eq('beneficiary_id', authUser.id)
    .eq('class_id', classId)
    .single()

  const result = await fetchClassInfoPanelAction(classId, 'view')
  if (!result.success) notFound()

  const { data } = result

  return (
    <div className="space-y-6">
      <Link
        href="/beneficiario/inscricoes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar às inscrições
      </Link>

      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{data.class.courseTitle}</h1>
            <p className="text-muted-foreground">{data.class.name}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {enrollment?.classes && (
              <ClassStatusBadge status={(enrollment.classes as { status: import('@/types/database').ClassStatus }).status} />
            )}
            {enrollment && <EnrollmentStatusBadge status={enrollment.status} />}
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Início: {format(new Date(data.class.start_date), 'dd/MM/yyyy', { locale: ptBR })}
          {data.class.end_date && (
            <> · Término: {format(new Date(data.class.end_date), 'dd/MM/yyyy', { locale: ptBR })}</>
          )}
          {enrollment?.enrolled_at && (
            <> · Inscrito em {format(new Date(enrollment.enrolled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</>
          )}
        </p>
        <Link
          href="/beneficiario/boletim"
          className="mt-3 inline-block text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
        >
          Ver meu boletim
        </Link>
      </div>

      <ClassInfoView data={data} />
    </div>
  )
}
