import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import { canAccessInstructorClass } from '@/lib/auth/instructor-access'
import { isArchivedClassStatus } from '@/lib/classes/instructor-class-groups'
import { Button } from '@/components/ui/Button'
import { ClassStatusBadge } from '@/components/ui/Badge'
import { ClassEnrollmentsPanel } from '@/components/instructor/ClassEnrollmentsPanel'
import { ArrowLeft, ClipboardList } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { EnrollmentStatus } from '@/types/database'

export default async function AlunosTurmaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getAuthUser()
  const supabase = await createClient()

  const { data: cls } = await supabase
    .from('classes')
    .select('id, name, status, start_date, end_date, instructor_id, courses(title)')
    .eq('id', id)
    .single()

  if (!cls || !canAccessInstructorClass(user, cls.instructor_id)) notFound()

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('id, status, profiles!beneficiary_id(full_name, email, phone)')
    .eq('class_id', id)
    .in('status', ['confirmed', 'pending', 'recovery', 'completed'])
    .order('enrolled_at')

  const enrollmentRows = (enrollments ?? []).map(e => {
    const profile = e.profiles as { full_name: string; email: string; phone: string | null } | null
    return {
      id: e.id,
      status: e.status as EnrollmentStatus,
      fullName: profile?.full_name ?? '—',
      email: profile?.email ?? '',
      phone: profile?.phone ?? null,
    }
  })

  const classIsArchived = isArchivedClassStatus(cls.status)

  return (
    <div className="space-y-6">
      <div>
        <Link href={classIsArchived ? '/instrutor/alunos' : `/instrutor/turmas/${id}`}>
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} className="mb-2">
            {classIsArchived ? 'Voltar para alunos' : 'Voltar para a turma'}
          </Button>
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">Alunos da turma</h1>
              <ClassStatusBadge status={cls.status} />
            </div>
            <p className="text-muted-foreground">
              {(cls as { courses?: { title: string } | null }).courses?.title} — {cls.name}
            </p>
            <p className="text-sm text-muted-foreground">
              Início {format(new Date(cls.start_date), 'dd/MM/yyyy', { locale: ptBR })}
              {cls.end_date && (
                <> · Fim {format(new Date(cls.end_date), 'dd/MM/yyyy', { locale: ptBR })}</>
              )}
            </p>
          </div>
          <Link href={`/instrutor/turmas/${id}/atividades`}>
            <Button variant="secondary" size="sm" leftIcon={<ClipboardList className="h-4 w-4" />}>
              Atividades
            </Button>
          </Link>
        </div>
      </div>

      <ClassEnrollmentsPanel
        classId={id}
        classIsArchived={classIsArchived}
        enrollments={enrollmentRows}
      />
    </div>
  )
}
