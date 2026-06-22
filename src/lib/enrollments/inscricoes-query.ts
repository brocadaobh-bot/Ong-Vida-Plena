import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, EnrollmentStatus } from '@/types/database'
import { ENROLLMENT_STATUS_LABELS } from '@/types/domain'
import { ACTIVE_CLASS_STATUSES } from '@/lib/classes/instructor-class-groups'

export type InscricoesListParams = {
  classId?: string
  beneficiaryId?: string
  courseId?: string
  search?: string
  status?: string
  /** Quando true (padrão), oculta inscrições de turmas concluídas ou canceladas na listagem geral. */
  activeClassesOnly?: boolean
}

export type EnrollmentListRow = {
  id: string
  beneficiary_id: string
  status: EnrollmentStatus
  enrolled_at: string
  profiles: {
    id: string
    full_name: string
    email: string
    phone: string | null
    role: import('@/types/database').UserRole
  } | null
  classes: {
    id: string
    name: string
    course_id: string
    status: import('@/types/database').ClassStatus
    courses: { title: string } | null
  } | null
}

export function isValidEnrollmentStatusFilter(
  status: string | undefined,
): status is EnrollmentStatus {
  return Boolean(status && status in ENROLLMENT_STATUS_LABELS)
}

export async function fetchEnrollmentsList(
  supabase: SupabaseClient<Database>,
  params: InscricoesListParams,
): Promise<EnrollmentListRow[]> {
  let matchingProfileIds: string[] | null = null

  if (params.search?.trim()) {
    const term = params.search.trim().replace(/[%_,]/g, ' ')
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)

    matchingProfileIds = profiles?.map(p => p.id) ?? []
    if (matchingProfileIds.length === 0) {
      matchingProfileIds = ['__none__']
    }
  }

  let query = supabase
    .from('enrollments')
    .select(
      '*, profiles!beneficiary_id(id, full_name, email, phone, role), classes(id, name, course_id, status, courses(title))',
    )

  if (params.classId) query = query.eq('class_id', params.classId)
  if (params.beneficiaryId) query = query.eq('beneficiary_id', params.beneficiaryId)
  if (params.courseId && !params.classId) {
    query = query.eq('classes.course_id', params.courseId)
  }
  if (matchingProfileIds) query = query.in('beneficiary_id', matchingProfileIds)
  if (isValidEnrollmentStatusFilter(params.status)) {
    if (params.status === 'pending') {
      query = query.in('status', ['pending', 'waitlisted'])
    } else {
      query = query.eq('status', params.status)
    }
  }

  const { data, error } = await query
  if (error) throw error

  const activeOnly =
    params.activeClassesOnly ??
    !(params.classId || params.beneficiaryId || params.courseId)

  let rows = (data ?? []) as EnrollmentListRow[]

  const closedEnrollmentStatuses: EnrollmentStatus[] = ['cancelled', 'rejected', 'dropped']
  if (!isValidEnrollmentStatusFilter(params.status)) {
    rows = rows.filter(row => !closedEnrollmentStatuses.includes(row.status))
  }

  if (activeOnly) {
    rows = rows.filter(
      row => row.classes?.status && ACTIVE_CLASS_STATUSES.includes(row.classes.status),
    )
  }

  return rows
}

export function buildInscricoesQueryString(params: {
  classId?: string
  beneficiaryId?: string
  courseId?: string
  search?: string
  status?: string
  view?: string
}) {
  const qs = new URLSearchParams()
  if (params.classId) qs.set('class_id', params.classId)
  if (params.beneficiaryId) qs.set('beneficiary_id', params.beneficiaryId)
  if (params.courseId) qs.set('course_id', params.courseId)
  if (params.search?.trim()) qs.set('q', params.search.trim())
  if (params.status) qs.set('status', params.status)
  if (params.view) qs.set('view', params.view)
  const str = qs.toString()
  return str ? `?${str}` : ''
}
