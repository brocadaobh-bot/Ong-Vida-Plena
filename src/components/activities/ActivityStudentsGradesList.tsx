'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { saveActivityGradeAction } from '@/server/actions/activities'
import {
  getSessionPresence,
  canGradeWithoutRecoveryOverride,
  type SessionPresenceInfo,
} from '@/lib/attendance/session-presence'
import type { AttendanceStatus } from '@/types/database'
import { cn } from '@/lib/utils/cn'

interface StudentRow {
  enrollmentId: string
  fullName: string
  attendanceStatus: AttendanceStatus | null
}

interface GradeRow {
  score: number
  feedback: string | null
}

interface ActivityStudentsGradesListProps {
  activityId: string
  maxScore: number
  minPassingScore: number
  students: StudentRow[]
  gradesByEnrollment: Record<string, GradeRow | undefined>
  sessionLinked: boolean
}

function PresenceBadge({ presence }: { presence: SessionPresenceInfo }) {
  if (presence.wasPresent) {
    return (
      <Badge variant="success" size="sm" dot>
        <CheckCircle2 className="h-3 w-3" />
        Presente na aula
      </Badge>
    )
  }

  if (presence.status === 'absent') {
    return (
      <Badge variant="danger" size="sm" dot>
        <XCircle className="h-3 w-3" />
        Ausente na aula
      </Badge>
    )
  }

  return (
    <Badge variant="warning" size="sm" dot>
      <HelpCircle className="h-3 w-3" />
      {presence.label}
    </Badge>
  )
}

export function ActivityStudentsGradesList({
  activityId,
  maxScore,
  minPassingScore,
  students,
  gradesByEnrollment,
  sessionLinked,
}: ActivityStudentsGradesListProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)
  const [savingEnrollmentId, setSavingEnrollmentId] = useState<string | null>(null)
  const [recoveryAllowed, setRecoveryAllowed] = useState<Set<string>>(() => new Set())

  function allowRecovery(enrollmentId: string) {
    setRecoveryAllowed(prev => new Set(prev).add(enrollmentId))
  }

  async function handleSubmit(enrollmentId: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccessId(null)

    const formData = new FormData(e.currentTarget)
    formData.set('activity_id', activityId)
    formData.set('enrollment_id', enrollmentId)

    setSavingEnrollmentId(enrollmentId)
    try {
      const result = await saveActivityGradeAction(formData)
      if (result.success) {
        setSuccessId(enrollmentId)
        router.refresh()
      } else {
        setError(result.error)
      }
    } finally {
      setSavingEnrollmentId(null)
    }
  }

  if (students.length === 0) {
    return (
      <Card>
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nenhum aluno confirmado nesta turma.
        </p>
      </Card>
    )
  }

  const gradedCount = students.filter(s => gradesByEnrollment[s.enrollmentId]).length
  const presentCount = sessionLinked
    ? students.filter(s => getSessionPresence(s.attendanceStatus).wasPresent).length
    : null

  return (
    <div className="space-y-4">
      {error && <Alert variant="error" message={error} />}
      {successId && <Alert variant="success" message="Nota salva com sucesso." />}

      {sessionLinked && (
        <Alert
          variant="info"
          message="A presença exibida refere-se à aula vinculada a esta atividade. Alunos ausentes ou sem registro não devem ser avaliados normalmente — use a opção de recuperação quando aplicável."
        />
      )}

      <p className="text-sm text-muted-foreground">
        {gradedCount}/{students.length} aluno(s) já avaliado(s)
        {presentCount !== null && (
          <> · {presentCount}/{students.length} presente(s) na aula</>
        )}
        {' '}· Nota máxima: {maxScore} · Mínima: {minPassingScore}
      </p>

      <div className="space-y-3">
        {students.map(student => {
          const existing = gradesByEnrollment[student.enrollmentId]
          const presence = sessionLinked
            ? getSessionPresence(student.attendanceStatus)
            : { status: null, wasPresent: true, label: '—', canGradeByDefault: true }
          const recoveryOverride = recoveryAllowed.has(student.enrollmentId)
          const canGrade = canGradeWithoutRecoveryOverride(
            presence,
            Boolean(existing),
            recoveryOverride,
          )

          return (
            <Card
              key={student.enrollmentId}
              className={cn(
                'p-4',
                sessionLinked && !presence.wasPresent && !existing && 'border-amber-200 dark:border-amber-900/50',
              )}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-foreground">{student.fullName}</p>
                {sessionLinked && <PresenceBadge presence={presence} />}
              </div>

              {sessionLinked && !canGrade && (
                <div className="space-y-3">
                  <Alert
                    variant="warning"
                    message={
                      presence.status === 'absent'
                        ? 'Este aluno esteve ausente nesta aula. Normalmente não deve ser avaliado neste trabalho.'
                        : 'Não há registro de presença deste aluno nesta aula. Confirme a situação antes de avaliar.'
                    }
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => allowRecovery(student.enrollmentId)}
                  >
                    Avaliar mesmo assim (recuperação)
                  </Button>
                </div>
              )}

              {sessionLinked && canGrade && !presence.wasPresent && (
                <Alert
                  variant="warning"
                  message="Avaliação em modo recuperação — aluno não estava presente na aula vinculada."
                  className="mb-3"
                />
              )}

              {canGrade && (
                <form
                  onSubmit={e => handleSubmit(student.enrollmentId, e)}
                  className="grid gap-3 sm:grid-cols-[120px_1fr_auto] sm:items-end"
                >
                  <Input
                    name="score"
                    type="number"
                    step="0.01"
                    min={0}
                    max={maxScore}
                    label="Nota"
                    required
                    defaultValue={existing?.score?.toString() ?? ''}
                  />
                  <Textarea
                    name="feedback"
                    label="Observações"
                    rows={2}
                    placeholder="Comentários sobre o trabalho..."
                    defaultValue={existing?.feedback ?? ''}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    loading={savingEnrollmentId === student.enrollmentId}
                    className="sm:mb-0.5"
                  >
                    {existing ? 'Atualizar' : 'Salvar'}
                  </Button>
                </form>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
