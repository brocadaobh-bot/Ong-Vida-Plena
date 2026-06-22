-- ============================================================
-- Migration 019: Status "recovery" no enum enrollment_status
-- IMPORTANTE: Rode APENAS este arquivo primeiro e clique Run.
-- O valor do enum precisa ser commitado antes da migration 020.
-- ============================================================

ALTER TYPE enrollment_status ADD VALUE IF NOT EXISTS 'recovery';
