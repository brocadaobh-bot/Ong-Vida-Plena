'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Search, Calendar, MapPin, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { ClassStatusBadge } from '@/components/ui/Badge'
import {
  isActiveClassStatus,
  isArchivedClassStatus,
} from '@/lib/classes/instructor-class-groups'
import type { ClassStatus } from '@/types/database'
import { cn } from '@/lib/utils/cn'

export type InstructorClassListRow = {
  id: string
  name: string
  startDate: string
  endDate: string | null
  status: ClassStatus
  courseTitle: string
  location: string | null
  capacity: number
}

type Tab = 'active' | 'archived' | 'all'

interface InstructorClassesListProps {
  classes: InstructorClassListRow[]
}

function matchesSearch(row: InstructorClassListRow, query: string): boolean {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  const dateLabel = format(new Date(row.startDate), 'dd/MM/yyyy', { locale: ptBR })
  return (
    row.courseTitle.toLowerCase().includes(q) ||
    row.name.toLowerCase().includes(q) ||
    dateLabel.includes(q) ||
    (row.location?.toLowerCase().includes(q) ?? false)
  )
}

export function InstructorClassesList({ classes }: InstructorClassesListProps) {
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
            placeholder="Curso, turma, local ou data..."
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
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map(row => (
            <Link key={row.id} href={`/instrutor/turmas/${row.id}`}>
              <Card
                interactive
                className="h-full hover:border-primary-300 dark:hover:border-primary-700"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{row.courseTitle}</p>
                    <p className="text-sm text-muted-foreground">{row.name}</p>
                  </div>
                  <ClassStatusBadge status={row.status} />
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    {format(new Date(row.startDate), 'dd/MM/yyyy', { locale: ptBR })}
                    {row.endDate && (
                      <> — {format(new Date(row.endDate), 'dd/MM/yyyy', { locale: ptBR })}</>
                    )}
                  </div>
                  {row.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {row.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    Capacidade: {row.capacity}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
