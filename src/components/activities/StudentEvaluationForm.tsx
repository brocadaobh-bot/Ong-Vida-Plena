'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { saveActivityGradeAction } from '@/server/actions/activities'

interface ActivityItem {
  id: string
  title: string
  description: string | null
  max_score: number
  min_passing_score: number
}

interface GradeItem {
  activity_id: string
  score: number
  feedback: string | null
}

interface StudentEvaluationFormProps {
  enrollmentId: string
  activities: ActivityItem[]
  grades: GradeItem[]
}

export function StudentEvaluationForm({
  enrollmentId,
  activities,
  grades,
}: StudentEvaluationFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [successActivityId, setSuccessActivityId] = useState<string | null>(null)
  const [savingActivityId, setSavingActivityId] = useState<string | null>(null)

  const gradeByActivity = new Map(grades.map(g => [g.activity_id, g]))

  async function handleSubmit(activityId: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccessActivityId(null)

    const formData = new FormData(e.currentTarget)
    formData.set('activity_id', activityId)
    formData.set('enrollment_id', enrollmentId)

    setSavingActivityId(activityId)
    try {
      const result = await saveActivityGradeAction(formData)
      if (result.success) {
        setSuccessActivityId(activityId)
        router.refresh()
      } else {
        setError(result.error)
      }
    } finally {
      setSavingActivityId(null)
    }
  }

  if (activities.length === 0) {
    return (
      <Card>
        <p className="py-6 text-center text-sm text-muted-foreground">
          Cadastre atividades na turma antes de avaliar este aluno.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error" message={error} />}
      {successActivityId && (
        <Alert variant="success" message="Nota salva. O boletim foi atualizado." />
      )}

      {activities.map(activity => {
        const existing = gradeByActivity.get(activity.id)
        const isSaving = savingActivityId === activity.id

        return (
          <Card key={activity.id}>
            <form onSubmit={e => handleSubmit(activity.id, e)} className="space-y-4">
              <div>
                <h3 className="font-medium text-foreground">{activity.title}</h3>
                {activity.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{activity.description}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Nota máxima: {activity.max_score} · Mínima: {activity.min_passing_score}
                </p>
              </div>

              <Input
                name="score"
                type="number"
                step="0.01"
                min={0}
                max={activity.max_score}
                label="Nota"
                required
                defaultValue={existing?.score?.toString() ?? ''}
              />

              <Textarea
                name="feedback"
                label="Observações"
                rows={3}
                placeholder="Comentários sobre o trabalho do aluno..."
                defaultValue={existing?.feedback ?? ''}
              />

              <Button type="submit" size="sm" loading={isSaving}>
                {existing ? 'Atualizar nota' : 'Salvar nota'}
              </Button>
            </form>
          </Card>
        )
      })}
    </div>
  )
}
