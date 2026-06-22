export interface PublicLandingStats {
  users_served: number
  courses_available: number
  satisfaction_rate: number | null
  satisfaction_count: number
  social_impact_years: number
}

export interface PlatformRating {
  score: number
  comment: string | null
  updated_at: string
}

export function formatLandingStatNumber(value: number): string {
  return value.toLocaleString('pt-BR')
}

export function formatSatisfactionRate(
  rate: number | null,
  count: number,
): { value: string; hint: string | null } {
  if (rate == null || count === 0) {
    return {
      value: '—',
      hint: 'Avalie a plataforma para calcular',
    }
  }

  return {
    value: `${rate}%`,
    hint: count === 1 ? '1 avaliação' : `${formatLandingStatNumber(count)} avaliações`,
  }
}
