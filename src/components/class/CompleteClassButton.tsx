'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import {
  completeClassAction,
  fetchClassCompletionPreviewAction,
} from '@/server/actions/class-completion'
import type { ClassCompletionPreview } from '@/lib/classes/completion-eligibility'

interface CompleteClassButtonProps {
  classId: string
  classStatus: string
  size?: 'sm' | 'md'
  variant?: 'primary' | 'secondary' | 'destructive-outline' | 'ghost'
}

export function CompleteClassButton({
  classId,
  classStatus,
  size = 'md',
  variant = 'destructive-outline',
}: CompleteClassButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<ClassCompletionPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [loadingPreview, setLoadingPreview] = useState(false)

  if (['completed', 'cancelled'].includes(classStatus)) {
    return null
  }

  function handleOpen() {
    setError(null)
    setLoadingPreview(true)
    setOpen(true)

    startTransition(async () => {
      const result = await fetchClassCompletionPreviewAction(classId)
      setLoadingPreview(false)
      if (result.success) {
        setPreview(result.data)
      } else {
        setError(result.error)
      }
    })
  }

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      const result = await completeClassAction(classId)
      if (result.success) {
        setOpen(false)
        setPreview(null)
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <>
      <Button
        size={size}
        variant={variant}
        leftIcon={<CheckCircle2 className="h-4 w-4" />}
        onClick={handleOpen}
      >
        Encerrar turma
      </Button>

      <Modal
        isOpen={open}
        onClose={() => {
          setOpen(false)
          setPreview(null)
          setError(null)
        }}
        title="Encerrar turma"
        size="lg"
      >
        <div className="space-y-4">
          <Alert
            variant="error"
            title="Atenção — ação para toda a turma"
            message="Esta ação encerra a turma para TODOS os alunos de uma vez. A turma passará ao status Concluída. Alunos aprovados serão marcados como concluídos; reprovados ficarão em recuperação. Não use durante avaliações individuais — apenas ao final do curso."
          />

          <Alert
            variant="warning"
            message="Tem certeza? Revise a lista abaixo antes de confirmar. Salvar notas de um aluno não faz isso automaticamente."
          />

          {error && <Alert variant="error" message={error} />}

          {(loadingPreview || (isPending && !preview)) ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Carregando critérios...</p>
          ) : preview ? (
            <>
              <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
                <p className="font-semibold text-foreground">
                  {preview.courseTitle} — {preview.className}
                </p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li>• Presença mínima: {preview.minAttendancePercent}%</li>
                  <li>• Aulas consideradas: {preview.totalSessions}</li>
                  <li>• {preview.requirementsNote}</li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <span className="rounded-full bg-green-50 px-3 py-1 text-green-700 dark:bg-green-950/40 dark:text-green-300">
                  {preview.eligibleCount} aprovado{preview.eligibleCount !== 1 ? 's' : ''}
                </span>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                  {preview.ineligibleCount} não aprovado{preview.ineligibleCount !== 1 ? 's' : ''}
                </span>
              </div>

              {preview.students.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum aluno confirmado nesta turma.</p>
              ) : (
                <div className="max-h-64 overflow-auto rounded-lg border border-border">
                  <table className="data-table text-xs">
                    <thead>
                      <tr>
                        {['Aluno', 'Presença', 'Aulas', 'Atividades', 'Média', 'Aprovação'].map(h => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.students.map(student => (
                        <tr key={student.enrollmentId}>
                          <td className="cell-primary">{student.fullName}</td>
                          <td>{student.presenceRate}%</td>
                          <td>
                            {student.attendedSessions}/{student.totalSessions}
                          </td>
                          <td className="max-w-[140px] truncate">{student.activitiesSummary}</td>
                          <td>{student.averageScore ?? '—'}</td>
                          <td>
                            {student.eligible ? (
                              <span className="font-medium text-green-600 dark:text-green-400">Sim</span>
                            ) : (
                              <span className="text-muted-foreground">Não</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  loading={isPending}
                  onClick={handleConfirm}
                >
                  Sim, encerrar turma
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </Modal>
    </>
  )
}
