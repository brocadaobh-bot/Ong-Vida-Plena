import type { DataSubjectRequest, LgpdProfileEmbed } from '@/types/domain'

type LgpdProfileEmbedRow = LgpdProfileEmbed

export type RawLgpdRequestRow = DataSubjectRequest & {
  profile?: LgpdProfileEmbedRow | null
  profiles?: LgpdProfileEmbedRow | null
}

/** PostgREST embute o join em `profiles`; normalizamos para `profile`. */
export function normalizeLgpdRequest(raw: RawLgpdRequestRow): DataSubjectRequest {
  const { profiles, profile, ...rest } = raw
  return {
    ...rest,
    profile: profile ?? profiles ?? undefined,
  }
}

export function normalizeLgpdRequests(rows: RawLgpdRequestRow[]): DataSubjectRequest[] {
  return rows.map(normalizeLgpdRequest)
}

const LGPD_REQUEST_SELECT = '*, profiles!profile_id(full_name, email, role)'

export { LGPD_REQUEST_SELECT }
