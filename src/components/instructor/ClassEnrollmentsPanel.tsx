'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EnrollmentStatusBadge } from '@/components/ui/Badge'
import type { EnrollmentStatus } from '@/types/database'
import { cn } from '@/lib/utils/cn'

export type ClassEnrollmentRow = {
  id: string
  status: EnrollmentStatus
  fullName: string
  email: string
  phone: string | null
}

interface ClassEnrollmentsPanelProps {
  classId: string
  classIsArchived: boolean
  enrollments: ClassEnrollmentRow[]
}

type Section = 'active' | 'completed' | 'pending'

function matchesStudent(row: ClassEnrollmentRow, query: string): boolean {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  return (
    row.fullName.toLowerCase().includes(q) ||
    row.email.toLowerCase().includes(q) ||
    (row.phone?.toLowerCase().includes(q) ?? false)
  )
}

export function ClassEnrollmentsPanel({
  classId,
  classIsArchived,
  enrollments,
}: ClassEnrollmentsPanelProps) {
  const [search, setSearch] = useState('')
  const [section, setSection] = useState<Section>(classIsArchived ? 'completed' : 'active')

  const inCourse = enrollments.filter(e => e.status === 'confirmed' || e.status === 'recovery')
  const completed = enrollments.filter(e => e.status === 'completed')
  const pending = enrollments.filter(e => e.status === 'pending')

  const visible = useMemo(() => {
    const pool =
      section === 'active' ? inCourse :
      section === 'completed' ? completed :
      pending

    return pool.filter(row => matchesStudent(row, search))
  }, [section, inCourse, completed, pending, search])

  const sections: { id: Section; label: string; count: number }[] = [
    { id: 'active', label: 'Em curso', count: inCourse.length },
    { id: 'completed', label: 'Concluídos', count: completed.length },
    { id: 'pending', label: 'Pendentes', count: pending.length },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {sections.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                section === item.id
                  ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-300'
                  : 'border-border bg-surface text-muted-foreground hover:bg-muted',
              )}
            >
              {item.label} ({item.count})
            </button>
          ))}
        </div>

        <div className="w-full sm:max-w-xs">
          <Input
            label="Buscar aluno"
            placeholder="Nome, e-mail ou telefone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
      </div>

      {classIsArchived && section === 'active' && inCourse.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Turma encerrada — alunos aprovados estão em Concluídos; reprovados podem estar em Recuperação em Em curso.
        </p>
      )}

      <Card>
        {visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum aluno nesta seção
            {search.trim() ? ' com este termo de busca' : ''}.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {visible.map(enrollment => (
              <div
                key={enrollment.id}
                className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">{enrollment.fullName}</p>
                  <p className="text-xs text-muted-foreground">{enrollment.email}</p>
                  {enrollment.phone && (
                    <p className="text-xs text-muted-foreground/80">{enrollment.phone}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <EnrollmentStatusBadge status={enrollment.status} />
                  <Link href={`/instrutor/turmas/${classId}/alunos/${enrollment.id}`}>
                    <Button size="sm" variant="ghost">
                      {enrollment.status === 'completed' ? 'Ver boletim' : 'Avaliar'}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
