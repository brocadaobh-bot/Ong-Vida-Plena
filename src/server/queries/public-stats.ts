import { unstable_cache } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import type { PublicLandingStats, PlatformRating } from '@/lib/stats/public-landing-stats'

const EMPTY_STATS: PublicLandingStats = {
  users_served: 0,
  courses_available: 0,
  satisfaction_rate: null,
  satisfaction_count: 0,
  social_impact_years: 12,
}

const RPC_TIMEOUT_MS = 5_000

function isAbortError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return error.name === 'AbortError' || error.message.toLowerCase().includes('aborted')
}

function parseLandingStats(data: unknown): PublicLandingStats {
  const stats = data as Partial<PublicLandingStats> | null
  if (!stats) return EMPTY_STATS

  return {
    users_served: stats.users_served ?? 0,
    courses_available: stats.courses_available ?? 0,
    satisfaction_rate: stats.satisfaction_rate ?? null,
    satisfaction_count: stats.satisfaction_count ?? 0,
    social_impact_years: stats.social_impact_years ?? 12,
  }
}

async function getPublicLandingStatsFallback(): Promise<PublicLandingStats> {
  const supabase = createServiceClient()

  const [
    { count: coursesCount },
    { count: enrollmentsCount },
    { count: beneficiariesCount },
    ratingsResult,
  ] = await Promise.all([
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .not('status', 'in', '(cancelled,rejected)'),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'beneficiary')
      .neq('status', 'blocked'),
    supabase.from('platform_ratings').select('score'),
  ])

  let satisfaction_rate: number | null = null
  let satisfaction_count = 0

  if (!ratingsResult.error && ratingsResult.data?.length) {
    satisfaction_count = ratingsResult.data.length
    const avg =
      ratingsResult.data.reduce((sum, row) => sum + row.score, 0) / satisfaction_count
    satisfaction_rate = Math.round((avg / 5) * 100)
  }

  const usersServed = Math.max(enrollmentsCount ?? 0, beneficiariesCount ?? 0)

  return {
    users_served: usersServed,
    courses_available: coursesCount ?? 0,
    satisfaction_rate,
    satisfaction_count,
    social_impact_years: 12,
  }
}

async function tryRpcLandingStats(): Promise<PublicLandingStats | null> {
  const supabase = createServiceClient()

  const rpcPromise = (async (): Promise<PublicLandingStats | null> => {
    try {
      const { data, error } = await supabase.rpc('get_public_landing_stats')
      if (error || !data) return null
      return parseLandingStats(data)
    } catch {
      return null
    }
  })()

  const timeoutPromise = new Promise<null>(resolve => {
    setTimeout(() => resolve(null), RPC_TIMEOUT_MS)
  })

  return Promise.race([rpcPromise, timeoutPromise])
}

async function loadPublicLandingStats(): Promise<PublicLandingStats> {
  try {
    const fromRpc = await tryRpcLandingStats()
    if (fromRpc) return fromRpc
  } catch (error) {
    if (!isAbortError(error)) {
      console.warn('getPublicLandingStats RPC error:', error)
    }
  }

  try {
    return await getPublicLandingStatsFallback()
  } catch (error) {
    if (!isAbortError(error)) {
      console.error('getPublicLandingStats fallback failed:', error)
    }
    return EMPTY_STATS
  }
}

export const getPublicLandingStats = unstable_cache(
  loadPublicLandingStats,
  ['public-landing-stats'],
  { revalidate: 120, tags: ['public-landing-stats'] },
)

export async function getMyPlatformRating(userId: string): Promise<PlatformRating | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('platform_ratings')
    .select('score, comment, updated_at')
    .eq('profile_id', userId)
    .maybeSingle()

  if (error) {
    if (error.code !== 'PGRST205' && !error.message?.includes('does not exist')) {
      console.error('getMyPlatformRating error:', error.message, error.code)
    }
    return null
  }

  if (!data) return null

  return {
    score: data.score,
    comment: data.comment,
    updated_at: data.updated_at,
  }
}
