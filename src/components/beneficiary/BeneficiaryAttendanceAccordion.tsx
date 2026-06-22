'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { AttendanceStatusBadge } from '@/components/ui/Badge'
import type { AttendanceStatus } from '@/types/database'
import { cn } from '@/lib/utils/cn'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export type AttendanceGroupItem = {
  id: string
  classId: string | null
  courseTitle: string
  className: string
  stats: {
    total: number
    present: number
    absent: number
    late: number
    justified: number
    presenceRate: number
  }
  records: {
    id: string
    status: AttendanceStatus
    notes: string | null
    sessionDate: string | null
    topic: string | null
  }[]
}

interface BeneficiaryAttendanceAccordionProps {
  groups: AttendanceGroupItem[]
}

export function BeneficiaryAttendanceAccordion({ groups }: BeneficiaryAttendanceAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(
    groups.length === 1 ? groups[0].id : null,
  )

  function toggle(groupId: string) {
    setOpenId(prev => (prev === groupId ? null : groupId))
  }

  return (
    <div className="space-y-2">
      {groups.map(group => {
        const isOpen = openId === group.id

        return (
          <div
            key={group.id}
            className="overflow-hidden rounded-xl border border-border bg-surface"
          >
            <button
              type="button"
              onClick={() => toggle(group.id)}
              aria-expanded={isOpen}
              className={cn(
                'flex w-full items-start gap-3 px-4 py-4 text-left transition-colors sm:px-5',
                'hover:bg-muted/40',
                isOpen && 'border-b border-border bg-muted/20',
              )}
            >
              <ChevronDown
                className={cn(
                  'mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200',
                  isOpen && 'rotate-180',
                )}
                aria-hidden
              />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-semibold text-foreground">{group.courseTitle}</p>
                <p className="text-sm text-muted-foreground">{group.className}</p>
                <p className="text-xs text-muted-foreground">
                  {group.stats.total} aula{group.stats.total !== 1 ? 's' : ''}
                  {' · '}
                  {group.stats.absent} falta{group.stats.absent !== 1 ? 's' : ''}
                  {group.stats.late > 0 && (
                    <> · {group.stats.late} atraso{group.stats.late !== 1 ? 's' : ''}</>
                  )}
                  {' · '}
                  <span className="font-medium text-foreground">
                    {group.stats.presenceRate}% presença
                  </span>
                </p>
              </div>
            </button>

            {isOpen && (
              <div className="space-y-3 px-4 py-4 sm:px-5 sm:py-5">
                {group.classId && (
                  <div className="flex justify-end">
                    <Link
                      href={`/beneficiario/inscricoes/${group.classId}`}
                      className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
                    >
                      Ver turma
                    </Link>
                  </div>
                )}

                <div className="space-y-2">
                  {group.records.map(record => (
                    <div key={record.id} className="list-item-muted">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {record.sessionDate
                            ? format(new Date(record.sessionDate), "dd 'de' MMMM 'de' yyyy", {
                                locale: ptBR,
                              })
                            : 'Data não informada'}
                        </p>
                        {record.topic && (
                          <p className="text-xs text-muted-foreground">{record.topic}</p>
                        )}
                        {record.notes && (
                          <p className="mt-0.5 text-xs text-muted-foreground/80">
                            Obs.: {record.notes}
                          </p>
                        )}
                      </div>
                      <AttendanceStatusBadge status={record.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
