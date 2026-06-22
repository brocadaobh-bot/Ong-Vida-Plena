'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils/cn'
import { EnrollmentStatusBadge, UserRoleBadge } from '@/components/ui/Badge'
import { EnrollmentActions } from '@/components/admin/EnrollmentActions'
import { RemoveFromCourseButton } from '@/components/admin/RemoveFromCourseButton'
import { AdminNavLink } from '@/components/admin/AdminFilterBar'
import type { GroupedEnrollmentPerson } from '@/lib/enrollments/group-by-person'

export type { GroupedEnrollmentPerson }

interface InscricoesGroupedListProps {
  people: GroupedEnrollmentPerson[]
  /** Base para filtros de inscrição (ex.: /admin/inscricoes ou /assistente/inscricoes) */
  basePath?: string
  /** Link do curso — admin usa turmas; assistente usa inscrições filtradas */
  courseLinkBase?: string
}

export function InscricoesGroupedList({
  people,
  basePath = '/admin/inscricoes',
  courseLinkBase = '/admin/turmas',
}: InscricoesGroupedListProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set())

  function toggle(key: string) {
    setExpandedKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (people.length === 0) {
    return (
      <p className="py-10 text-center text-muted-foreground">
        Nenhuma inscrição encontrada.{' '}
        <AdminNavLink href={basePath}>Ver todas</AdminNavLink>
      </p>
    )
  }

  return (
    <div className="divide-y divide-border">
      {people.map(person => {
        const isOpen = expandedKeys.has(person.key)
        const count = person.enrollments.length
        const preview = person.enrollments
          .slice(0, 2)
          .map(e => e.courseTitle)
          .join(' · ')
        const extra = count > 2 ? ` +${count - 2}` : ''

        return (
          <div key={person.key} className="bg-surface">
            <button
              type="button"
              onClick={() => toggle(person.key)}
              aria-expanded={isOpen}
              className={cn(
                'flex w-full items-start gap-3 p-4 text-left transition-colors sm:gap-4 sm:p-5',
                'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                isOpen && 'border-b border-border bg-muted/30',
              )}
            >
              <ChevronRight
                className={cn(
                  'mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200',
                  isOpen && 'rotate-90 text-foreground',
                )}
                aria-hidden="true"
              />

              <div className="min-w-0 flex-1 space-y-2 sm:grid sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-start sm:gap-4 sm:space-y-0">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">{person.fullName}</span>
                    {person.role !== 'beneficiary' && <UserRoleBadge role={person.role} />}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground sm:break-all">{person.email}</p>
                </div>

                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  {person.phone ?? '—'}
                </p>

                <div className="text-left sm:text-right">
                  <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                    {count} curso{count !== 1 ? 's' : ''}
                  </span>
                  {!isOpen && count > 0 && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:max-w-[220px] sm:ml-auto">
                      {preview}{extra}
                    </p>
                  )}
                </div>
              </div>
            </button>

            {isOpen && (
              <div className="space-y-2 px-4 pb-4 pl-12 sm:px-5 sm:pb-5 sm:pl-14">
                {person.enrollments.map(enrollment => (
                  <div
                    key={enrollment.id}
                    className="inset-box flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        <AdminNavLink href={`${courseLinkBase}?course_id=${enrollment.courseId}`}>
                          {enrollment.courseTitle}
                        </AdminNavLink>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Turma:{' '}
                        <AdminNavLink href={`${basePath}?class_id=${enrollment.classId}`}>
                          {enrollment.className}
                        </AdminNavLink>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground/80">
                        Inscrito em{' '}
                        {format(new Date(enrollment.enrolledAt), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                      <EnrollmentStatusBadge status={enrollment.status} />
                      <RemoveFromCourseButton
                        enrollmentId={enrollment.id}
                        beneficiaryName={person.fullName}
                        currentStatus={enrollment.status}
                      />
                      <EnrollmentActions
                        enrollmentId={enrollment.id}
                        currentStatus={enrollment.status}
                        beneficiaryName={person.fullName}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
