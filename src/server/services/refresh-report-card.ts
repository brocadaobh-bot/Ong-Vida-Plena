import { createServiceClient } from '@/lib/supabase/server'
import { getStudentReportCard } from '@/server/queries/report-cards'
import { upsertReportCardSnapshot } from '@/server/services/report-cards'
import { ACTIVE_CLASS_ENROLLMENT_STATUSES } from '@/lib/enrollments/access'

export async function refreshEnrollmentReportCardSnapshot(
  enrollmentId: string,
  writeClient?: ReturnType<typeof createServiceClient>,
): Promise<void> {
  const report = await getStudentReportCard(enrollmentId)
  if (!report) return

  const client = writeClient ?? createServiceClient()
  const approved = report.attendanceMet && report.activitiesMet

  await upsertReportCardSnapshot(
    client,
    enrollmentId,
    report.classId,
    report,
    approved,
  )
}

export async function refreshClassReportCards(classId: string): Promise<number> {
  const writeClient = createServiceClient()

  const { data: enrollments } = await writeClient
    .from('enrollments')
    .select('id')
    .eq('class_id', classId)
    .in('status', [...ACTIVE_CLASS_ENROLLMENT_STATUSES])

  let count = 0
  for (const enrollment of enrollments ?? []) {
    await refreshEnrollmentReportCardSnapshot(enrollment.id, writeClient)
    count++
  }

  return count
}
