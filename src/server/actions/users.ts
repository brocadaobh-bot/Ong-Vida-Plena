'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import { requireAdmin } from '@/lib/auth/permissions'
import { isProtectedAdminEmail } from '@/lib/auth/protected-admins'
import { syncProfileRoleExtensions } from '@/lib/auth/sync-profile-role'
import { updateUserRoleSchema } from '@/lib/validation/schemas'
import { logAudit } from '@/server/services/audit'
import {
  cancelProfileStudentEnrollments,
  cancellationReasonForRoleChange,
  shouldCancelEnrollmentsOnRoleChange,
} from '@/lib/enrollments/cancel-profile-enrollments'
import type { ActionResult } from '@/types/domain'
import type { UserStatus } from '@/types/database'
import type { UserRole } from '@/types/database'

async function countActiveAdmins(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<number> {
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'admin')
    .eq('status', 'active')
  return count ?? 0
}

// ─────────────────────────────────────────────────────────────
// Alterar papel do usuário
// ─────────────────────────────────────────────────────────────
export async function updateUserRoleAction(formData: FormData): Promise<ActionResult> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }
  requireAdmin(authUser.role)

  const parsed = updateUserRoleSchema.safeParse({
    user_id: formData.get('user_id'),
    role:    formData.get('role'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  if (parsed.data.user_id === authUser.id) {
    return { success: false, error: 'Você não pode alterar seu próprio papel.' }
  }

  const supabase = await createClient()
  const serviceSupabase = await createServiceClient()

  const { data: target } = await serviceSupabase
    .from('profiles')
    .select('role, email, status')
    .eq('id', parsed.data.user_id)
    .single()

  if (!target) {
    return { success: false, error: 'Usuário não encontrado.' }
  }

  if (isProtectedAdminEmail(target.email)) {
    return {
      success: false,
      error: 'Esta conta é protegida e não pode ter o papel alterado pelo painel.',
    }
  }

  const oldRole = target.role as UserRole
  const newRole = parsed.data.role as UserRole

  if (oldRole === 'admin' && newRole !== 'admin') {
    const adminCount = await countActiveAdmins(supabase)
    if (adminCount <= 1) {
      return {
        success: false,
        error: 'Não é possível rebaixar o último administrador ativo do sistema.',
      }
    }
  }

  let cancelledEnrollments = 0
  if (shouldCancelEnrollmentsOnRoleChange(oldRole, newRole)) {
    try {
      cancelledEnrollments = await cancelProfileStudentEnrollments(
        serviceSupabase,
        parsed.data.user_id,
        cancellationReasonForRoleChange(newRole),
      )
    } catch {
      return {
        success: false,
        error: 'Não foi possível cancelar as inscrições como aluno antes de alterar o papel.',
      }
    }
  }

  const { data: updated, error } = await serviceSupabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', parsed.data.user_id)
    .select('id, role')
    .single()

  if (error || !updated || updated.role !== newRole) {
    console.error('[updateUserRoleAction]', error?.message)
    return {
      success: false,
      error: error?.message
        ? `Erro ao alterar papel: ${error.message}`
        : 'Erro ao alterar papel do usuário. Tente novamente.',
    }
  }

  await syncProfileRoleExtensions(serviceSupabase, parsed.data.user_id, newRole)

  await logAudit({
    actorId:    authUser.id,
    action:     'profile.role_changed',
    entityType: 'profiles',
    entityId:   parsed.data.user_id,
    oldValues:  { role: oldRole },
    newValues:  { role: newRole, cancelled_enrollments: cancelledEnrollments },
  })

  revalidatePath('/admin/usuarios')
  revalidatePath('/admin/inscricoes')
  revalidatePath('/admin/turmas')
  revalidatePath('/assistente/inscricoes')
  revalidatePath('/assistente/turmas')
  return { success: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// Alterar status do usuário
// ─────────────────────────────────────────────────────────────
export async function updateUserStatusAction(
  userId: string,
  status: UserStatus
): Promise<ActionResult> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }
  requireAdmin(authUser.role)

  if (userId === authUser.id) {
    return { success: false, error: 'Você não pode alterar seu próprio status.' }
  }

  const supabase = await createClient()
  const serviceSupabase = await createServiceClient()

  const { data: target } = await serviceSupabase
    .from('profiles')
    .select('email, role, status')
    .eq('id', userId)
    .single()

  if (!target) {
    return { success: false, error: 'Usuário não encontrado.' }
  }

  if (isProtectedAdminEmail(target.email)) {
    return {
      success: false,
      error: 'Esta conta é protegida e não pode ser bloqueada pelo painel.',
    }
  }

  if (target.role === 'admin' && status === 'blocked') {
    const adminCount = await countActiveAdmins(supabase)
    if (adminCount <= 1) {
      return {
        success: false,
        error: 'Não é possível bloquear o último administrador ativo do sistema.',
      }
    }
  }

  const { data: updated, error } = await serviceSupabase
    .from('profiles')
    .update({ status })
    .eq('id', userId)
    .select('id, status')
    .single()

  if (error || !updated || updated.status !== status) {
    console.error('[updateUserStatusAction]', error?.message)
    return {
      success: false,
      error: error?.message
        ? `Erro ao alterar status: ${error.message}`
        : 'Erro ao alterar status.',
    }
  }

  await logAudit({
    actorId:    authUser.id,
    action:     'profile.status_changed',
    entityType: 'profiles',
    entityId:   userId,
    oldValues:  { status: target.status },
    newValues:  { status },
  })

  revalidatePath('/admin/usuarios')
  return { success: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// Excluir/Anonimizar beneficiário (exclusão LGPD)
// ─────────────────────────────────────────────────────────────
export async function anonymizeBeneficiaryAction(userId: string): Promise<ActionResult> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }
  requireAdmin(authUser.role)

  const serviceSupabase = await createServiceClient()

  const { data: targetProfile } = await serviceSupabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single()

  if (isProtectedAdminEmail(targetProfile?.email)) {
    return { success: false, error: 'Esta conta é protegida e não pode ser anonimizada.' }
  }

  // Anonimiza dados pessoais em vez de deletar para manter integridade
  const anonymizedName  = `[Anonimizado ${Date.now()}]`
  const anonymizedEmail = `anonimizado_${Date.now()}@excluido.local`

  const { error: profileError } = await serviceSupabase
    .from('profiles')
    .update({
      full_name:       anonymizedName,
      email:           anonymizedEmail,
      phone:           null,
      document_number: null,
      birth_date:      null,
      avatar_url:      null,
      status:          'inactive',
    })
    .eq('id', userId)

  if (profileError) {
    return { success: false, error: 'Erro ao anonimizar dados.' }
  }

  await serviceSupabase
    .from('beneficiary_profiles')
    .update({
      social_name:             null,
      vulnerability_notes:     null,
      emergency_contact_name:  null,
      emergency_contact_phone: null,
    })
    .eq('profile_id', userId)

  // Desativa conta no Auth
  await serviceSupabase.auth.admin.updateUserById(userId, {
    email:           anonymizedEmail,
    ban_duration:    'none',
    user_metadata:   {},
  })

  await logAudit({
    actorId:    authUser.id,
    action:     'beneficiary.deleted',
    entityType: 'profiles',
    entityId:   userId,
    newValues:  { action: 'anonymized' },
  })

  revalidatePath('/admin/beneficiarios')
  return { success: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// Remover inscrições como aluno (equipe promovida de beneficiário)
// ─────────────────────────────────────────────────────────────
export async function cancelProfileStudentEnrollmentsAction(
  profileId: string,
): Promise<ActionResult<{ cancelled: number }>> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }
  requireAdmin(authUser.role)

  if (profileId === authUser.id) {
    return { success: false, error: 'Use outra conta admin para limpar suas próprias inscrições.' }
  }

  const serviceSupabase = await createServiceClient()

  const { data: target } = await serviceSupabase
    .from('profiles')
    .select('id, full_name, role, email')
    .eq('id', profileId)
    .single()

  if (!target) {
    return { success: false, error: 'Usuário não encontrado.' }
  }

  if (target.role === 'beneficiary') {
    return {
      success: false,
      error:
        'Este usuário ainda é beneficiário. Para cancelar inscrições, use Inscrições no menu ou altere o status da matrícula.',
    }
  }

  let cancelled = 0
  try {
    cancelled = await cancelProfileStudentEnrollments(
      serviceSupabase,
      profileId,
      'Removido manualmente — conta da equipe não deve constar como aluno.',
    )
  } catch {
    return { success: false, error: 'Erro ao cancelar inscrições.' }
  }

  if (cancelled === 0) {
    return { success: false, error: 'Nenhuma inscrição ativa encontrada para este usuário.' }
  }

  await logAudit({
    actorId:    authUser.id,
    action:     'enrollment.cancelled',
    entityType: 'profiles',
    entityId:   profileId,
    newValues:  {
      cancelled_enrollments: cancelled,
      target_name: target.full_name,
      reason: 'staff_student_cleanup',
    },
  })

  revalidatePath('/admin/usuarios')
  revalidatePath('/admin/inscricoes')
  revalidatePath('/admin/turmas')
  revalidatePath('/assistente/inscricoes')
  revalidatePath('/assistente/turmas')
  return { success: true, data: { cancelled } }
}
