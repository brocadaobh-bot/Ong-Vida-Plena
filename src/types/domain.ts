// ============================================================
// Tipos de Domínio — objetos ricos usados na camada de aplicação
// ============================================================

import type {
  UserRole,
  UserStatus,
  CourseCategory,
  CourseStatus,
  ClassStatus,
  EnrollmentStatus,
  AttendanceStatus,
  ConsentType,
  DataRequestType,
  DataRequestStatus,
  GenderType,
  EducationLevel,
  EmploymentStatus,
  DocumentType,
} from './database'

// ─────────────────────────────────────────────────────────────
// Perfil do usuário autenticado (sessão)
// ─────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string
  email: string
  role: UserRole
  full_name: string
  status: UserStatus
  avatar_url: string | null
  has_accepted_current_policy: boolean
}

export interface OwnProfileData {
  full_name: string
  email: string
  phone: string | null
  birth_date: string | null
  document_type: string | null
  document_number: string | null
  role: UserRole
}

// ─────────────────────────────────────────────────────────────
// Perfil completo (com dados estendidos)
// ─────────────────────────────────────────────────────────────
export interface Profile {
  id: string
  role: UserRole
  full_name: string
  email: string
  phone: string | null
  document_type: DocumentType | null
  document_number: string | null
  birth_date: string | null
  status: UserStatus
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Address {
  id: string
  postal_code: string | null
  street: string | null
  number: string | null
  complement: string | null
  district: string | null
  city: string
  state: string
}

export interface BeneficiaryProfile {
  id: string
  profile_id: string
  social_name: string | null
  gender: GenderType | null
  address: Address | null
  education_level: EducationLevel | null
  employment_status: EmploymentStatus | null
  family_income_range: string | null
  vulnerability_notes: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
}

export interface BeneficiaryFull extends Profile {
  beneficiary_profile: BeneficiaryProfile | null
}

// ─────────────────────────────────────────────────────────────
// Cursos e Turmas
// ─────────────────────────────────────────────────────────────
export interface Course {
  id: string
  title: string
  description: string | null
  category: CourseCategory
  workload_hours: number | null
  requirements: string | null
  status: CourseStatus
  created_at: string
}

export interface ClassItem {
  id: string
  course_id: string
  course?: Course
  instructor_id: string | null
  instructor?: Profile | null
  name: string
  start_date: string
  end_date: string | null
  capacity: number
  location: string | null
  schedule_description: string | null
  status: ClassStatus
  enrollment_count?: number
  available_spots?: number
}

export interface ClassSession {
  id: string
  class_id: string
  session_date: string
  start_time: string | null
  end_time: string | null
  topic: string | null
  status: string
}

// ─────────────────────────────────────────────────────────────
// Inscrições e Presença
// ─────────────────────────────────────────────────────────────
export interface Enrollment {
  id: string
  beneficiary_id: string
  beneficiary?: Profile
  class_id: string
  class?: ClassItem
  status: EnrollmentStatus
  enrolled_by: string | null
  enrolled_at: string
  cancelled_at: string | null
  cancellation_reason: string | null
}

export interface CourseCertificate {
  id: string
  enrollment_id: string
  certificate_code: string
  beneficiary_name: string
  course_title: string
  class_name: string
  workload_hours: number | null
  issued_at: string
  created_at: string
  name_corrected_at?: string | null
  name_corrected_by?: string | null
}

export type VerifiedCertificate =
  | {
      valid: true
      certificate_code: string
      beneficiary_name: string
      course_title: string
      class_name: string
      workload_hours: number | null
      issued_at: string
    }
  | {
      valid: false
      error: 'invalid_code' | 'not_found'
    }

export interface AttendanceRecord {
  id: string
  session_id: string
  session?: ClassSession
  enrollment_id: string
  enrollment?: Enrollment
  status: AttendanceStatus
  recorded_by: string | null
  notes: string | null
  recorded_at: string
}

// ─────────────────────────────────────────────────────────────
// LGPD
// ─────────────────────────────────────────────────────────────
export interface PrivacyPolicy {
  id: string
  version: string
  title: string
  content: string
  published_at: string | null
  is_active: boolean
}

export interface Consent {
  id: string
  profile_id: string
  privacy_policy_id: string
  consent_type: ConsentType
  granted: boolean
  granted_at: string
  revoked_at: string | null
}

export interface LgpdProfileEmbed {
  full_name: string
  email: string
  role: UserRole
}

export interface DataSubjectRequest {
  id: string
  profile_id: string
  profile?: LgpdProfileEmbed
  request_type: DataRequestType
  status: DataRequestStatus
  description: string | null
  requested_changes: Record<string, unknown> | null
  response_notes: string | null
  assigned_to: string | null
  requested_at: string
  completed_at: string | null
  titular_last_read_at?: string | null
  /** Preenchido na listagem do titular quando há resposta nova da equipe. */
  has_unread_reply?: boolean
}

export interface LgpdRequestMessage {
  id: string
  request_id: string
  sender_id: string
  body: string
  attachment_path: string | null
  attachment_name: string | null
  attachment_mime: string | null
  attachment_url?: string | null
  created_at: string
  profiles?: Pick<Profile, 'full_name' | 'role'>
}

export interface LgpdUserSummary {
  profile_id: string
  profile: Pick<Profile, 'full_name' | 'email'>
  requests: DataSubjectRequest[]
  total_count: number
  active_count: number
  latest_requested_at: string
  needs_attention: boolean
}

// ─────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────
export interface AdminDashboardMetrics {
  total_beneficiaries: number
  total_courses: number
  total_classes: number
  total_enrollments: number
  pending_lgpd_requests: number
  new_beneficiaries_30d: number
}

// ─────────────────────────────────────────────────────────────
// Notificações
// ─────────────────────────────────────────────────────────────
export interface Notification {
  id: string
  profile_id: string
  title: string
  message: string
  type: string
  read_at: string | null
  created_at: string
}

// ─────────────────────────────────────────────────────────────
// Resultados de operações (Server Actions)
// ─────────────────────────────────────────────────────────────
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// ─────────────────────────────────────────────────────────────
// Labels e opções para selects
// ─────────────────────────────────────────────────────────────
export const ROLE_LABELS: Record<UserRole, string> = {
  admin:       'Administrador',
  assistant:   'Assistente Administrativo',
  instructor:  'Instrutor',
  beneficiary: 'Usuário',
}

/** Precedência de acesso (maior valor = maior cargo). */
export const ROLE_ACCESS_RANK: Record<UserRole, number> = {
  admin: 3,
  assistant: 2,
  instructor: 1,
  beneficiary: 0,
}

/** Papéis com acesso administrativo ou operacional (não usuário comum). */
export const STAFF_ROLES: UserRole[] = ['admin', 'assistant', 'instructor']

export const STATUS_LABELS: Record<UserStatus, string> = {
  active:         'Ativo',
  inactive:       'Inativo',
  blocked:        'Bloqueado',
  pending_review: 'Aguardando revisão',
}

export const COURSE_CATEGORY_LABELS: Record<CourseCategory, string> = {
  professional_training: 'Capacitação Profissional',
  digital_inclusion:     'Inclusão Digital',
  workshop:              'Oficina',
  community_event:       'Evento Comunitário',
  other:                 'Outro',
}

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  draft:    'Rascunho',
  active:   'Ativo',
  inactive: 'Inativo',
  archived: 'Arquivado',
}

