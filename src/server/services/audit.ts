import { createServiceClient } from '@/lib/supabase/server'

// ─────────────────────────────────────────────────────────────
// Serviço de auditoria — executa via service role para garantir
// que logs sejam inseridos independente das políticas RLS.
// ─────────────────────────────────────────────────────────────

export type AuditAction =
  | 'auth.login'
  | 'auth.logout'
  | 'auth.password_reset'
  | 'profile.created'
  | 'profile.updated'
  | 'profile.status_changed'
  | 'profile.role_changed'
  | 'beneficiary.created'
  | 'beneficiary.updated'
  | 'beneficiary.deleted'
  | 'enrollment.created'
  | 'enrollment.status_changed'
  | 'enrollment.cancelled'
  | 'attendance.recorded'
  | 'attendance.updated'
  | 'course.created'
  | 'course.updated'
  | 'course.deleted'
  | 'course.status_changed'
  | 'class.created'
  | 'class.updated'
  | 'class.status_changed'
  | 'class.info_updated'
  | 'class_activity.created'
  | 'class_activity.updated'
  | 'enrollment.recovery_reopened'
  | 'enrollment.approved_after_recovery'
  | 'consent.granted'
  | 'consent.revoked'
  | 'lgpd_request.created'
  | 'lgpd_request.status_changed'
  | 'lgpd_request.completed'
  | 'data_export.created'
  | 'settings.updated'
  | 'certificate.name_corrected'

interface LogAuditParams {
  actorId:    string | null
  action:     AuditAction
  entityType: string
  entityId:   string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    const supabase = await createServiceClient()
    await supabase.rpc('log_audit_action', {
      p_actor_id:    params.actorId,
      p_action:      params.action,
      p_entity_type: params.entityType,
      p_entity_id:   params.entityId,
      p_old_values:  params.oldValues ?? null,
      p_new_values:  params.newValues ?? null,
      p_ip_address:  params.ipAddress ?? null,
      p_user_agent:  params.userAgent ?? null,
    })
  } catch (error) {
    // Log de auditoria nunca deve quebrar o fluxo principal
    console.error('[Audit] Falha ao registrar log:', error)
  }
}
