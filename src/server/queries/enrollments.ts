import { createClient } from '@/lib/supabase/server'
import type { Enrollment } from '@/types/domain'
import type { AttendanceStatus } from '@/types/database'

export async function getBeneficiaryEnrollments(beneficiaryId: string): Promise<Enrollment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('enrollments')
    .select('*, classes(id, name, start_date, end_date, status, courses(id, title, category))')
    .eq('beneficiary_id', beneficiaryId)
    .order('enrolled_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as Enrollment[]
}

export async function getClassEnrollments(classId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('enrollments')
    .select('*, profiles!beneficiary_id(id, full_name, email, phone, status)')
    .eq('class_id', classId)
    .order('enrolled_at')

  if (error) throw error
  return data ?? []
}

export async function getEnrollmentById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('enrollments')
    .select('*, profiles!beneficiary_id(*), classes(*, courses(*))')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function getSessionAttendance(sessionId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*, enrollments(id, beneficiary_id, profiles!beneficiary_id(id, full_name))')
    .eq('session_id', sessionId)

  if (error) throw error
  return data ?? []
}

export type BeneficiaryAttendanceRecord = {
  id: string
  status: AttendanceStatus
  notes: string | null
  session_id: string
  enrollment_id: string
  class_sessions: {
    session_date: string
    topic: string | null
    classes: {
      id: string
      name: string
      courses: { title: string } | null
    } | null
  } | null
}

export async function getBeneficiaryAttendance(
  beneficiaryId: string,
): Promise<BeneficiaryAttendanceRecord[]> {
  const supabase = await createClient()

  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('enrollments')
    .select('id')
    .eq('beneficiary_id', beneficiaryId)

  if (enrollmentsError) throw enrollmentsError
  if (!enrollments?.length) return []

  const enrollmentIds = enrollments.map(e => e.id)

  const { data, error } = await supabase
    .from('attendance_records')
    .select(`
      id, status, notes, session_id, enrollment_id,
      class_sessions!session_id(session_date, topic, classes(id, name, courses(title)))
    `)
    .in('enrollment_id', enrollmentIds)

  if (error) throw error

  const records = (data ?? []) as unknown as BeneficiaryAttendanceRecord[]
  return records.sort(
    (a, b) =>
      new Date(b.class_sessions?.session_date ?? 0).getTime() -
      new Date(a.class_sessions?.session_date ?? 0).getTime(),
  )
}
