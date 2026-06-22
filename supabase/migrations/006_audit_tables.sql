-- ============================================================
-- Migration 006: Tabelas de Auditoria e Sistema
-- audit_logs, notifications, app_settings
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Tabela: audit_logs
-- Registro imutável de ações sensíveis
-- ─────────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   UUID,
  old_values  JSONB,
  new_values  JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor_id   ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity     ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action     ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- Tabela: notifications
-- Notificações internas para usuários
-- ─────────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id         UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID              NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title      VARCHAR(255)      NOT NULL,
  message    TEXT              NOT NULL,
  type       notification_type NOT NULL DEFAULT 'system',
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_profile_id ON notifications(profile_id);
-- Índice parcial para consulta eficiente de não lidas
CREATE INDEX idx_notifications_unread
  ON notifications(profile_id, created_at DESC)
  WHERE read_at IS NULL;

-- ─────────────────────────────────────────────────────────────
-- Tabela: app_settings
-- Configurações gerais da plataforma (chave-valor)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE app_settings (
  key         VARCHAR(100) PRIMARY KEY,
  value       JSONB        NOT NULL DEFAULT '{}',
  description TEXT,
  updated_by  UUID         REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Configurações iniciais
INSERT INTO app_settings (key, value, description) VALUES
  ('app_name',                   '"Vida Plena"', 'Nome exibido na plataforma'),
  ('require_email_confirmation',  'true',         'Exigir confirmação de e-mail no cadastro'),
  ('max_class_capacity',          '50',           'Capacidade máxima padrão por turma'),
  ('data_retention_days',         '1825',         'Dias de retenção de dados (5 anos padrão)'),
  ('allow_self_enrollment',       'true',         'Permitir auto-inscrição por beneficiários'),
  ('enrollment_requires_approval','false',        'Inscrições precisam de aprovação manual');
