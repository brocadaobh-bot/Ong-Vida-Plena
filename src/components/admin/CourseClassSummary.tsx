import Link from 'next/link'
import { ClassStatusBadge, ClassStatusCountChip } from '@/components/ui/Badge'
import { buildTurmasFilterUrl } from '@/lib/classes/turmas-filter'
import { getActiveClassStatuses } from '@/lib/classes/course-class-counts'
import type { ClassStatusCounts } from '@/lib/classes/course-class-counts'
import type { ClassStatus } from '@/types/database'

interface CourseClassSummaryProps {
  total: number
  byStatus: ClassStatusCounts
  courseId: string
  turmasBasePath: string
}

function statusFilterHref(
  turmasBasePath: string,
  courseId: string,
  status: ClassStatus,
): string {
  return buildTurmasFilterUrl(turmasBasePath, { courseId, status })
}

export function CourseClassSummary({
  total,
  byStatus,
  courseId,
  turmasBasePath,
}: CourseClassSummaryProps) {
  if (total === 0) {
    return <span className="text-muted-foreground">—</span>
  }

  const activeStatuses = getActiveClassStatuses(byStatus)

  if (total === 1 && activeStatuses.length === 1) {
    const status = activeStatuses[0]
    return (
      <Link
        href={statusFilterHref(turmasBasePath, courseId, status)}
        className="inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      >
        <ClassStatusBadge status={status} />
      </Link>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {activeStatuses.map(status => (
        <Link
          key={status}
          href={statusFilterHref(turmasBasePath, courseId, status)}
          className="inline-flex rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        >
          <ClassStatusCountChip status={status} count={byStatus[status]} />
        </Link>
      ))}
    </div>
  )
}
