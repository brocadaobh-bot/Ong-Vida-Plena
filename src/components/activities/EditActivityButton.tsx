'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { updateClassActivityAction } from '@/server/actions/activities'
import { formatSessionLabel, type SessionRef } from '@/lib/activities/session-label'

interface ActivityItem {
  id: string
  title: string
  description: string | null
  max_score: number
  min_passing_score: number
  session_id: string | null
}

interface EditActivityButtonProps {
  activity: ActivityItem
  sessions: SessionRef[]
  linkOnly?: boolean
}

export function EditActivityButton({ activity, sessions, linkOnly = false }: EditActivityButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const sessionOptions = sessions.map(s => ({
    value: s.id,
    label: formatSessionLabel(s),
  }))

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set('activity_id', activity.id)

    startTransition(async () => {
      const result = await updateClassActivityAction(formData)
      if (result.success) {
        setOpen(false)
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <>
      <Button
        size="sm"
        variant={linkOnly ? 'secondary' : 'ghost'}
        leftIcon={linkOnly ? <Link2 className="h-4 w-4" /> : <Pencil className="h-3.5 w-3.5" />}
        onClick={() => {
          setError(null)
          setOpen(true)
        }}
        disabled={sessions.length === 0}
      >
        {linkOnly ? 'Vincular aula' : 'Editar'}
      </Button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={linkOnly ? 'Vincular aula à atividade' : 'Editar atividade'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant="error" message={error} />}

          <Select
            name="session_id"
            label="Aula vinculada"
            required
            options={sessionOptions}
            defaultValue={activity.session_id ?? sessionOptions[0]?.value ?? ''}
          />

          {!linkOnly && (
            <>
              <Input name="title" label="Título" required defaultValue={activity.title} />
              <Textarea
                name="description"
                label="Descrição"
                rows={2}
                defaultValue={activity.description ?? ''}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  name="max_score"
                  type="number"
                  step="0.01"
                  min={1}
                  label="Nota máxima"
                  defaultValue={activity.max_score.toString()}
                  required
                />
                <Input
                  name="min_passing_score"
                  type="number"
                  step="0.01"
                  min={0}
                  label="Nota mínima"
                  defaultValue={activity.min_passing_score.toString()}
                  required
                />
              </div>
            </>
          )}

          {linkOnly && (
            <>
              <input type="hidden" name="title" value={activity.title} />
              <input type="hidden" name="description" value={activity.description ?? ''} />
              <input type="hidden" name="max_score" value={activity.max_score} />
              <input type="hidden" name="min_passing_score" value={activity.min_passing_score} />
              <p className="text-sm text-muted-foreground">
                Atividade: <span className="font-medium text-foreground">{activity.title}</span>
              </p>
            </>
          )}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" loading={isPending}>
              {linkOnly ? 'Vincular' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
