-- ============================================================
-- Migration 031: Garantir stats da landing (reaplicável)
-- Rode se get_public_landing_stats falhar na homepage.
-- ============================================================

CREATE TABLE IF NOT EXISTS platform_ratings (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID        NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  score      SMALLINT    NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment    TEXT        CHECK (comment IS NULL OR char_length(comment) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_ratings_score ON platform_ratings(score);

DROP TRIGGER IF EXISTS trg_platform_ratings_updated_at ON platform_ratings;
CREATE TRIGGER trg_platform_ratings_updated_at
  BEFORE UPDATE ON platform_ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE platform_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_ratings.select.own" ON platform_ratings;
CREATE POLICY "platform_ratings.select.own"
  ON platform_ratings FOR SELECT
  USING (profile_id = auth.uid() OR is_admin_or_assistant());

DROP POLICY IF EXISTS "platform_ratings.insert.own" ON platform_ratings;
CREATE POLICY "platform_ratings.insert.own"
  ON platform_ratings FOR INSERT
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "platform_ratings.update.own" ON platform_ratings;
CREATE POLICY "platform_ratings.update.own"
  ON platform_ratings FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON platform_ratings TO authenticated;

CREATE OR REPLACE FUNCTION get_public_landing_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_enrollments INTEGER;
  v_registered_only INTEGER;
  v_users_served INTEGER;
  v_courses INTEGER;
  v_satisfaction_rate INTEGER;
  v_satisfaction_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER
  INTO v_enrollments
  FROM enrollments
  WHERE status NOT IN ('cancelled', 'rejected');

  SELECT COUNT(*)::INTEGER
  INTO v_registered_only
  FROM profiles p
  WHERE p.role = 'beneficiary'
    AND p.status != 'blocked'
    AND NOT EXISTS (
      SELECT 1
      FROM enrollments e
      WHERE e.beneficiary_id = p.id
        AND e.status NOT IN ('cancelled', 'rejected')
    );

  v_users_served := v_enrollments + v_registered_only;

  SELECT COUNT(*)::INTEGER INTO v_courses FROM courses;

  SELECT
    COUNT(*)::INTEGER,
    CASE
      WHEN COUNT(*) = 0 THEN NULL
      ELSE ROUND(AVG(score) / 5.0 * 100)::INTEGER
    END
  INTO v_satisfaction_count, v_satisfaction_rate
  FROM platform_ratings;

  RETURN jsonb_build_object(
    'users_served', v_users_served,
    'courses_available', v_courses,
    'satisfaction_rate', v_satisfaction_rate,
    'satisfaction_count', v_satisfaction_count,
    'social_impact_years', 12
  );
END;
$$;

REVOKE ALL ON FUNCTION get_public_landing_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_public_landing_stats() TO anon, authenticated, service_role;
