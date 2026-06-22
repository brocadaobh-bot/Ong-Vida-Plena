-- Inclui status "recovery" nas estatísticas de inscrição da turma.

CREATE OR REPLACE FUNCTION class_has_capacity(p_class_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_capacity INTEGER;
  v_occupied_count INTEGER;
BEGIN
  SELECT capacity INTO v_capacity FROM classes WHERE id = p_class_id;
  IF v_capacity IS NULL THEN RETURN FALSE; END IF;

  SELECT COUNT(*) INTO v_occupied_count
  FROM enrollments
  WHERE class_id = p_class_id AND status IN ('confirmed', 'pending', 'recovery');

  RETURN v_occupied_count < v_capacity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION get_class_enrollment_stats(p_class_id UUID)
RETURNS TABLE(
  total_active  BIGINT,
  confirmed     BIGINT,
  pending       BIGINT,
  waitlisted    BIGINT,
  cancelled     BIGINT,
  completed     BIGINT,
  recovery      BIGINT,
  capacity      INTEGER,
  available     INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE e.status NOT IN ('cancelled','rejected','dropped'))     AS total_active,
    COUNT(*) FILTER (WHERE e.status = 'confirmed')                                 AS confirmed,
    COUNT(*) FILTER (WHERE e.status = 'pending')                                   AS pending,
    0::BIGINT                                                                      AS waitlisted,
    COUNT(*) FILTER (WHERE e.status IN ('cancelled','rejected','dropped'))         AS cancelled,
    COUNT(*) FILTER (WHERE e.status = 'completed')                                 AS completed,
    COUNT(*) FILTER (WHERE e.status = 'recovery')                                  AS recovery,
    c.capacity,
    GREATEST(
      0,
      c.capacity - (COUNT(*) FILTER (WHERE e.status IN ('confirmed', 'pending', 'recovery')))::INTEGER
    )::INTEGER AS available
  FROM classes c
  LEFT JOIN enrollments e ON e.class_id = c.id
  WHERE c.id = p_class_id
  GROUP BY c.capacity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;
