import { z } from 'zod'

/** Converte string vazia de formulário HTML em null (campos opcionais). */
const emptyToNull = (val: unknown) =>
  val === '' || val === null || val === undefined ? null : val

/** Valores salvos em beneficiary_profiles.family_income_range */
export const FAMILY_INCOME_RANGE_VALUES = [
  'ate_1000',
  '1000_2000',
  '2000_3000',
  '3000_4000',
  '4000_5000',
  '5000_6000',
  '6000_7000',
  '7000_8000',
  'acima_8000',
] as const

export type FamilyIncomeRange = (typeof FAMILY_INCOME_RANGE_VALUES)[number]

export const loginSchema = z.object({
  email:    z.string().email('E-mail inválido.'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres.'),
})

export const registerSchema = z.object({
  full_name:        z.string().min(3, 'Nome deve ter pelo menos 3 caracteres.').max(255),
  email:            z.string().email('E-mail inválido.'),
  password:         z.string().min(8, 'Senha deve ter pelo menos 8 caracteres.'),
  confirm_password: z.string(),
  phone:            z.string().optional(),
  birth_date:       z.string().optional(),
  consent_privacy_policy:  z.boolean().refine(v => v === true, 'Você precisa aceitar a Política de Privacidade.'),
  consent_data_processing: z.boolean().refine(v => v === true, 'Você precisa autorizar o tratamento de dados.'),
  consent_communications:  z.boolean().optional(),
  consent_image_use:       z.boolean().optional(),
}).refine(
  data => data.password === data.confirm_password,
  { message: 'As senhas não coincidem.', path: ['confirm_password'] }
)

export const forgotPasswordSchema = z.object({
  email: z.string().email('E-mail inválido.'),
})

export const resetPasswordSchema = z.object({
  password:         z.string().min(8, 'Senha deve ter pelo menos 8 caracteres.'),
  confirm_password: z.string(),
}).refine(
  data => data.password === data.confirm_password,
  { message: 'As senhas não coincidem.', path: ['confirm_password'] }
)

// ─────────────────────────────────────────────────────────────
// Perfil
// ─────────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  full_name: z.string().trim().min(3, 'Nome deve ter pelo menos 3 caracteres.').max(255),
  phone: z.preprocess(
    val => (val === '' || val === null || val === undefined ? null : val),
    z.string().max(20).nullable().optional(),
  ),
  birth_date: z.preprocess(
    val => (val === '' || val === null || val === undefined ? null : val),
    z.string().nullable().optional(),
  ),
  document_type: z.preprocess(
    val => (val === '' || val === null || val === undefined ? null : val),
    z.enum(['cpf', 'rg', 'passport', 'other']).nullable().optional(),
  ),
  document_number: z.preprocess(
    val => (val === '' || val === null || val === undefined ? null : val),
    z.string().max(20).nullable().optional(),
  ),
})

export const updateBeneficiaryProfileSchema = z.object({
  social_name: z.preprocess(
    emptyToNull,
    z.string().max(255).nullable().optional(),
  ),
  gender: z.preprocess(
    emptyToNull,
    z.enum(['male', 'female', 'non_binary', 'other', 'prefer_not_to_say']).nullable().optional(),
  ),
  education_level: z.preprocess(
    emptyToNull,
    z.enum([
      'no_formal_education', 'primary_incomplete', 'primary_complete',
      'secondary_incomplete', 'secondary_complete', 'higher_incomplete',
      'higher_complete', 'postgraduate',
    ]).nullable().optional(),
  ),
  employment_status: z.preprocess(
    emptyToNull,
    z.enum(['employed', 'unemployed', 'self_employed', 'informal', 'student', 'retired', 'other']).nullable().optional(),
  ),
  family_income_range: z.preprocess(
    emptyToNull,
    z.enum(FAMILY_INCOME_RANGE_VALUES).nullable().optional(),
  ),
  emergency_contact_name: z.preprocess(
    emptyToNull,
    z.string().max(255).nullable().optional(),
  ),
  emergency_contact_phone: z.preprocess(
    emptyToNull,
    z.string().max(20).nullable().optional(),
  ),
  postal_code: z.preprocess(emptyToNull, z.string().max(10).nullable().optional()),
  street:      z.preprocess(emptyToNull, z.string().max(255).nullable().optional()),
  number:      z.preprocess(emptyToNull, z.string().max(20).nullable().optional()),
  complement:  z.preprocess(emptyToNull, z.string().max(100).nullable().optional()),
  district:    z.preprocess(emptyToNull, z.string().max(100).nullable().optional()),
  city:        z.preprocess(emptyToNull, z.string().max(100).nullable().optional()),
  state: z.preprocess(
    emptyToNull,
    z.string().length(2, 'UF deve ter 2 letras (ex.: SP).').nullable().optional(),
  ),
})

