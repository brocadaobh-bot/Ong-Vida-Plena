'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import { requireAdminOrAssistant } from '@/lib/auth/permissions'
import {
  dataSubjectRequestSchema,
  lgpdRequestMessageSchema,
  processRequestSchema,
} from '@/lib/validation/schemas'
import { logAudit } from '@/server/services/audit'
import {
  getLgpdRequestById,
  markLgpdRequestReadByTitular,
  uploadLgpdAttachment,
} from '@/server/queries/lgpd-requests'
import { isLgpdRequestActive } from '@/lib/lgpd/status'
import { buildInitialLgpdMessageBody } from '@/lib/lgpd/build-initial-message'
import type { ActionResult } from '@/types/domain'

function revalidateLgpdPaths(requestId?: string, profileId?: string) {
  revalidatePath('/admin/lgpd')
  revalidatePath('/assistente/lgpd')
  revalidatePath('/beneficiario/lgpd')
  revalidatePath('/beneficiario', 'layout')

  if (profileId) {
    revalidatePath(`/admin/lgpd/usuario/${profileId}`)
    revalidatePath(`/assistente/lgpd/usuario/${profileId}`)
  }
  if (requestId) {
    revalidatePath(`/beneficiario/lgpd/${requestId}`)
    revalidatePath(`/admin/lgpd/${requestId}`)
    revalidatePath(`/assistente/lgpd/${requestId}`)
  }
}

async function insertLgpdMessage(params: {
  requestId: string
  senderId: string
  body: string
  attachment?: { path: string; name: string; mime: string } | null
}) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('data_subject_request_messages').insert({
    request_id:      params.requestId,
    sender_id:       params.senderId,
    body:            params.body.trim(),
    attachment_path: params.attachment?.path ?? null,
    attachment_name: params.attachment?.name ?? null,
    attachment_mime: params.attachment?.mime ?? null,
  })

  if (error) throw error
}

async function notifyLgpdUpdate(profileId: string, title: string, message: string) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('notifications').insert({
    profile_id: profileId,
    title,
    message,
    type:       'lgpd',
  })
  if (error) console.error('[notifyLgpdUpdate]', error.message)
}

