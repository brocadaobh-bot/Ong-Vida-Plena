-- ============================================================
-- Migration 033: Controle de leitura da conversa LGPD pelo titular
-- ============================================================

ALTER TABLE data_subject_requests
  ADD COLUMN IF NOT EXISTS titular_last_read_at TIMESTAMPTZ;

-- Solicitações existentes: considerar já "vistas" na abertura
UPDATE data_subject_requests
SET titular_last_read_at = requested_at
WHERE titular_last_read_at IS NULL;