// ─────────────────────────────────────────────────────────────
// Cursos
// ─────────────────────────────────────────────────────────────

export const courseSchema = z.object({
  title:          z.string().min(3, 'Título obrigatório.').max(255),
  description:    z.string().optional().nullable(),
  category:       z.enum(['professional_training','digital_inclusion','workshop','community_event','other']),
  workload_hours: z.coerce.number().int().positive().optional().nullable(),
  requirements:   z.string().optional().nullable(),
  status:         z.enum(['draft','active','inactive','archived']).default('draft'),
})

// ─────────────────────────────────────────────────────────────
// Turmas
// ─────────────────────────────────────────────────────────────

export const classSchema = z.object({
  course_id:            z.string().uuid('Curso inválido.'),
  instructor_id:        z.string().uuid().optional().nullable(),
  name:                 z.string().min(3).max(255),
  start_date:           z.string().min(1, 'Data de início obrigatória.'),
  end_date:             z.string().optional().nullable(),
  capacity:             z.coerce.number().int().min(1).max(500),
  location:             z.string().max(255).optional().nullable(),
  room:                 z.string().max(100).optional().nullable(),
  whatsapp_link:        z.string().max(500).optional().nullable(),
  schedule_description: z.string().optional().nullable(),
  status:               z.enum(['planned','open','in_progress','completed','cancelled']).default('planned'),
})

export const classInfoSchema = z.object({
  location:             z.string().max(255).optional().nullable(),
  room:                 z.string().max(100).optional().nullable(),
  whatsapp_link:        z.string().max(500).optional().nullable(),
  schedule_description: z.string().optional().nullable(),
})

export const classAnnouncementSchema = z.object({
  class_id:  z.string().uuid(),
  title:     z.string().min(2).max(255),
  body:      z.string().min(2).max(5000),
  is_pinned: z.coerce.boolean().optional().default(false),
})

// ─────────────────────────────────────────────────────────────
// Sessões de Aula
// ─────────────────────────────────────────────────────────────

export const classSessionSchema = z.object({
  class_id:     z.string().uuid(),
  session_date: z.string().min(1),
  start_time:   z.string().optional().nullable(),
  end_time:     z.string().optional().nullable(),
  topic:        z.string().max(255).optional().nullable(),
  room:         z.string().max(100).optional().nullable(),
  status:       z.enum(['scheduled','completed','cancelled']).default('scheduled'),
})

// ─────────────────────────────────────────────────────────────
// Inscrições
// ─────────────────────────────────────────────────────────────

export const enrollmentSchema = z.object({
  beneficiary_id: z.string().uuid(),
  class_id:       z.string().uuid(),
})

export const updateEnrollmentStatusSchema = z.object({
  enrollment_id: z.string().uuid(),
  status:        z.enum(['pending','confirmed','waitlisted','cancelled','completed','dropped','rejected','recovery']),
  reason:        z.string().optional().nullable(),
})

export const classActivitySchema = z.object({
  class_id:          z.string().uuid(),
  session_id:        z.string().uuid('Selecione a aula vinculada.'),
  title:             z.string().min(3, 'Título obrigatório.').max(255),
  description:       z.string().optional().nullable(),
  max_score:         z.coerce.number().positive('Nota máxima inválida.'),
  min_passing_score: z.coerce.number().min(0, 'Nota mínima inválida.'),
})

