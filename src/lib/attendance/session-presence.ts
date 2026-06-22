import type { AttendanceStatus } from '@/types/database'
import { ATTENDANCE_STATUS_LABELS } from '@/types/domain'

const PRESENT_STATUSES: AttendanceStatus[] = ['present', 'late', 'justified']

export type SessionPresenceInfo = {
  status: AttendanceStatus | null
  wasPresent: boolean
  label: string
  canGradeByDefault: boolean
}

export function getSessionPresence(status: AttendanceStatus | null | undefined): SessionPresenceInfo {
  if (status === null || status === undefined) {
    return {
      status: null,
      wasPresent: false,
      label: 'Sem registro de presença',
      canGradeByDefault: false,
    }
  }

  const wasPresent = PRESENT_STATUSES.includes(status)

  return {
    status,
    wasPresent,
    label: ATTENDANCE_STATUS_LABELS[status],
    canGradeByDefault: wasPresent,
  }
}

export function canGradeWithoutRecoveryOverride(
  presence: SessionPresenceInfo,
  hasExistingGrade: boolean,
  recoveryOverride: boolean,
): boolean {
  if (hasExistingGrade || recoveryOverride) return true
  return presence.canGradeByDefault
}
