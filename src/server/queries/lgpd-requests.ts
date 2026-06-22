import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import { isLgpdRequestActive } from '@/lib/lgpd/status'
import { buildInitialLgpdMessageBody } from '@/lib/lgpd/build-initial-message'
import {
  LGPD_REQUEST_SELECT,
  normalizeLgpdRequest,
  normalizeLgpdRequests,
  type RawLgpdRequestRow,
} from '@/lib/lgpd/normalize-request'
import { hasUnreadStaffReply } from '@/lib/lgpd/unread'
import type { DataSubjectRequest, LgpdRequestMessage, LgpdUserSummary } from '@/types/domain'

export async function getOwnLgpdRequests(profileId: string): Promise<DataSubjectRequest[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('data_subject_requests')
    .select('*')
    .eq('profile_id', profileId)
    .order('requested_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as DataSubjectRequest[]
}

export async function getAllLgpdRequests(): Promise<DataSubjectRequest[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('data_subject_requests')
    .select(LGPD_REQUEST_SELECT)
    .order('requested_at', { ascending: false })

  if (error) throw error
  return normalizeLgpdRequests((data ?? []) as RawLgpdRequestRow[])
}

export async function getLgpdRequestsByProfileId(
  profileId: string,
): Promise<DataSubjectRequest[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('data_subject_requests')
    .select(LGPD_REQUEST_SELECT)
    .eq('profile_id', profileId)
    .order('requested_at', { ascending: false })

  if (error) throw error
  return normalizeLgpdRequests((data ?? []) as RawLgpdRequestRow[])
}

export async function getLgpdUsersWithRequests(): Promise<LgpdUserSummary[]> {
  const requests = await getAllLgpdRequests()
  const grouped = new Map<string, DataSubjectRequest[]>()

  for (const request of requests) {
    const list = grouped.get(request.profile_id) ?? []
    list.push(request)
    grouped.set(request.profile_id, list)
  }

  const summaries: LgpdUserSummary[] = []

  for (const [profileId, userRequests] of grouped) {
    const sorted = [...userRequests].sort(
      (a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime(),
    )
    const profile = sorted[0].profile
    if (!profile) continue

    const activeCount = sorted.filter(r => isLgpdRequestActive(r.status)).length

    summaries.push({
      profile_id:          profileId,
      profile:             { full_name: profile.full_name, email: profile.email },
      requests:            sorted,
      total_count:         sorted.length,
      active_count:        activeCount,
      latest_requested_at: sorted[0].requested_at,
      needs_attention:     sorted.some(
        r => r.status === 'open' || r.status === 'waiting_user' || r.status === 'in_review',
      ),
    })
  }

  return summaries.sort(
    (a, b) => new Date(b.latest_requested_at).getTime() - new Date(a.latest_requested_at).getTime(),
  )
}

export async function getLgpdRequestById(requestId: string): Promise<DataSubjectRequest | null> {
  const serviceSupabase = createServiceClient()
  const { data, error } = await serviceSupabase
    .from('data_subject_requests')
    .select(LGPD_REQUEST_SELECT)
    .eq('id', requestId)
    .maybeSingle()

  if (error) {
    console.error('getLgpdRequestById:', error)
    return null
  }

  if (!data) return null
  return normalizeLgpdRequest(data as RawLgpdRequestRow)
}

export async function getLgpdRequestMessages(
  requestId: string,
): Promise<LgpdRequestMessage[]> {
  const serviceSupabase = createServiceClient()
  const { data, error } = await serviceSupabase
    .from('data_subject_request_messages')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('getLgpdRequestMessages:', error)
    return []
  }

  const messages = (data ?? []) as LgpdRequestMessage[]
  if (messages.length === 0) return []

  const senderIds = [...new Set(messages.map(m => m.sender_id))]
  const { data: profiles } = await serviceSupabase
    .from('profiles')
    .select('id, full_name, role')
    .in('id', senderIds)

  const profileMap = new Map(
    (profiles ?? []).map(p => [p.id, { full_name: p.full_name, role: p.role }]),
  )

  return Promise.all(
    messages.map(async message => {
      const enriched = {
        ...message,
        profiles: profileMap.get(message.sender_id),
      }
      return enrichMessageAttachment(enriched)
    }),
  )
}

function legacyMessageFromRequest(request: DataSubjectRequest): LgpdRequestMessage | null {
  const body = buildInitialLgpdMessageBody(request)
  if (!body) return null

  return {
    id:               `legacy-${request.id}`,
    request_id:       request.id,
    sender_id:        request.profile_id,
    body,
    attachment_path:  null,
    attachment_name:  null,
    attachment_mime:  null,
    created_at:       request.requested_at,
    profiles: request.profile
      ? { full_name: request.profile.full_name, role: request.profile.role }
      : undefined,
  }
}

/** Mensagens do ticket, incluindo descrição inicial de solicitações antigas sem registro na conversa. */
export async function getLgpdThreadForRequest(
  request: DataSubjectRequest,
): Promise<LgpdRequestMessage[]> {
  const messages = await getLgpdRequestMessages(request.id)
  if (messages.length > 0) return messages

  const legacy = legacyMessageFromRequest(request)
  return legacy ? [legacy] : []
}

async function enrichMessageAttachment(
  message: LgpdRequestMessage,
): Promise<LgpdRequestMessage> {
  if (!message.attachment_path) return message

  try {
    const serviceSupabase = createServiceClient()
    const { data, error } = await serviceSupabase.storage
      .from('lgpd-attachments')
      .createSignedUrl(message.attachment_path, 3600)

    if (error) {
      console.error('enrichMessageAttachment:', error.message)
      return message
    }

    return {
      ...message,
      attachment_url: data?.signedUrl ?? null,
    }
  } catch (error) {
    console.error('enrichMessageAttachment:', error)
    return message
  }
}

export async function uploadLgpdAttachment(
  requestId: string,
  file: File,
): Promise<{ path: string; name: string; mime: string } | null> {
  const maxBytes = 5 * 1024 * 1024
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']

  if (file.size === 0 || file.size > maxBytes) return null
  if (!allowed.includes(file.type)) return null

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const safeName = file.name.replace(/[^\w.\-() ]/g, '_').slice(0, 120)
  const path = `${requestId}/${crypto.randomUUID()}.${ext}`

  const serviceSupabase = createServiceClient()
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await serviceSupabase.storage
    .from('lgpd-attachments')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    console.error('uploadLgpdAttachment:', error)
    return null
  }

  return { path, name: safeName, mime: file.type }
}

