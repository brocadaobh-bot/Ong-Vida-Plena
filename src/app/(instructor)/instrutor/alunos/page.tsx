import { getAuthUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Users } from 'lucide-react'
import Link from 'next/link'
import {
  InstructorStudentsHub,
  type InstructorClassHubRow,
} from '@/components/instructor/InstructorStudentsHub'
import type { EnrollmentStatus } from '@/types/database'

export default async function InstrutorAlunosHubPage() {
  const user = await getAuthUser()
  const supabase = await createClient()

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, start_date, end_date, status, courses(title)')
    .eq('instructor_id', user!.id)
    .order('start_date', { ascending: false })

  const classIds = classes?.map(c => c.id) ?? []
  const countsByClass = new Map<
    string,
    { active: number; completed: number; pending: number }
  >()

  for (const id of classIds) {
    countsByClass.set(id, { active: 0, completed: 0, pending: 0 })
  }

  if (classIds.length > 0) {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('class_id, status')
      .in('class_id', classIds)
      .in('status', ['confirmed', 'pending', 'recovery', 'completed'])

    for (const row of enrollments ?? []) {
      const bucket = countsByClass.get(row.class_id)
      if (!bucket) continue

      const status = row.status as EnrollmentStatus
      if (status === 'completed') bucket.completed++
      else if (status === 'pending') bucket.pending++
      else if (status === 'confirmed' || status === 'recovery') bucket.active++
    }
  }

  const hubRows: InstructorClassHubRow[] = (classes ?? []).map(cls => {
    const counts = countsByClass.get(cls.id) ?? { active: 0, completed: 0, pending: 0 }
    return {
      id: cls.id,
      name: cls.name,
      startDate: cls.start_date,
      endDate: cls.end_date,
      status: cls.status,
      courseTitle: (cls as { courses?: { title: string } | null }).courses?.title ?? 'Curso',
      activeStudents: counts.active,
      completedStudents: counts.completed,
      pendingStudents: counts.pending,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Alunos</h1>
        <p className="text-muted-foreground">
          Escolha a turma (ativa ou encerrada) e clique em Acessar alunos para ver a lista completa.
        </p>
      </div>

      {hubRows.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">Você não possui turmas atribuídas.</p>
            <Link href="/instrutor/turmas" className="mt-4 inline-block">
              <Button variant="secondary" size="sm">Ver turmas</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <InstructorStudentsHub classes={hubRows} />
      )}
    </div>
  )
}
