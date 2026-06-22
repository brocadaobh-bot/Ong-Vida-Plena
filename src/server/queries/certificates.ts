import { createClient } from '@/lib/supabase/server'
import type { CourseCertificate, VerifiedCertificate } from '@/types/domain'

const CERTIFIED_COURSE_REENROLL_MESSAGE =
  'Você já concluiu este curso e possui certificado emitido. Não é possível se inscrever novamente.'

export { CERTIFIED_COURSE_REENROLL_MESSAGE }

export async function beneficiaryHasCertificateForCourse(
  beneficiaryId: string,
  courseId: string,
): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('beneficiary_has_certificate_for_course', {
    p_beneficiary_id: beneficiaryId,
    p_course_id: courseId,
  })

  if (error) {
    console.error('beneficiaryHasCertificateForCourse:', error)
    return false
  }

  return Boolean(data)
}

export async function getCertifiedCourseIdsForBeneficiary(
  beneficiaryId: string,
): Promise<Set<string>> {
  const supabase = await createClient()

  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select('id')
    .eq('beneficiary_id', beneficiaryId)

  if (enrollError || !enrollments?.length) return new Set()

  const enrollmentIds = enrollments.map(e => e.id)

  const { data: certificates, error: certError } = await supabase
    .from('course_certificates')
    .select('enrollment_id')
    .in('enrollment_id', enrollmentIds)

  if (certError || !certificates?.length) return new Set()

  const certifiedEnrollmentIds = new Set(certificates.map(c => c.enrollment_id))

  const { data: classRows, error: classError } = await supabase
    .from('enrollments')
    .select('class_id, classes(course_id)')
    .in('id', [...certifiedEnrollmentIds])

  if (classError) {
    console.error('getCertifiedCourseIdsForBeneficiary:', classError)
    return new Set()
  }

  const courseIds = new Set<string>()
  for (const row of classRows ?? []) {
    const courseId = (row.classes as { course_id: string } | null)?.course_id
    if (courseId) courseIds.add(courseId)
  }

  return courseIds
}

export async function beneficiaryHasIssuedCertificates(
  beneficiaryId: string,
): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('beneficiary_has_certificates', {
    p_beneficiary_id: beneficiaryId,
  })

  if (error) {
    console.error('beneficiaryHasIssuedCertificates:', error)
    return false
  }

  return Boolean(data)
}

export async function getBeneficiaryCertificates(
  beneficiaryId: string,
): Promise<CourseCertificate[]> {
  const supabase = await createClient()

  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select('id')
    .eq('beneficiary_id', beneficiaryId)
    .eq('status', 'completed')

  if (enrollError || !enrollments?.length) return []

  const enrollmentIds = enrollments.map(e => e.id)

  const { data, error } = await supabase
    .from('course_certificates')
    .select('*')
    .in('enrollment_id', enrollmentIds)
    .order('issued_at', { ascending: false })

  if (error) {
    console.error('getBeneficiaryCertificates:', error)
    return []
  }

  return (data ?? []) as CourseCertificate[]
}

export async function getCertificateCount(beneficiaryId: string): Promise<number> {
  const certificates = await getBeneficiaryCertificates(beneficiaryId)
  return certificates.length
}

export async function getCertificateById(
  certificateId: string,
  beneficiaryId: string,
): Promise<CourseCertificate | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('course_certificates')
    .select('*')
    .eq('id', certificateId)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error('getCertificateById:', error)
    return null
  }

  const { data: enrollment, error: enrollError } = await supabase
    .from('enrollments')
    .select('beneficiary_id')
    .eq('id', data.enrollment_id)
    .eq('beneficiary_id', beneficiaryId)
    .maybeSingle()

  if (enrollError || !enrollment) return null

  return data as CourseCertificate
}

export async function verifyCertificateByCode(
  code: string,
): Promise<VerifiedCertificate> {
  const supabase = await createClient()
  const normalized = code.trim().toUpperCase()

  if (!normalized || normalized.length < 6) {
    return { valid: false, error: 'invalid_code' }
  }

  const { data, error } = await supabase.rpc('verify_certificate_by_code', {
    p_code: normalized,
  })

  if (error) {
    console.error('verifyCertificateByCode:', error)
    return { valid: false, error: 'not_found' }
  }

  const result = data as Record<string, unknown> | null
  if (!result?.valid) {
    const errorCode =
      result?.error === 'invalid_code' || result?.error === 'not_found'
        ? result.error
        : 'not_found'
    return { valid: false, error: errorCode }
  }

  return {
    valid:            true,
    certificate_code: String(result.certificate_code),
    beneficiary_name: String(result.beneficiary_name),
    course_title:     String(result.course_title),
    class_name:       String(result.class_name),
    workload_hours:   result.workload_hours != null ? Number(result.workload_hours) : null,
    issued_at:        String(result.issued_at),
  }
}
