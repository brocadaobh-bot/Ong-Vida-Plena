// ============================================================
// Tipos do schema Supabase (sincronizar com migrations 001–034).
// Regenerar quando o CLI estiver disponível:
//   supabase gen types typescript --project-id <ID> > src/types/database.ts
// ============================================================

export type UserRole = 'admin' | 'assistant' | 'instructor' | 'beneficiary'
export type UserStatus = 'active' | 'inactive' | 'blocked' | 'pending_review'
export type CourseCategory = 'professional_training' | 'digital_inclusion' | 'workshop' | 'community_event' | 'other'
export type CourseStatus = 'draft' | 'active' | 'inactive' | 'archived'
export type ClassStatus = 'planned' | 'open' | 'in_progress' | 'completed' | 'cancelled'
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled'
export type EnrollmentStatus = 'pending' | 'confirmed' | 'waitlisted' | 'cancelled' | 'completed' | 'dropped' | 'rejected' | 'recovery'
export type AttendanceStatus = 'present' | 'absent' | 'justified' | 'late'
export type ConsentType = 'privacy_policy' | 'data_processing' | 'communications' | 'image_use' | 'research_statistics'
export type DataRequestType = 'correction' | 'deletion' | 'portability' | 'access' | 'consent_revocation'
export type DataRequestStatus = 'open' | 'in_review' | 'waiting_user' | 'completed' | 'rejected' | 'cancelled'
export type DataExportFormat = 'json' | 'csv' | 'pdf'
export type NotificationType = 'system' | 'enrollment' | 'lgpd' | 'course' | 'security'
export type GenderType = 'male' | 'female' | 'non_binary' | 'other' | 'prefer_not_to_say'
export type EducationLevel = 'no_formal_education' | 'primary_incomplete' | 'primary_complete' | 'secondary_incomplete' | 'secondary_complete' | 'higher_incomplete' | 'higher_complete' | 'postgraduate'
export type EmploymentStatus = 'employed' | 'unemployed' | 'self_employed' | 'informal' | 'student' | 'retired' | 'other'
export type DocumentType = 'cpf' | 'rg' | 'passport' | 'other'

