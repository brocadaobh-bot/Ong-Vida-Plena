'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowRight, Search } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ClassStatusBadge } from '@/components/ui/Badge'
import {
  isActiveClassStatus,
  isArchivedClassStatus,
} from '@/lib/classes/instructor-class-groups'
import type { ClassStatus } from '@/types/database'
import { cn } from '@/lib/utils/cn'

export type InstructorClassHubRow = {
  id: string
  name: string
  startDate: string
  endDate: string | null
  status: ClassStatus
  courseTitle: string
  activeStudents: number
  completedStudents: number
  pendingStudents: number
}

type Tab = 'active' | 'archived' | 'all'

interface InstructorStudentsHubProps {
  classes: InstructorClassHubRow[]
}

function matchesSearch(row: InstructorClassHubRow, query: string): boolean {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  const dateLabel = format(new Date(row.startDate), 'dd/MM/yyyy', { locale: ptBR })
  return (
    row.courseTitle.toLowerCase().includes(q) ||
    row.name.toLowerCase().includes(q) ||
    dateLabel.includes(q)
  )
}

export function InstructorStudentsHub({ classes }: InstructorStudentsHubProps) {
  const [tab, setTab] = useState<Tab>('active')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return classes.filter(row => {
      if (tab === 'active' && !isActiveClassStatus(row.status)) return false
      if (tab === 'archived' && !isArchivedClassStatus(row.status)) return false
      return matchesSearch(row, search)
    })
  }, [classes, tab, search])

  const activeCount = classes.filter(c => isActiveClassStatus(c.status)).length
  const archivedCount = classes.filter(c => isArchivedClassStatus(c.status)).length

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {([
            ['active', `Em andamento (${activeCount})`],
            ['archived', `Encerradas (${archivedCount})`],
            ['all', `Todas (${classes.length})`],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                tab === value
                  ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-300'
                  : 'border-border bg-surface text-muted-foreground hover:bg-muted',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="w-full sm:max-w-xs">
          <Input
            label="Buscar turma"
            placeholder="Curso, turma ou data..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma turma encontrada com estes filtros.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(row => {
            const totalStudents =
              row.activeStudents + row.completedStudents + row.pendingStudents

            return (
              <Card key={row.id} className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{row.courseTitle}</p>
                    <ClassStatusBadge status={row.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {row.name} · Início{' '}
                    {format(new Date(row.startDate), 'dd/MM/yyyy', { locale: ptBR })}
                    {row.endDate && (
                      <> · Fim {format(new Date(row.endDate), 'dd/MM/yyyy', { locale: ptBR })}</>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {totalStudents} aluno(s)
                    {row.activeStudents > 0 && <> · {row.activeStudents} em curso</>}
                    {row.completedStudents > 0 && <> · {row.completedStudents} concluído(s)</>}
                    {row.pendingStudents > 0 && <> · {row.pendingStudents} pendente(s)</>}
                  </p>
                </div>
                <Link href={`/instrutor/turmas/${row.id}/alunos`}>
                  <Button size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Acessar alunos
                  </Button>
                </Link>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
