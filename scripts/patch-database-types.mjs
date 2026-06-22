import fs from 'fs'

const path = 'src/types/database.ts'
let s = fs.readFileSync(path, 'utf8')

if (!s.includes('type InsertPartial')) {
  s = s.replace(
    `export type DocumentType = 'cpf' | 'rg' | 'passport' | 'other'\n\nexport interface Database {`,
    `export type DocumentType = 'cpf' | 'rg' | 'passport' | 'other'

type OmitTimestamps<R> = Omit<R, 'created_at' | 'updated_at'>
type InsertPartial<R> = Partial<OmitTimestamps<R>>
type UpdatePartial<R> = Partial<OmitTimestamps<R>>

export interface Database {`,
  )
}

s = s.replace(
  /Insert: Omit<Database\['public'\]\['Tables'\]\['[^']+'\]\['Row'\], [^>]+>/g,
  (match) => {
    const rowRef = match.match(/Insert: (Omit<Database\['public'\]\['Tables'\]\['[^']+'\]\['Row'\], [^>]+>)/)?.[1]
    if (!rowRef) return match
    return `Insert: InsertPartial<Database['public']['Tables'][${rowRef.match(/\['([^']+)'\]\['Row'\]/)?.[0] ? `'${rowRef.match(/\['([^']+)'\]/)?.[1]}']['Row']` : ''}>`
  },
)

// Simpler: replace known Insert patterns
for (const table of [
  'profiles', 'addresses', 'beneficiary_profiles', 'staff_profiles', 'courses', 'classes',
  'class_sessions', 'class_announcements', 'enrollments', 'attendance_records',
  'participant_status_history', 'privacy_policies', 'consents', 'data_subject_requests',
  'data_exports', 'audit_logs', 'notifications', 'app_settings',
]) {
  const re = new RegExp(
    `Insert: Omit<Database\\['public'\\]\\['Tables'\\]\\['${table}'\\]\\['Row'\\], [^\\n]+`,
    'g',
  )
  s = s.replace(
    re,
    `Insert: InsertPartial<Database['public']['Tables']['${table}']['Row']>`,
  )
  const updateRe = new RegExp(
    `Update: Partial<Database\\['public'\\]\\['Tables'\\]\\['${table}'\\]\\['Insert'\\]>`,
    'g',
  )
  s = s.replace(
    updateRe,
    `Update: UpdatePartial<Database['public']['Tables']['${table}']['Row']>`,
  )
}

s = s.replace(/Update: Partial<Pick<[^>]+>>/g, (m) => m) // keep notifications pick

// Relationships
const relationships: Record<string, string> = {
  profiles: `Relationships: []`,
  addresses: `Relationships: []`,
  beneficiary_profiles: `Relationships: [
          {
            foreignKeyName: 'beneficiary_profiles_profile_id_fkey',
            columns: ['profile_id'],
            isOneToOne: true,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'beneficiary_profiles_address_id_fkey',
            columns: ['address_id'],
            isOneToOne: false,
            referencedRelation: 'addresses',
            referencedColumns: ['id'],
          },
        ]`,
  staff_profiles: `Relationships: [
          {
            foreignKeyName: 'staff_profiles_profile_id_fkey',
            columns: ['profile_id'],
            isOneToOne: true,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
          },
        ]`,
  courses: `Relationships: [
          {
            foreignKeyName: 'courses_created_by_fkey',
            columns: ['created_by'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
          },
        ]`,
  classes: `Relationships: [
          {
            foreignKeyName: 'classes_course_id_fkey',
            columns: ['course_id'],
            isOneToOne: false,
            referencedRelation: 'courses',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'classes_instructor_id_fkey',
            columns: ['instructor_id'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
          },
        ]`,
  class_sessions: `Relationships: [
          {
            foreignKeyName: 'class_sessions_class_id_fkey',
            columns: ['class_id'],
            isOneToOne: false,
            referencedRelation: 'classes',
            referencedColumns: ['id'],
          },
        ]`,
  class_announcements: `Relationships: [
          {
            foreignKeyName: 'class_announcements_class_id_fkey',
            columns: ['class_id'],
            isOneToOne: false,
            referencedRelation: 'classes',
            referencedColumns: ['id'],
          },
        ]`,
  enrollments: `Relationships: [
          {
            foreignKeyName: 'enrollments_beneficiary_id_fkey',
            columns: ['beneficiary_id'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'enrollments_class_id_fkey',
            columns: ['class_id'],
            isOneToOne: false,
            referencedRelation: 'classes',
            referencedColumns: ['id'],
          },
        ]`,
  attendance_records: `Relationships: [
          {
            foreignKeyName: 'attendance_records_session_id_fkey',
            columns: ['session_id'],
            isOneToOne: false,
            referencedRelation: 'class_sessions',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'attendance_records_enrollment_id_fkey',
            columns: ['enrollment_id'],
            isOneToOne: false,
            referencedRelation: 'enrollments',
            referencedColumns: ['id'],
          },
        ]`,
  participant_status_history: `Relationships: [
          {
            foreignKeyName: 'participant_status_history_enrollment_id_fkey',
            columns: ['enrollment_id'],
            isOneToOne: false,
            referencedRelation: 'enrollments',
            referencedColumns: ['id'],
          },
        ]`,
  privacy_policies: `Relationships: []`,
  consents: `Relationships: [
          {
            foreignKeyName: 'consents_profile_id_fkey',
            columns: ['profile_id'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
          },
        ]`,
  data_subject_requests: `Relationships: [
          {
            foreignKeyName: 'data_subject_requests_profile_id_fkey',
            columns: ['profile_id'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
          },
        ]`,
  data_exports: `Relationships: []`,
  audit_logs: `Relationships: []`,
  notifications: `Relationships: [
          {
            foreignKeyName: 'notifications_profile_id_fkey',
            columns: ['profile_id'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
          },
        ]`,
  app_settings: `Relationships: []`,
}

for (const [table, rel] of Object.entries(relationships)) {
  if (rel.includes('course_id')) {
    // skip - already has relationships from first patch
  }
  s = s.replace(
    new RegExp(`(Tables:\\s*\\{[\\s\\S]*?${table}:[\\s\\S]*?)Relationships: \\[\\]`),
    `$1${rel}`,
  )
}

// Fix get_active_privacy_policy for SETOF return
s = s.replace(
  /get_active_privacy_policy: \{[\s\S]*?\n      \}/,
  `get_active_privacy_policy: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          version: string
          title: string
          content: string
          published_at: string | null
        }
        SetofOptions: {
          to: 'privacy_policies'
          from: 'get_active_privacy_policy'
          isSetofReturn: true
          isOneToOne: true
          isNotNullable: false
        }
      }`,
)

fs.writeFileSync(path, s)
console.log('database types updated')
