'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { updateAppSettingAction } from '@/server/actions/settings'
import {
  APP_SETTINGS_GROUPS,
  APP_SETTINGS_META,
  getSettingMeta,
  parseSettingValue,
  type SettingGroup,
} from '@/lib/settings/app-settings'

interface SettingRow {
  key: string
  value: unknown
  description: string | null
}

interface SettingsFormProps {
  settings: SettingRow[]
}

const GROUP_ORDER: SettingGroup[] = ['geral', 'cadastro', 'inscricoes', 'turmas', 'lgpd']

const BOOLEAN_OPTIONS = [
  { value: 'true',  label: 'Sim' },
  { value: 'false', label: 'Não' },
]

function valueToFormString(value: unknown, type: 'boolean' | 'string' | 'number'): string {
  const parsed = parseSettingValue(value)
  if (type === 'boolean') return parsed === true ? 'true' : 'false'
  return String(parsed)
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successKey, setSuccessKey] = useState<string | null>(null)

  const knownKeys = new Set(APP_SETTINGS_META.map(m => m.key))
  const orderedSettings = [
    ...APP_SETTINGS_META.map(meta => {
      const row = settings.find(s => s.key === meta.key)
      return row ?? { key: meta.key, value: meta.type === 'boolean' ? false : '', description: meta.description }
    }),
    ...settings.filter(s => !knownKeys.has(s.key)),
  ]

  const grouped = GROUP_ORDER.map(group => ({
    group,
    title: APP_SETTINGS_GROUPS[group],
    items: orderedSettings.filter(s => getSettingMeta(s.key).group === group),
  })).filter(g => g.items.length > 0)

  const uncategorized = orderedSettings.filter(
    s => !GROUP_ORDER.includes(getSettingMeta(s.key).group),
  )

  function handleSave(key: string, value: string) {
    setError(null)
    setSuccessKey(null)
    setSavingKey(key)

    const fd = new FormData()
    fd.set('key', key)
    fd.set('value', value)

    startTransition(async () => {
      const result = await updateAppSettingAction(fd)
      setSavingKey(null)

      if (result.success) {
        setSuccessKey(key)
        router.refresh()
        setTimeout(() => setSuccessKey(null), 3000)
      } else {
        setError(result.error)
      }
    })
  }

  function renderField(key: string, value: unknown, type: 'boolean' | 'string' | 'number') {
    const formValue = valueToFormString(value, type)

    if (type === 'boolean') {
      return (
        <Select
          key={`${key}-${formValue}`}
          options={BOOLEAN_OPTIONS}
          defaultValue={formValue}
          id={`setting-${key}`}
          onChange={e => handleSave(key, e.target.value)}
          disabled={isPending && savingKey === key}
        />
      )
    }

    if (type === 'number') {
      return (
        <div className="flex gap-2">
          <Input
            type="number"
            min={0}
            defaultValue={formValue}
            id={`setting-${key}`}
            className="max-w-[160px]"
            disabled={isPending && savingKey === key}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSave(key, (e.target as HTMLInputElement).value)
              }
            }}
          />
          <Button
            size="sm"
            variant="secondary"
            loading={isPending && savingKey === key}
            onClick={() => {
              const el = document.getElementById(`setting-${key}`) as HTMLInputElement | null
              if (el) handleSave(key, el.value)
            }}
          >
            Salvar
          </Button>
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          type="text"
          defaultValue={formValue}
          id={`setting-${key}`}
          className="sm:min-w-[240px]"
          disabled={isPending && savingKey === key}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleSave(key, (e.target as HTMLInputElement).value)
            }
          }}
        />
        <Button
          size="sm"
          variant="secondary"
          loading={isPending && savingKey === key}
          onClick={() => {
            const el = document.getElementById(`setting-${key}`) as HTMLInputElement | null
            if (el) handleSave(key, el.value)
          }}
        >
          Salvar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="error" message={error} onDismiss={() => setError(null)} />}

      {[...grouped, ...(uncategorized.length ? [{ group: 'geral' as SettingGroup, title: 'Outras', items: uncategorized }] : [])].map(
        ({ title, items }) => (
          <Card key={title}>
            <h2 className="mb-4 text-base font-semibold text-foreground">{title}</h2>
            <div className="divide-y divide-border">
              {items.map(row => {
                const meta = getSettingMeta(row.key)
                const saved = successKey === row.key

                return (
                  <div
                    key={row.key}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{meta.label}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {meta.description || row.description || ''}
                      </p>
                      {saved && (
                        <p className="mt-1 text-xs font-medium text-green-600 dark:text-green-400">
                          Salvo com sucesso.
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 sm:min-w-[200px]">
                      {renderField(row.key, row.value, meta.type)}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        ),
      )}
    </div>
  )
}
