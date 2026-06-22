import 'server-only'

import { createServiceClient } from '@/lib/supabase/server'
import { parseSettingValue } from '@/lib/settings/app-settings'

export async function getAppSetting(key: string, fallback: boolean): Promise<boolean>
export async function getAppSetting(key: string, fallback: number): Promise<number>
export async function getAppSetting(key: string, fallback: string): Promise<string>
export async function getAppSetting(
  key: string,
  fallback: string | number | boolean,
): Promise<string | number | boolean> {
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle()

    if (!data) return fallback

    const parsed = parseSettingValue(data.value)
    if (typeof fallback === 'boolean' && typeof parsed === 'boolean') return parsed
    if (typeof fallback === 'number' && typeof parsed === 'number') return parsed
    if (typeof fallback === 'string' && typeof parsed === 'string') return parsed

    return parsed as string | number | boolean
  } catch {
    return fallback
  }
}

export async function getRequireEmailConfirmation(): Promise<boolean> {
  return getAppSetting('require_email_confirmation', true)
}
