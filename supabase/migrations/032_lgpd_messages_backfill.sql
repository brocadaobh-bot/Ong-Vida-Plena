-- ============================================================
-- Migration 032: Backfill mensagens iniciais de solicitações LGPD
-- Solicitações criadas antes da 030 ou com falha no insert da 1ª msg
-- ============================================================

INSERT INTO data_subject_request_messages (request_id, sender_id, body, created_at)
SELECT
  dsr.id,
  dsr.profile_id,
  TRIM(
    CONCAT_WS(
      E'\n\n',
      CASE
        WHEN dsr.request_type = 'correction'
          AND NULLIF(TRIM(dsr.requested_changes->>'full_name'), '') IS NOT NULL
        THEN 'Nome completo solicitado: ' || TRIM(dsr.requested_changes->>'full_name')
        ELSE NULL
      END,
      NULLIF(TRIM(dsr.description), '')
    )
  ),
  dsr.requested_at
FROM data_subject_requests dsr
WHERE NOT EXISTS (
  SELECT 1
  FROM data_subject_request_messages m
  WHERE m.request_id = dsr.id
)
AND NULLIF(
  TRIM(
    CONCAT_WS(
      E'\n\n',
      CASE
        WHEN dsr.request_type = 'correction'
          AND NULLIF(TRIM(dsr.requested_changes->>'full_name'), '') IS NOT NULL
        THEN 'Nome completo solicitado: ' || TRIM(dsr.requested_changes->>'full_name')
        ELSE NULL
      END,
      NULLIF(TRIM(dsr.description), '')
    )
  ),
  ''
) IS NOT NULL;
