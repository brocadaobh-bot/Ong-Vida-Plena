-- ============================================================
-- Migration 001: Enums
-- Todos os tipos enumerados utilizados no schema
-- ============================================================

-- Papéis de usuário
CREATE TYPE user_role AS ENUM (
  'admin',
  'assistant',
  'instructor',
  'beneficiary'
);

-- Status do usuário
CREATE TYPE user_status AS ENUM (
  'active',
  'inactive',
  'blocked',
  'pending_review'
);

-- Categorias de curso
CREATE TYPE course_category AS ENUM (
  'professional_training',
  'digital_inclusion',
  'workshop',
  'community_event',
  'other'
);

-- Status do curso
CREATE TYPE course_status AS ENUM (
  'draft',
  'active',
  'inactive',
  'archived'
);

-- Status da turma
CREATE TYPE class_status AS ENUM (
  'planned',
  'open',
  'in_progress',
  'completed',
  'cancelled'
);

-- Status da sessão/aula
CREATE TYPE session_status AS ENUM (
  'scheduled',
  'completed',
  'cancelled'
);

-- Status da inscrição
CREATE TYPE enrollment_status AS ENUM (
  'pending',
  'confirmed',
  'waitlisted',
  'cancelled',
  'completed',
  'dropped',
  'rejected'
);

-- Status de presença
CREATE TYPE attendance_status AS ENUM (
  'present',
  'absent',
  'justified',
  'late'
);

-- Tipos de consentimento LGPD
CREATE TYPE consent_type AS ENUM (
  'privacy_policy',
  'data_processing',
  'communications',
  'image_use',
  'research_statistics'
);

-- Tipos de solicitação LGPD
CREATE TYPE data_request_type AS ENUM (
  'correction',
  'deletion',
  'portability',
  'access',
  'consent_revocation'
);

-- Status de solicitação LGPD
CREATE TYPE data_request_status AS ENUM (
  'open',
  'in_review',
  'waiting_user',
  'completed',
  'rejected',
  'cancelled'
);

-- Formato de exportação de dados
CREATE TYPE data_export_format AS ENUM (
  'json',
  'csv',
  'pdf'
);

-- Tipos de notificação
CREATE TYPE notification_type AS ENUM (
  'system',
  'enrollment',
  'lgpd',
  'course',
  'security'
);

-- Gênero
CREATE TYPE gender_type AS ENUM (
  'male',
  'female',
  'non_binary',
  'other',
  'prefer_not_to_say'
);

-- Escolaridade
CREATE TYPE education_level AS ENUM (
  'no_formal_education',
  'primary_incomplete',
  'primary_complete',
  'secondary_incomplete',
  'secondary_complete',
  'higher_incomplete',
  'higher_complete',
  'postgraduate'
);

-- Situação de emprego
CREATE TYPE employment_status AS ENUM (
  'employed',
  'unemployed',
  'self_employed',
  'informal',
  'student',
  'retired',
  'other'
);

-- Tipos de documento
CREATE TYPE document_type AS ENUM (
  'cpf',
  'rg',
  'passport',
  'other'
);
