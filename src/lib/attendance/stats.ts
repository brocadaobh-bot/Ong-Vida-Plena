import type { AttendanceStatus } from '@/types/database'

export type AttendanceStats = {
  total: number
  present: number
  absent: number
  late: number
  justified: number
  /** Percentual de presença (presente + atrasado + justificado) */
  presenceRate: number
}

export function computeAttendanceStats(
  records: { status: AttendanceStatus }[],
): AttendanceStats {
  const total = records.length
  const present = records.filter(r => r.status === 'present').length
  const absent = records.filter(r => r.status === 'absent').length
  const late = records.filter(r => r.status === 'late').length
  const justified = records.filter(r => r.status === 'justified').length
  const attended = present + late + justified
  const presenceRate = total > 0 ? Math.round((attended / total) * 100) : 0

  return { total, present, absent, late, justified, presenceRate }
}
