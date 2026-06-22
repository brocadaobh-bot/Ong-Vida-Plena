'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import {
  createClassActivityAction,
  deleteClassActivityAction,
} from '@/server/actions/activities'
import { EditActivityButton } from '@/components/activities/EditActivityButton'
import { formatSessionLabel, type SessionRef } from '@/lib/activities/session-label'

interface ActivityItem {
  id: string
  title: string
  description: string | null
  max_score: number
  min_passing_score: number
  session_id: string | null
  class_sessions: SessionRef | null
}

interface ClassActivitiesManagerProps {
  classId: string
  activities: ActivityItem[]
  sessions: SessionRef[]
}

export function ClassActivitiesManager({ classId, activities, sessions }: ClassActivitiesManagerProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)

  const sessionOptions = sessions.map(s => ({
    value: s.id,
    label: formatSessionLabel(s),
  }))

  const grouped = new Map<string, ActivityItem[]>()
  for (const activity of activities) {
    const key = activity.session_id ?? '__none__'
    const list = grouped.get(key) ?? []
    list.push(activity)
    grouped.set(key, list)
  }

  const sessionOrder = sessions.map(s => s.id)
  const groupKeys = [
    ...sessionOrder.filter(id => grouped.has(id)),
    ...(grouped.has('__none__') ? ['__none__'] : []),
  ]

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('class_id', classId)

    startTransition(async () => {
      const result = await createClassActivityAction(formData)
      if (result.success) {
        setShowForm(false)
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  function handleDelete(activityId: string) {
    if (!confirm('Excluir esta atividade? As notas associadas também serão removidas.')) return

    startTransition(async () => {
      const result = await deleteClassActivityAction(activityId)
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error" message={error} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Atividades da turma</h2>
          <p className="text-sm text-muted-foreground">
            Cada trabalho é vinculado a uma aula. Clique em Acessar para avaliar todos os alunos.
          </p>
        </div>
        <Button
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setShowForm(v => !v)}
          disabled={sessions.length === 0}
        >
          Nova atividade
        </Button>
      </div>

      {sessions.length === 0 && (
        <Alert
          variant="warning"
          message="Cadastre aulas na turma antes de criar atividades (Gerenciar avisos e informações → Aulas)."
        />
      )}

      {showForm && sessions.length > 0 && (
        <Card>
          <form onSubmit={handleCreate} className="space-y-4">
            <Select
              name="session_id"
              label="Aula vinculada"
              required
              options={sessionOptions}
              placeholder="Selecione a aula"
            />
            <Input name="title" label="Título" required placeholder="Ex: Trabalho de criação de currículo" />
            <Textarea
              name="description"
              label="Descrição"
              rows={2}
              placeholder="Instruções para o aluno (opcional)"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input name="max_score" type="number" step="0.01" min={1} label="Nota máxima" defaultValue="10" required />
              <Input name="min_passing_score" type="number" step="0.01" min={0} label="Nota mínima para aprovação" defaultValue="6" required />
            </div>
            <div className="flex gap-2">
              <Button type="submit" loading={isPending}>Cadastrar</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      {activities.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma atividade cadastrada. Crie a primeira atividade vinculada a uma aula.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupKeys.map(key => {
            const items = grouped.get(key) ?? []
            const session = key === '__none__' ? null : sessions.find(s => s.id === key) ?? items[0]?.class_sessions

            return (
              <div key={key}>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary-500" />
                  {formatSessionLabel(session)}
                </h3>
                <div className="space-y-3">
                  {items.map(activity => (
                    <Card key={activity.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">{activity.title}</p>
                        {activity.description && (
                          <p className="mt-1 text-sm text-muted-foreground">{activity.description}</p>
                        )}
                        <p className="mt-2 text-xs text-muted-foreground">
                          Nota máxima: {activity.max_score} · Mínima: {activity.min_passing_score}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        {!activity.session_id && (
                          <EditActivityButton
                            activity={activity}
                            sessions={sessions}
                            linkOnly
                          />
                        )}
                        <Link href={`/instrutor/turmas/${classId}/atividades/${activity.id}`}>
                          <Button size="sm" leftIcon={<ExternalLink className="h-4 w-4" />}>
                            Acessar
                          </Button>
                        </Link>
                        <EditActivityButton activity={activity} sessions={sessions} />
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<Trash2 className="h-4 w-4" />}
                          onClick={() => handleDelete(activity.id)}
                          disabled={isPending}
                        >
                          Excluir
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
