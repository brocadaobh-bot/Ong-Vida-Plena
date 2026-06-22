-- ============================================================
-- Migration 005: Tabelas LGPD
-- privacy_policies, consents, data_subject_requests, data_exports
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Tabela: privacy_policies
-- Versões da política de privacidade
-- ─────────────────────────────────────────────────────────────
CREATE TABLE privacy_policies (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  version      VARCHAR(20) NOT NULL,
  title        VARCHAR(255) NOT NULL,
  content      TEXT        NOT NULL,
  published_at TIMESTAMPTZ,
  is_active    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_by   UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT privacy_policies_version_unique UNIQUE (version)
);

-- Garante que apenas uma política pode estar ativa por vez
CREATE UNIQUE INDEX idx_single_active_policy
  ON privacy_policies(is_active)
  WHERE is_active = TRUE;

CREATE TRIGGER trg_privacy_policies_updated_at
  BEFORE UPDATE ON privacy_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────
-- Tabela: consents
-- Registro granular de consentimentos por titular
-- ─────────────────────────────────────────────────────────────
CREATE TABLE consents (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id        UUID         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  privacy_policy_id UUID         NOT NULL REFERENCES privacy_policies(id) ON DELETE RESTRICT,
  consent_type      consent_type NOT NULL,
  granted           BOOLEAN      NOT NULL,
  granted_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  revoked_at        TIMESTAMPTZ,
  ip_address        INET,
  user_agent        TEXT,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_revoked_after_granted CHECK (
    revoked_at IS NULL OR revoked_at > granted_at
  )
);

CREATE INDEX idx_consents_profile_id   ON consents(profile_id);
CREATE INDEX idx_consents_policy_id    ON consents(privacy_policy_id);
CREATE INDEX idx_consents_type         ON consents(consent_type);
CREATE INDEX idx_consents_granted_at   ON consents(granted_at DESC);

-- ─────────────────────────────────────────────────────────────
-- Tabela: data_subject_requests
-- Solicitações LGPD dos titulares
-- ─────────────────────────────────────────────────────────────
CREATE TABLE data_subject_requests (
  id                 UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id         UUID                NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_type       data_request_type   NOT NULL,
  status             data_request_status NOT NULL DEFAULT 'open',
  description        TEXT,
  requested_changes  JSONB,
  response_notes     TEXT,
  assigned_to        UUID                REFERENCES profiles(id) ON DELETE SET NULL,
  requested_at       TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  completed_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dsr_profile_id ON data_subject_requests(profile_id);
CREATE INDEX idx_dsr_status     ON data_subject_requests(status);
CREATE INDEX idx_dsr_type       ON data_subject_requests(request_type);

CREATE TRIGGER trg_data_subject_requests_updated_at
  BEFORE UPDATE ON data_subject_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────
-- Tabela: data_exports
-- Exportações geradas para portabilidade de dados
-- ─────────────────────────────────────────────────────────────
CREATE TABLE data_exports (
  id          UUID               PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id  UUID               REFERENCES data_subject_requests(id) ON DELETE SET NULL,
  profile_id  UUID               NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_path   TEXT,
  format      data_export_format NOT NULL DEFAULT 'json',
  expires_at  TIMESTAMPTZ        NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_by  UUID               REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_data_exports_profile_id ON data_exports(profile_id);
CREATE INDEX idx_data_exports_request_id ON data_exports(request_id);
CREATE INDEX idx_data_exports_expires_at ON data_exports(expires_at);
