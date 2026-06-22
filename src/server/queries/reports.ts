import { createClient } from '@/lib/supabase/server'
import type { AdminDashboardMetrics } from '@/types/domain'

export async function getAdminMetrics(): Promise<AdminDashboardMetrics> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_admin_dashboard_metrics')
  if (error) throw error
  return data as unknown as AdminDashboardMetrics
}

export async function getEnrollmentReport(options?: {
  courseId?: string
  startDate?: string
  endDate?: string
}) {
  const supabase = await createClient()
  let query = supabase
    .from('enrollments')
    .select(`
      id, status, enrolled_at,
      profiles!beneficiary_id(full_name, email),
      classes(name, start_date, courses(title, category))
    `)
    .order('enrolled_at', { ascending: false })

  if (options?.startDate) {
    query = query.gte('enrolled_at', options.startDate)
  }
  if (options?.endDate) {
    query = query.lte('enrolled_at', options.endDate)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getAttendanceReport(classId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('attendance_records')
    .select(`
      status, recorded_at,
      class_sessions(session_date, topic),
      enrollments(profiles!beneficiary_id(full_name))
    `)
    .eq('class_sessions.class_id', classId)

  if (error) throw error
  return data ?? []
}

export async function getLgpdRequestsReport() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('data_subject_requests')
    .select(`
      id, request_type, status, requested_at, completed_at,
      profiles!profile_id(full_name, email)
    `)
    .order('requested_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getAuditLogs(options?: {
  actorId?: string
  action?: string
  entityType?: string
  startDate?: string
  limit?: number
  offset?: number
}) {
  const supabase = await createClient()
  const limit  = options?.limit  ?? 50
  const offset = options?.offset ?? 0

  let query = supabase
    .from('audit_logs')
    .select('*, profiles!actor_id(full_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (options?.actorId)    query = query.eq('actor_id', options.actorId)
  if (options?.action)     query = query.eq('action', options.action)
  if (options?.entityType) query = query.eq('entity_type', options.entityType)
  if (options?.startDate)  query = query.gte('created_at', options.startDate)

  const { data, count, error } = await query
  if (error) throw error
  return { data: data ?? [], count: count ?? 0 }
}
