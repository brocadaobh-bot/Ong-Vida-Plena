export type SettingType = 'boolean' | 'string' | 'number'
export type SettingGroup = 'geral' | 'cadastro' | 'inscricoes' | 'turmas' | 'lgpd'

export interface AppSettingMeta {
  key: string
  label: string
  description: string
  type: SettingType
  group: SettingGroup
}

export const APP_SETTINGS_GROUPS: Record<SettingGroup, string> = {
  geral:      'Geral',
  cadastro:   'Cadastro e acesso',
  inscricoes: 'Inscrições',
  turmas:     'Turmas',
  lgpd:       'LGPD e dados',
}

/** Metadados em português (Brasil) para as chaves conhecidas */
export const APP_SETTINGS_META: AppSettingMeta[] = [
  {
    key: 'app_name',
    label: 'Nome do aplicativo',
    description: 'Nome exibido na plataforma e nos e-mails.',
    type: 'string',
    group: 'geral',
  },
  {
    key: 'require_email_confirmation',
    label: 'Exigir confirmação de e-mail',
    description:
      'Quando desativado, novos usuários entram direto após o cadastro (recomendado no plano gratuito do Supabase).',
    type: 'boolean',
    group: 'cadastro',
  },
  {
    key: 'allow_self_enrollment',
    label: 'Permitir auto-inscrição',
    description: 'Usuários podem se inscrever em turmas abertas sem assistente.',
    type: 'boolean',
    group: 'inscricoes',
  },
  {
    key: 'enrollment_requires_approval',
    label: 'Inscrição requer aprovação',
    description: 'Inscrições ficam pendentes até confirmação manual da equipe.',
    type: 'boolean',
    group: 'inscricoes',
  },
  {
    key: 'max_class_capacity',
    label: 'Capacidade máxima da turma',
    description: 'Limite padrão de vagas ao criar novas turmas.',
    type: 'number',
    group: 'turmas',
  },
  {
    key: 'data_retention_days',
    label: 'Dias de retenção de dados',
    description: 'Período de guarda dos dados pessoais (padrão: 1825 dias ≈ 5 anos).',
    type: 'number',
    group: 'lgpd',
  },
]

const META_BY_KEY = new Map(APP_SETTINGS_META.map(m => [m.key, m]))

export function getSettingMeta(key: string): AppSettingMeta {
  const known = META_BY_KEY.get(key)
  if (known) return known

  return {
    key,
    label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    description: '',
    type: inferSettingType(key),
    group: 'geral',
  }
}

function inferSettingType(key: string): SettingType {
  if (
    key.includes('require') ||
    key.includes('allow') ||
    key.includes('enable') ||
    key.startsWith('is_')
  ) {
    return 'boolean'
  }
  if (key.includes('days') || key.includes('capacity') || key.includes('max_') || key.includes('limit')) {
    return 'number'
  }
  return 'string'
}

export function parseSettingValue(value: unknown): string | number | boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === 'true') return true
    if (trimmed === 'false') return false
    const num = Number(trimmed)
    if (trimmed !== '' && !Number.isNaN(num)) return num
    return value
  }
  if (value === null || value === undefined) return ''
  return String(value)
}

export function formatSettingDisplay(value: unknown): string {
  const parsed = parseSettingValue(value)
  if (typeof parsed === 'boolean') return parsed ? 'Sim' : 'Não'
  if (typeof parsed === 'number') return parsed.toLocaleString('pt-BR')
  return String(parsed)
}

export function serializeSettingValue(
  raw: string,
  type: SettingType,
): string | number | boolean {
  switch (type) {
    case 'boolean':
      return raw === 'true'
    case 'number': {
      const num = Number(raw)
      if (Number.isNaN(num)) throw new Error('Valor numérico inválido.')
      return num
    }
    default:
      return raw
  }
}