type OmitTimestamps<R> = Omit<R, 'created_at' | 'updated_at'>
type InsertPartial<R> = Partial<OmitTimestamps<R>>
type UpdatePartial<R> = Partial<OmitTimestamps<R>>

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
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
        Insert: InsertPartial<Database['public']['Tables']['profiles']['Row']>
        Update: UpdatePartial<Database['public']['Tables']['profiles']['Row']>
        Relationships: []
      }
      addresses: {
        Row: {
          id: string
          postal_code: string | null
          street: string | null
          number: string | null
          complement: string | null
          district: string | null
          city: string
          state: string
          created_at: string
          updated_at: string
        }
        Insert: InsertPartial<Database['public']['Tables']['addresses']['Row']>
        Update: UpdatePartial<Database['public']['Tables']['addresses']['Row']>
        Relationships: []
      }
      beneficiary_profiles: {
        Row: {
          id: string
          profile_id: string
          social_name: string | null
          gender: GenderType | null
          address_id: string | null
          education_level: EducationLevel | null
          employment_status: EmploymentStatus | null
          family_income_range: string | null
          vulnerability_notes: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: InsertPartial<Database['public']['Tables']['beneficiary_profiles']['Row']>
        Update: UpdatePartial<Database['public']['Tables']['beneficiary_profiles']['Row']>
        Relationships: []
      }
      staff_profiles: {
        Row: {
          id: string
          profile_id: string
          department: string | null
          position: string | null
          bio: string | null
          active_since: string | null
          created_at: string
          updated_at: string
        }
        Insert: InsertPartial<Database['public']['Tables']['staff_profiles']['Row']>
        Update: UpdatePartial<Database['public']['Tables']['staff_profiles']['Row']>
        Relationships: []
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string | null
          category: CourseCategory
          workload_hours: number | null
          requirements: string | null
          status: CourseStatus
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: InsertPartial<Database['public']['Tables']['courses']['Row']>
        Update: UpdatePartial<Database['public']['Tables']['courses']['Row']>
        Relationships: []
      }
      classes: {
        Row: {
          id: string
          course_id: string
          instructor_id: string | null
          name: string
          start_date: string
          end_date: string | null
          capacity: number
          location: string | null
          room: string | null
          whatsapp_link: string | null
          schedule_description: string | null
          status: ClassStatus
          created_at: string
          updated_at: string
        }
        Insert: InsertPartial<Database['public']['Tables']['classes']['Row']>
        Update: UpdatePartial<Database['public']['Tables']['classes']['Row']>
        Relationships: [
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
        ]
      }
      class_sessions: {
        Row: {
          id: string
          class_id: string
          session_date: string
          start_time: string | null
          end_time: string | null
          topic: string | null
          room: string | null
          status: SessionStatus
          created_at: string
          updated_at: string
        }
        Insert: InsertPartial<Database['public']['Tables']['class_sessions']['Row']>
        Update: UpdatePartial<Database['public']['Tables']['class_sessions']['Row']>
        Relationships: []
      }
      class_announcements: {
        Row: {
          id: string
          class_id: string
          title: string
          body: string
          is_pinned: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: InsertPartial<Database['public']['Tables']['class_announcements']['Row']>
        Update: UpdatePartial<Database['public']['Tables']['class_announcements']['Row']>
        Relationships: []
      }
      class_activities: {
        Row: {
          id: string
          class_id: string
          session_id: string | null
          title: string
          description: string | null
          max_score: number
          min_passing_score: number
          sort_order: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: InsertPartial<Database['public']['Tables']['class_activities']['Row']>
        Update: UpdatePartial<Database['public']['Tables']['class_activities']['Row']>
        Relationships: [
          {
            foreignKeyName: 'class_activities_class_id_fkey',
            columns: ['class_id'],
            isOneToOne: false,
            referencedRelation: 'classes',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'class_activities_session_id_fkey',
            columns: ['session_id'],
            isOneToOne: false,
            referencedRelation: 'class_sessions',
            referencedColumns: ['id'],
          },
        ]
      }
      activity_grades: {
        Row: {
          id: string
          activity_id: string
          enrollment_id: string
          score: number
          feedback: string | null
          graded_by: string | null
          graded_at: string
          created_at: string
          updated_at: string
        }
        Insert: InsertPartial<Database['public']['Tables']['activity_grades']['Row']>
        Update: UpdatePartial<Database['public']['Tables']['activity_grades']['Row']>
        Relationships: []
      }
      enrollment_report_cards: {
        Row: {
          id: string
          enrollment_id: string
          class_id: string
          attendance_percent: number
          average_score: number | null
          activities_total: number
          activities_passed: number
          approved: boolean
          generated_at: string
          recovery_reopened_at: string | null
          recovery_reopened_by: string | null
          updated_at: string
        }
        Insert: InsertPartial<Database['public']['Tables']['enrollment_report_cards']['Row']>
        Update: UpdatePartial<Database['public']['Tables']['enrollment_report_cards']['Row']>
        Relationships: []
      }
      enrollments: {
        Row: {
          id: string
          beneficiary_id: string
          class_id: string
          status: EnrollmentStatus
          enrolled_by: string | null
          enrolled_at: string
          cancelled_at: string | null
          cancellation_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: InsertPartial<Database['public']['Tables']['enrollments']['Row']>
        Update: UpdatePartial<Database['public']['Tables']['enrollments']['Row']>
        Relationships: [
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
        ]
      }
      attendance_records: {
        Row: {
          id: string
          session_id: string
          enrollment_id: string
          status: AttendanceStatus
          recorded_by: string | null
          notes: string | null
          recorded_at: string
          created_at: string
          updated_at: string
        }
        Insert: InsertPartial<Database['public']['Tables']['attendance_records']['Row']>
        Update: UpdatePartial<Database['public']['Tables']['attendance_records']['Row']>
        Relationships: []
      }
      participant_status_history: {
        Row: {
          id: string
          enrollment_id: string
          old_status: EnrollmentStatus | null
          new_status: EnrollmentStatus
          changed_by: string | null
          reason: string | null
          created_at: string
        }
        Insert: InsertPartial<Database['public']['Tables']['participant_status_history']['Row']>
        Update: UpdatePartial<Database['public']['Tables']['participant_status_history']['Row']>
        Relationships: []
      }
      privacy_policies: {
        Row: {
          id: string
          version: string
          title: string
          content: string
          published_at: string | null
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: InsertPartial<Database['public']['Tables']['privacy_policies']['Row']>
        Update: UpdatePartial<Database['public']['Tables']['privacy_policies']['Row']>
        Relationships: []
      }
      consents: {
        Row: {
          id: string
          profile_id: string
          privacy_policy_id: string
          consent_type: ConsentType
          granted: boolean
          granted_at: string
          revoked_at: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: InsertPartial<Database['public']['Tables']['consents']['Row']>
        Update: UpdatePartial<Database['public']['Tables']['consents']['Row']>
        Relationships: []
      }
      data_subject_requests: {
        Row: {
          id: string
          profile_id: string
          request_type: DataRequestType
          status: DataRequestStatus
          description: string | null
          requested_changes: Record<string, unknown> | null
          response_notes: string | null
          assigned_to: string | null
          requested_at: string
          completed_at: string | null
          titular_last_read_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: InsertPartial<Database['public']['Tables']['data_subject_requests']['Row']>
        Update: UpdatePartial<Database['public']['Tables']['data_subject_requests']['Row']>
        Relationships: [
          {
            foreignKeyName: 'data_subject_requests_profile_id_fkey',
            columns: ['profile_id'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'data_subject_requests_assigned_to_fkey',
            columns: ['assigned_to'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
          },
        ]
      }
      data_subject_request_messages: {
        Row: {
          id: string
          request_id: string
          sender_id: string
          body: string
          attachment_path: string | null
          attachment_name: string | null
          attachment_mime: string | null
          created_at: string
        }
        Insert: InsertPartial<Database['public']['Tables']['data_subject_request_messages']['Row']>
        Update: UpdatePartial<Database['public']['Tables']['data_subject_request_messages']['Row']>
        Relationships: []
      }
      data_exports: {
        Row: {
          id: string
          request_id: string | null
          profile_id: string
          file_path: string | null
          format: DataExportFormat
          expires_at: string
          created_by: string | null
          created_at: string
        }
        Insert: InsertPartial<Database['public']['Tables']['data_exports']['Row']>
        Update: UpdatePartial<Database['public']['Tables']['data_exports']['Row']>
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          actor_id: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          old_values: Record<string, unknown> | null
          new_values: Record<string, unknown> | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: InsertPartial<Database['public']['Tables']['audit_logs']['Row']>
        Update: UpdatePartial<Database['public']['Tables']['audit_logs']['Row']>
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          profile_id: string
          title: string
          message: string
          type: NotificationType
          read_at: string | null
          created_at: string
        }
        Insert: InsertPartial<Database['public']['Tables']['notifications']['Row']>
        Update: Partial<Pick<Database['public']['Tables']['notifications']['Row'], 'read_at'>>
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          value: unknown
          description: string | null
          updated_by: string | null
          updated_at: string
        }
        Insert: InsertPartial<Database['public']['Tables']['app_settings']['Row']>
        Update: UpdatePartial<Database['public']['Tables']['app_settings']['Row']>
        Relationships: []
      }
      platform_ratings: {
        Row: {
          id: string
          profile_id: string
          score: number
          comment: string | null
          created_at: string
          updated_at: string
        }
        Insert: InsertPartial<Database['public']['Tables']['platform_ratings']['Row']>
        Update: UpdatePartial<Database['public']['Tables']['platform_ratings']['Row']>
        Relationships: []
      }
      course_certificates: {
        Row: {
          id: string
          enrollment_id: string
          certificate_code: string
          beneficiary_name: string
          course_title: string
          class_name: string
          workload_hours: number | null
          issued_at: string
          created_at: string
          name_corrected_at: string | null
          name_corrected_by: string | null
        }
        Insert: InsertPartial<Database['public']['Tables']['course_certificates']['Row']>
        Update: UpdatePartial<Database['public']['Tables']['course_certificates']['Row']>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      user_status: UserStatus
      course_category: CourseCategory
      course_status: CourseStatus
      class_status: ClassStatus
      session_status: SessionStatus
      enrollment_status: EnrollmentStatus
      attendance_status: AttendanceStatus
      consent_type: ConsentType
      data_request_type: DataRequestType
      data_request_status: DataRequestStatus
      data_export_format: DataExportFormat
      notification_type: NotificationType
      gender_type: GenderType
      education_level: EducationLevel
      employment_status: EmploymentStatus
      document_type: DocumentType
    }
    Functions: {
      get_current_user_role: {
        Args: Record<never, never>
        Returns: UserRole
      }
      is_admin: {
        Args: Record<never, never>
        Returns: boolean
      }
      is_admin_or_assistant: {
        Args: Record<never, never>
        Returns: boolean
      }
      is_instructor: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_active_privacy_policy: {
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
      }
      get_class_enrollment_stats: {
        Args: { p_class_id: string }
        Returns: {
          total_active: number
          confirmed: number
          pending: number
          waitlisted: number
          cancelled: number
          completed: number
          recovery: number
          capacity: number
          available: number
        }
      }
      class_has_capacity: {
        Args: { p_class_id: string }
        Returns: boolean
      }
      ensure_user_profile: {
        Args: {
          p_user_id: string
          p_email: string
          p_full_name: string
          p_role?: UserRole
        }
        Returns: undefined
      }
      user_has_accepted_current_policy: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      generate_beneficiary_export: {
        Args: { p_profile_id: string }
        Returns: Record<string, unknown>
      }
      get_admin_dashboard_metrics: {
        Args: Record<never, never>
        Returns: Record<string, unknown>
      }
      get_public_landing_stats: {
        Args: Record<never, never>
        Returns: Record<string, unknown>
      }
      beneficiary_has_certificates: {
        Args: { p_beneficiary_id: string }
        Returns: boolean
      }
      beneficiary_has_certificate_for_course: {
        Args: { p_beneficiary_id: string; p_course_id: string }
        Returns: boolean
      }
      staff_update_beneficiary_name_with_certificates: {
        Args: {
          p_beneficiary_id: string
          p_new_name: string
          p_actor_id: string
        }
        Returns: undefined
      }
      verify_certificate_by_code: {
        Args: { p_code: string }
        Returns: Record<string, unknown>
      }
      log_audit_action: {
        Args: {
          p_actor_id: string | null
          p_action: string
          p_entity_type: string
          p_entity_id: string
          p_old_values?: Record<string, unknown> | null
          p_new_values?: Record<string, unknown> | null
          p_ip_address?: string | null
          p_user_agent?: string | null
        }
        Returns: string
      }
    }
  }
}
