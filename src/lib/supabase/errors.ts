import type { PostgrestError } from '@supabase/supabase-js'

export function mapSupabaseWriteError(
  error: PostgrestError | null,
  fallback: string,
): string {
  if (!error) return fallback

  const code = error.code ?? ''
  const message = error.message ?? ''
  const details = `${code} ${message}`.toLowerCase()

  if (
    details.includes('class_activities') &&
    (details.includes('does not exist') || details.includes('schema cache') || code === '42P01')
  ) {
    return 'A tabela de atividades ainda não existe no banco. Execute as migrations 019, 020 e 021 no Supabase (nesta ordem).'
  }

  if (code === '42501' || details.includes('permission denied') || details.includes('row-level security')) {
    return 'Sem permissão para gravar atividades. Verifique se as migrations 019–021 foram aplicadas no Supabase.'
  }

  if (process.env.NODE_ENV === 'development') {
    return `${fallback} (${code || 'erro'}: ${message})`
  }

  return fallback
}