export const updateClassActivitySchema = z.object({
  activity_id:       z.string().uuid(),
  session_id:        z.string().uuid('Selecione a aula vinculada.'),
  title:             z.string().min(3, 'Título obrigatório.').max(255),
  description:       z.string().optional().nullable(),
  max_score:         z.coerce.number().positive('Nota máxima inválida.'),
  min_passing_score: z.coerce.number().min(0, 'Nota mínima inválida.'),
})

export const activityGradeSchema = z.object({
  activity_id:   z.string().uuid(),
  enrollment_id: z.string().uuid(),
  score:         z.coerce.number().min(0, 'Nota inválida.'),
  feedback:      z.string().max(5000).optional().nullable(),
})

// ─────────────────────────────────────────────────────────────
// Presença
// ─────────────────────────────────────────────────────────────

export const attendanceRecordSchema = z.object({
  session_id:    z.string().uuid(),
  enrollment_id: z.string().uuid(),
  status:        z.enum(['present','absent','justified','late']),
  notes:         z.string().optional().nullable(),
})

// ─────────────────────────────────────────────────────────────
// LGPD
// ─────────────────────────────────────────────────────────────

export const dataSubjectRequestSchema = z
  .object({
    request_type:      z.enum(['correction','deletion','portability','access','consent_revocation']),
    description:       z.string().min(10, 'Descreva sua solicitação (mínimo 10 caracteres).'),
    requested_changes: z.record(z.string(), z.unknown()).optional(),
    correct_full_name: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.request_type === 'correction') {
      const name = data.correct_full_name?.trim() ?? ''
      if (name.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Informe o nome completo correto (mínimo 3 caracteres).',
          path: ['correct_full_name'],
        })
      }
    }
  })

export const lgpdRequestMessageSchema = z.object({
  request_id: z.string().uuid(),
  body:       z.string().trim().min(1, 'Escreva uma mensagem.'),
})

export const processRequestSchema = z.object({
  request_id:     z.string().uuid(),
  status:         z.enum(['in_review','waiting_user','completed','rejected','cancelled']),
  response_notes: z.string().optional().nullable(),
})

// ─────────────────────────────────────────────────────────────
// Gestão de usuários (admin)
// ─────────────────────────────────────────────────────────────

export const createUserSchema = z.object({
  full_name: z.string().min(3).max(255),
  email:     z.string().email(),
  role:      z.enum(['admin','assistant','instructor','beneficiary']),
  password:  z.string().min(8),
  phone:     z.string().optional().nullable(),
})

export const updateUserRoleSchema = z.object({
  user_id: z.string().uuid(),
  role:    z.enum(['admin','assistant','instructor','beneficiary']),
})

// Tipos inferidos dos schemas
export type LoginInput              = z.infer<typeof loginSchema>
export type RegisterInput           = z.infer<typeof registerSchema>
export type ForgotPasswordInput     = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput      = z.infer<typeof resetPasswordSchema>
export type UpdateProfileInput      = z.infer<typeof updateProfileSchema>
export type UpdateBeneficiaryInput  = z.infer<typeof updateBeneficiaryProfileSchema>
export type CourseInput             = z.infer<typeof courseSchema>
export type ClassInput              = z.infer<typeof classSchema>
export type ClassSessionInput       = z.infer<typeof classSessionSchema>
export type EnrollmentInput         = z.infer<typeof enrollmentSchema>
export type UpdateEnrollmentInput   = z.infer<typeof updateEnrollmentStatusSchema>
export type AttendanceInput         = z.infer<typeof attendanceRecordSchema>
export type DataSubjectRequestInput = z.infer<typeof dataSubjectRequestSchema>
export type LgpdRequestMessageInput = z.infer<typeof lgpdRequestMessageSchema>
export type ProcessRequestInput     = z.infer<typeof processRequestSchema>
export type CreateUserInput         = z.infer<typeof createUserSchema>
export type UpdateUserRoleInput     = z.infer<typeof updateUserRoleSchema>
