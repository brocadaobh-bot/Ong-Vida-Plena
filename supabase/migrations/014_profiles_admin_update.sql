-- ============================================================
-- Migration 014: Admin pode alterar papel de qualquer usuário
-- Corrige UPDATE em profiles bloqueado silenciosamente pelo RLS
-- Execute no Supabase → SQL Editor → Run
-- ============================================================

DROP POLICY IF EXISTS "profiles.update.admin" ON profiles;

CREATE POLICY "profiles.update.admin"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Garante que admins leem todos os perfis (lista de usuários)
DROP POLICY IF EXISTS "profiles.select.admin" ON profiles;

CREATE POLICY "profiles.select.admin"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin());
