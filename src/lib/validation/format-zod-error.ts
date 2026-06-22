import type { ZodError } from 'zod'

const FIELD_LABELS: Record<string, string> = {
  gender:                  'Gênero',
  education_level:         'Escolaridade',
  employment_status:       'Situação de emprego',
  family_income_range:     'Faixa de renda familiar',
  social_name:             'Nome social',
  emergency_contact_name:  'Nome do contato de emergência',
  emergency_contact_phone: 'Telefone de emergência',
  postal_code:             'CEP',
  street:                  'Logradouro',
  number:                  'Número',
  complement:              'Complemento',
  district:                'Bairro',
  city:                    'Cidade',
  state:                   'UF',
  full_name:               'Nome completo',
  phone:                   'Telefone',
  birth_date:              'Data de nascimento',
  document_type:           'Tipo de documento',
  document_number:         'Número do documento',
}

/** Converte erro do Zod em mensagem clara em português para o usuário. */
export function formatZodError(error: ZodError): string {
  const issue = error.errors[0]
  if (!issue) return 'Verifique os dados informados e tente novamente.'

  const fieldKey = String(issue.path[0] ?? '')
  const label = FIELD_LABELS[fieldKey] ?? 'Campo'

  if (issue.code === 'invalid_enum_value') {
    return `${label}: selecione uma opção da lista ou deixe em branco se for opcional.`
  }

  if (issue.code === 'too_small' && issue.type === 'string' && issue.minimum === 2 && fieldKey === 'state') {
    return 'UF: informe a sigla do estado com 2 letras (ex.: SP) ou deixe em branco.'
  }

  if (issue.code === 'invalid_type' && issue.received === 'null' && issue.expected === 'string') {
    return `${label}: preencha este campo ou salve novamente a página.`
  }

  if (issue.message && !issue.message.startsWith('Invalid enum')) {
    return issue.message
  }

  return `${label}: valor inválido. Verifique o preenchimento.`
}
