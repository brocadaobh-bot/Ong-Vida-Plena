import { getAuthUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { BookOpen } from 'lucide-react'
import {
  InstructorClassesList,
  type InstructorClassListRow,
} from '@/components/instructor/InstructorClassesList'

export default async function TurmasInstructorPage() {
  const user = await getAuthUser()
  const supabase = await createClient()

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, start_date, end_date, status, location, capacity, courses(title)')
    .eq('instructor_id', user!.id)
    .order('start_date', { ascending: false })

  const rows: InstructorClassListRow[] = (classes ?? []).map(cls => ({
    id: cls.id,
    name: cls.name,
    startDate: cls.start_date,
    endDate: cls.end_date,
    status: cls.status,
    courseTitle: (cls as { courses?: { title: string } | null }).courses?.title ?? 'Curso',
    location: cls.location,
    capacity: cls.capacity,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Minhas Turmas</h1>
        <p className="text-muted-foreground">
          Turmas em andamento aparecem primeiro. Encerradas ficam separadas para consulta histórica.
        </p>
      </div>

      {rows.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <BookOpen className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhuma turma atribuída.</p>
          </div>
        </Card>
      ) : (
        <InstructorClassesList classes={rows} />
      )}
    </div>
  )
}
