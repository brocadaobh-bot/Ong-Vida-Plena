'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { ReportCardView } from '@/components/activities/ReportCardView'
import { ClassStatusBadge, EnrollmentStatusBadge } from '@/components/ui/Badge'
import type { StudentReportCard } from '@/lib/activities/report-card'
import type { EnrollmentStatus } from '@/types/database'
import { cn } from '@/lib/utils/cn'

interface BeneficiaryReportCardsAccordionProps {
  reports: StudentReportCard[]
}

export function BeneficiaryReportCardsAccordion({
  reports,
}: BeneficiaryReportCardsAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(
    reports.length === 1 ? reports[0].enrollmentId : null,
  )

  function toggle(enrollmentId: string) {
    setOpenId(prev => (prev === enrollmentId ? null : enrollmentId))
  }

  return (
    <div className="space-y-2">
      {reports.map(report => {
        const isOpen = openId === report.enrollmentId

        return (
          <div
            key={report.enrollmentId}
            className="overflow-hidden rounded-xl border border-border bg-surface"
          >
            <button
              type="button"
              onClick={() => toggle(report.enrollmentId)}
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
                <p className="font-semibold text-foreground">{report.courseTitle}</p>
                <p className="text-sm text-muted-foreground">{report.className}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <ClassStatusBadge status={report.classStatus} />
                  <EnrollmentStatusBadge status={report.enrollmentStatus as EnrollmentStatus} />
                </div>
              </div>
            </button>

            {isOpen && (
              <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
                <div className="flex justify-end">
                  <Link
                    href={`/beneficiario/inscricoes/${report.classId}`}
                    className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
                  >
                    Ver turma
                  </Link>
                </div>
                <ReportCardView report={report} embedded />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
