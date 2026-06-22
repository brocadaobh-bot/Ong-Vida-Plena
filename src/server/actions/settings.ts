'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import { requireAdmin } from '@/lib/auth/permissions'
import {
  getSettingMeta,
  parseSettingValue,
  serializeSettingValue,
} from '@/lib/settings/app-settings'
import { logAudit } from '@/server/services/audit'
import type { ActionResult } from '@/types/domain'

export async function updateAppSettingAction(formData: FormData): Promise<ActionResult> {
  const authUser = await getAuthUser()
  if (!authUser) return { success: false, error: 'Não autenticado.' }

  try {
    requireAdmin(authUser.role)
  } catch {
    return { success: false, error: 'Sem permissão para alterar configurações.' }
  }

  const key = formData.get('key')
  const raw = formData.get('value')

  if (!key || typeof key !== 'string') {
    return { success: false, error: 'Configuração inválida.' }
  }
  if (raw === null || typeof raw !== 'string') {
    return { success: false, error: 'Informe um valor.' }
  }

  const meta = getSettingMeta(key)

  let newValue: string | number | boolean
  try {
    newValue = serializeSettingValue(raw, meta.type)
  } catch {
    return { success: false, error: 'Valor inválido para esta configuração.' }
  }

  if (meta.type === 'number' && typeof newValue === 'number' && newValue < 0) {
    return { success: false, error: 'O valor não pode ser negativo.' }
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('app_settings')
    .select('value, description')
    .eq('key', key)
    .maybeSingle()

  const payload = {
    value: newValue,
    updated_by: authUser.id,
  }

  const { error } = existing
    ? await supabase.from('app_settings').update(payload).eq('key', key)
    : await supabase.from('app_settings').insert({
        key,
        ...payload,
        description: meta.description || null,
      })

  if (error) {
    console.error('updateAppSetting error:', error)
    return { success: false, error: 'Erro ao salvar configuração.' }
  }

  await logAudit({
    actorId:    authUser.id,
    action:     'settings.updated',
    entityType: 'app_settings',
    entityId:   key,
    oldValues:  existing ? { value: parseSettingValue(existing.value) } : undefined,
    newValues:  { value: newValue },
  })

  revalidatePath('/admin/configuracoes')
  return { success: true, data: undefined }
}