// ─────────────────────────────────────────────────────────────
// Criar solicitação LGPD (titular)
// ─────────────────────────────────────────────────────────────
export async function createDataSubjectRequestAction(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }

  const requestType = formData.get('request_type')
  const correctFullName = String(formData.get('correct_full_name') ?? '').trim()
  const requestedChanges =
    requestType === 'correction' && correctFullName
      ? { full_name: correctFullName }
      : undefined

  const parsed = dataSubjectRequestSchema.safeParse({
    request_type:      requestType,
    description:       formData.get('description'),
    requested_changes: requestedChanges,
    correct_full_name: correctFullName || undefined,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()

  const { data: request, error } = await supabase
    .from('data_subject_requests')
    .insert({
      profile_id:        authUser.id,
      request_type:      parsed.data.request_type,
      description:       parsed.data.description,
      requested_changes: parsed.data.requested_changes ?? null,
      status:            'open',
    })
    .select('id')
    .single()

  if (error || !request) {
    return { success: false, error: 'Erro ao criar solicitação.' }
  }

  const attachmentFile = formData.get('attachment')
  let attachment: { path: string; name: string; mime: string } | null = null
  if (attachmentFile instanceof File && attachmentFile.size > 0) {
    attachment = await uploadLgpdAttachment(request.id, attachmentFile)
    if (!attachment) {
      return {
        success: false,
        error: 'Anexo inválido. Envie JPG, PNG, WEBP ou PDF de até 5 MB.',
      }
    }
  }

  const initialBody = buildInitialLgpdMessageBody({
    description:       parsed.data.description,
    requested_changes: parsed.data.requested_changes ?? null,
    request_type:      parsed.data.request_type,
  })

  if (!initialBody) {
    await createServiceClient().from('data_subject_requests').delete().eq('id', request.id)
    return { success: false, error: 'Descrição da solicitação inválida.' }
  }

  try {
    await insertLgpdMessage({
      requestId: request.id,
      senderId:  authUser.id,
      body:      initialBody,
      attachment,
    })
    await markLgpdRequestReadByTitular(request.id, authUser.id)
  } catch (messageError) {
    console.error('[createDataSubjectRequest] message insert:', messageError)
    await createServiceClient().from('data_subject_requests').delete().eq('id', request.id)
    return {
      success: false,
      error: 'Erro ao registrar a solicitação. Tente novamente ou contate a administração.',
    }
  }

  await logAudit({
    actorId:    authUser.id,
    action:     'lgpd_request.created',
    entityType: 'data_subject_requests',
    entityId:   request.id,
    newValues:  { request_type: parsed.data.request_type },
  })

  revalidateLgpdPaths(request.id, authUser.id)
  return { success: true, data: { id: request.id } }
}

// ─────────────────────────────────────────────────────────────
// Marcar conversa LGPD como lida (titular)
// ─────────────────────────────────────────────────────────────
export async function markLgpdRequestReadAction(requestId: string): Promise<ActionResult> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }

  const request = await getLgpdRequestById(requestId)
  if (!request) return { success: false, error: 'Solicitação não encontrada.' }
  if (request.profile_id !== authUser.id) {
    return { success: false, error: 'Permissão negada.' }
  }

  await markLgpdRequestReadByTitular(requestId, authUser.id)
  revalidateLgpdPaths(requestId, authUser.id)

  return { success: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// Enviar mensagem na conversa do ticket LGPD
// ─────────────────────────────────────────────────────────────
export async function sendLgpdRequestMessageAction(
  formData: FormData,
): Promise<ActionResult> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }

  const parsed = lgpdRequestMessageSchema.safeParse({
    request_id: formData.get('request_id'),
    body:       formData.get('body'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const request = await getLgpdRequestById(parsed.data.request_id)
  if (!request) return { success: false, error: 'Solicitação não encontrada.' }

  const isStaff = authUser.role === 'admin' || authUser.role === 'assistant'
  const isOwner = request.profile_id === authUser.id

  if (!isOwner && !isStaff) {
    return { success: false, error: 'Permissão negada.' }
  }

  if (!isLgpdRequestActive(request.status)) {
    return { success: false, error: 'Esta solicitação já foi encerrada.' }
  }

  const attachmentFile = formData.get('attachment')
  let attachment: { path: string; name: string; mime: string } | null = null
  if (attachmentFile instanceof File && attachmentFile.size > 0) {
    attachment = await uploadLgpdAttachment(request.id, attachmentFile)
    if (!attachment) {
      return {
        success: false,
        error: 'Anexo inválido. Envie JPG, PNG, WEBP ou PDF de até 5 MB.',
      }
    }
  }

  await insertLgpdMessage({
    requestId: request.id,
    senderId:  authUser.id,
    body:      parsed.data.body,
    attachment,
  })

  const supabase = createServiceClient()
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (isStaff) {
    updateData.assigned_to = authUser.id
    if (request.status === 'open') {
      updateData.status = 'in_review'
    }
  } else if (request.status === 'waiting_user') {
    updateData.status = 'in_review'
  }

  await supabase
    .from('data_subject_requests')
    .update(updateData as import('@/types/database').Database['public']['Tables']['data_subject_requests']['Update'])
    .eq('id', request.id)

  if (isStaff && request.profile_id) {
    await notifyLgpdUpdate(
      request.profile_id,
      'Nova mensagem na sua solicitação LGPD',
      'A equipe respondeu sua solicitação. Acesse Meus Dados (LGPD) para continuar a conversa.',
    )
  }

  revalidateLgpdPaths(request.id, request.profile_id)
  return { success: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// Processar solicitação LGPD (admin/assistente)
// ─────────────────────────────────────────────────────────────
export async function processDataSubjectRequestAction(formData: FormData): Promise<ActionResult> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }
  requireAdminOrAssistant(authUser.role)

  const parsed = processRequestSchema.safeParse({
    request_id:     formData.get('request_id'),
    status:         formData.get('status'),
    response_notes: formData.get('response_notes') || null,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()

  const { data: old } = await supabase
    .from('data_subject_requests')
    .select('status, profile_id, request_type')
    .eq('id', parsed.data.request_id)
    .single()

  if (!old) return { success: false, error: 'Solicitação não encontrada.' }

  const updateData: Record<string, unknown> = {
    status:      parsed.data.status,
    assigned_to: authUser.id,
  }

  if (parsed.data.response_notes?.trim()) {
    updateData.response_notes = parsed.data.response_notes.trim()
  }

  if (parsed.data.status === 'completed') {
    updateData.completed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('data_subject_requests')
    .update(updateData as import('@/types/database').Database['public']['Tables']['data_subject_requests']['Update'])
    .eq('id', parsed.data.request_id)

  if (error) {
    return { success: false, error: 'Erro ao processar solicitação.' }
  }

  if (parsed.data.response_notes?.trim()) {
    await insertLgpdMessage({
      requestId: parsed.data.request_id,
      senderId:  authUser.id,
      body:      parsed.data.response_notes.trim(),
    })
  }

  await logAudit({
    actorId:    authUser.id,
    action:     'lgpd_request.status_changed',
    entityType: 'data_subject_requests',
    entityId:   parsed.data.request_id,
    oldValues:  { status: old.status },
    newValues:  { status: parsed.data.status },
  })

  if (old.profile_id) {
    const statusMessages: Record<string, string> = {
      completed:    'Sua solicitação foi concluída. Acesse Meus Dados (LGPD) para ver os detalhes.',
      rejected:     'Sua solicitação não pôde ser atendida. Veja a conversa em Meus Dados (LGPD).',
      in_review:    'Sua solicitação está em análise.',
      waiting_user: 'Precisamos de informações adicionais. Responda na conversa da solicitação.',
    }

    const message =
      statusMessages[parsed.data.status] ??
      'Status da sua solicitação foi atualizado. Acesse Meus Dados (LGPD).'

    await notifyLgpdUpdate(old.profile_id, 'Atualização de Solicitação LGPD', message)
  }

  revalidateLgpdPaths(parsed.data.request_id, old?.profile_id)
  return { success: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// Revogar consentimento
// ─────────────────────────────────────────────────────────────
export async function revokeConsentAction(consentId: string): Promise<ActionResult> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }

  const supabase = await createClient()

  const { data: consent } = await supabase
    .from('consents')
    .select('profile_id, consent_type')
    .eq('id', consentId)
    .single()

  if (!consent || consent.profile_id !== authUser.id) {
    return { success: false, error: 'Consentimento não encontrado.' }
  }

  if (consent.consent_type === 'privacy_policy' || consent.consent_type === 'data_processing') {
    return { success: false, error: 'Consentimentos obrigatórios não podem ser revogados. Para remover seus dados, faça uma solicitação de exclusão.' }
  }

  const { error } = await supabase
    .from('consents')
    .update({ revoked_at: new Date().toISOString(), granted: false })
    .eq('id', consentId)

  if (error) {
    return { success: false, error: 'Erro ao revogar consentimento.' }
  }

  await logAudit({
    actorId:    authUser.id,
    action:     'consent.revoked',
    entityType: 'consents',
    entityId:   consentId,
    newValues:  { consent_type: consent.consent_type },
  })

  revalidatePath('/beneficiario/consentimentos')
  return { success: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// Gerar exportação de dados (portabilidade)
// ─────────────────────────────────────────────────────────────
export async function generateDataExportAction(requestId: string): Promise<ActionResult<{ export_data: unknown }>> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }

  const supabase = await createClient()

  const { data: request } = await supabase
    .from('data_subject_requests')
    .select('id, profile_id, request_type, status')
    .eq('id', requestId)
    .single()

  if (!request) {
    return { success: false, error: 'Solicitação não encontrada.' }
  }

  if (request.profile_id !== authUser.id && !['admin', 'assistant'].includes(authUser.role)) {
    return { success: false, error: 'Permissão negada.' }
  }

  const targetProfileId = request.profile_id

  const { data: exportData, error } = await supabase
    .rpc('generate_beneficiary_export', { p_profile_id: targetProfileId })

  if (error) {
    return { success: false, error: 'Erro ao gerar exportação.' }
  }

  await supabase.from('data_exports').insert({
    request_id: requestId,
    profile_id: targetProfileId,
    format:     'json',
    created_by: authUser.id,
  })

  await logAudit({
    actorId:    authUser.id,
    action:     'data_export.created',
    entityType: 'data_subject_requests',
    entityId:   requestId,
  })

  revalidatePath('/beneficiario/lgpd')
  return { success: true, data: { export_data: exportData } }
}

// ─────────────────────────────────────────────────────────────
// Aceitar política de privacidade
// ─────────────────────────────────────────────────────────────
export async function acceptPrivacyPolicyAction(policyId: string): Promise<ActionResult> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }

  const supabase = await createClient()

  await supabase.from('consents').insert([
    {
      profile_id:        authUser.id,
      privacy_policy_id: policyId,
      consent_type:      'privacy_policy' as const,
      granted:           true,
    },
    {
      profile_id:        authUser.id,
      privacy_policy_id: policyId,
      consent_type:      'data_processing' as const,
      granted:           true,
    },
  ])

  await logAudit({
    actorId:    authUser.id,
    action:     'consent.granted',
    entityType: 'privacy_policies',
    entityId:   policyId,
  })

  revalidatePath('/', 'layout')
  return { success: true, data: undefined }
}
