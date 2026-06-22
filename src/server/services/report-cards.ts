import type { createServiceClient } from '@/lib/supabase/server'
import type { StudentReportCard } from '@/lib/activities/report-card'

type WriteClient = ReturnType<typeof createServiceClient>

export async function upsertReportCardSnapshot(
  writeClient: WriteClient,
  enrollmentId: string,
  classId: string,
  report: StudentReportCard,
  approved: boolean,
) {
  const payload = {
    enrollment_id:      enrollmentId,
    class_id:           classId,
    attendance_percent: report.attendancePercent,
    average_score:      report.averageScore,
    activities_total:   report.activitiesTotal,
    activities_passed:  report.activitiesPassed,
    approved,
    generated_at:       new Date().toISOString(),
  }

  const { data: existing } = await writeClient
    .from('enrollment_report_cards')
    .select('id')
    .eq('enrollment_id', enrollmentId)
    .maybeSingle()

  if (existing) {
    await writeClient
      .from('enrollment_report_cards')
      .update(payload)
      .eq('id', existing.id)
  } else {
    await writeClient
      .from('enrollment_report_cards')
      .insert(payload)
  }
}
