import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ClassForm } from '@/components/admin/ClassForm'

export default async function NovaTurmaPage({
  searchParams,
}: {
  searchParams: Promise<{ course_id?: string }>
}) {
  const { course_id: courseId } = await searchParams
  const supabase = await createClient()

  const [{ data: courses }, { data: instructors }] = await Promise.all([
    supabase.from('courses').select('id, title').order('title'),
    supabase
      .from('profiles')
      .select('id, full_name')
      .in('role', ['instructor', 'admin'])
      .eq('status', 'active')
      .order('full_name'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <Link href={courseId ? `/admin/turmas?course_id=${courseId}` : '/admin/turmas'}>
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} className="mb-2">
            Voltar para turmas
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Nova Turma</h1>
        <p className="text-muted-foreground">
          Vincule a turma a um curso. Usuários se inscrevem quando o status estiver
          &quot;Inscrições abertas&quot;.
        </p>
      </div>

      <Card className="max-w-2xl">
        <ClassForm
          courses={courses ?? []}
          instructors={instructors ?? []}
          defaultCourseId={courseId}
          redirectOnCreate={courseId ? `/admin/turmas?course_id=${courseId}` : '/admin/turmas'}
        />
      </Card>
    </div>
  )
}