export async function assertCanAccessLgpdRequest(
  request: DataSubjectRequest,
): Promise<boolean> {
  const authUser = await getAuthUser()
  if (!authUser) return false
  if (request.profile_id === authUser.id) return true
  return authUser.role === 'admin' || authUser.role === 'assistant'
}

async function getLatestMessageForRequest(
  requestId: string,
): Promise<{ sender_id: string; created_at: string } | null> {
  const serviceSupabase = createServiceClient()
  const { data } = await serviceSupabase
    .from('data_subject_request_messages')
    .select('sender_id, created_at')
    .eq('request_id', requestId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data
}

export async function requestHasUnreadStaffReply(
  request: DataSubjectRequest,
): Promise<boolean> {
  const latest = await getLatestMessageForRequest(request.id)
  return hasUnreadStaffReply(request, latest)
}

/** Quantidade de tickets LGPD com resposta nova da equipe (badge no menu). */
export async function getBeneficiaryLgpdUnreadCount(profileId: string): Promise<number> {
  const serviceSupabase = createServiceClient()
  const { data: requests, error } = await serviceSupabase
    .from('data_subject_requests')
    .select('*')
    .eq('profile_id', profileId)
    .in('status', ['open', 'in_review', 'waiting_user'])

  if (error || !requests?.length) return 0

  let unread = 0
  for (const request of requests) {
    const latest = await getLatestMessageForRequest(request.id)
    if (hasUnreadStaffReply(request as DataSubjectRequest, latest)) {
      unread++
    }
  }
  return unread
}

export async function getOwnLgpdRequestsWithUnread(
  profileId: string,
): Promise<DataSubjectRequest[]> {
  const requests = await getOwnLgpdRequests(profileId)
  return Promise.all(
    requests.map(async request => ({
      ...request,
      has_unread_reply: await requestHasUnreadStaffReply(request),
    })),
  )
}

export async function markLgpdRequestReadByTitular(requestId: string, profileId: string): Promise<void> {
  const serviceSupabase = createServiceClient()
  const now = new Date().toISOString()

  await serviceSupabase
    .from('data_subject_requests')
    .update({ titular_last_read_at: now })
    .eq('id', requestId)
    .eq('profile_id', profileId)
}