export const CLASS_STATUS_LABELS: Record<ClassStatus, string> = {
  planned:     'Planejada',
  open:        'Inscrições abertas',
  in_progress: 'Em andamento',
  completed:   'Concluída',
  cancelled:   'Cancelada',
}

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  pending:    'Pendente',
  confirmed:  'Confirmada',
  waitlisted: 'Pendente',
  cancelled:  'Cancelada',
  completed:  'Concluída',
  dropped:    'Desistiu',
  rejected:   'Rejeitada',
  recovery:   'Recuperação',
}

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present:   'Presente',
  absent:    'Ausente',
  justified: 'Justificado',
  late:      'Atrasado',
}

export const DATA_REQUEST_TYPE_LABELS: Record<DataRequestType, string> = {
  correction:         'Correção de Dados',
  deletion:           'Exclusão de Dados',
  portability:        'Portabilidade',
  access:             'Acesso aos Dados',
  consent_revocation: 'Revogação de Consentimento',
}

export const DATA_REQUEST_STATUS_LABELS: Record<DataRequestStatus, string> = {
  open:         'Aberta',
  in_review:    'Em análise',
  waiting_user: 'Aguardando você',
  completed:    'Concluída',
  rejected:     'Indeferida',
  cancelled:    'Cancelada',
}

export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  no_formal_education:  'Sem escolaridade',
  primary_incomplete:   'Fundamental incompleto',
  primary_complete:     'Fundamental completo',
  secondary_incomplete: 'Médio incompleto',
  secondary_complete:   'Médio completo',
  higher_incomplete:    'Superior incompleto',
  higher_complete:      'Superior completo',
  postgraduate:         'Pós-graduação',
}

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  employed:    'Empregado(a)',
  unemployed:  'Desempregado(a)',
  self_employed: 'Autônomo(a)',
  informal:    'Economia informal',
  student:     'Estudante',
  retired:     'Aposentado(a)',
  other:       'Outro',
}

export const GENDER_LABELS: Record<GenderType, string> = {
  male:              'Masculino',
  female:            'Feminino',
  non_binary:        'Não-binário',
  other:             'Outro',
  prefer_not_to_say: 'Prefiro não informar',
}

export const FAMILY_INCOME_RANGE_LABELS: Record<string, string> = {
  ate_1000:    'Até R$ 1.000',
  '1000_2000': 'R$ 1.000 a R$ 2.000',
  '2000_3000': 'R$ 2.000 a R$ 3.000',
  '3000_4000': 'R$ 3.000 a R$ 4.000',
  '4000_5000': 'R$ 4.000 a R$ 5.000',
  '5000_6000': 'R$ 5.000 a R$ 6.000',
  '6000_7000': 'R$ 6.000 a R$ 7.000',
  '7000_8000': 'R$ 7.000 a R$ 8.000',
  acima_8000:  'Acima de R$ 8.000',
}

/** Opções para select de faixa de renda familiar. */
export const FAMILY_INCOME_RANGE_OPTIONS = Object.entries(FAMILY_INCOME_RANGE_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export const CONSENT_TYPE_LABELS: Record<ConsentType, string> = {
  privacy_policy:      'Política de Privacidade',
  data_processing:     'Tratamento de Dados',
  communications:      'Comunicações e avisos',
  image_use:           'Uso de imagem',
  research_statistics: 'Pesquisas e estatísticas',
}
