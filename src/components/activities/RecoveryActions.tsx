'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Modal } from '@/components/ui/Modal'
import {
  reopenRecoveryAction,
  approveStudentAfterRecoveryAction,
} from '@/server/actions/report-cards'

interface RecoveryActionsProps {
  enrollmentId: string
  enrollmentStatus: string
  canApprove: boolean
  classStatus?: string
}

export function RecoveryActions({
  enrollmentId,
  enrollmentStatus,
  canApprove,
  classStatus = 'open',
}: RecoveryActionsProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [confirmApprove, setConfirmApprove] = useState(false)
  const [confirmReopen, setConfirmReopen] = useState(false)

  const isRecovery = enrollmentStatus === 'recovery'
  const classIsActive = !['completed', 'cancelled'].includes(classStatus)

  if (!isRecovery && enrollmentStatus !== 'confirmed') {
    return null
  }

  function handleReopen() {
    setError(null)
    startTransition(async () => {
      const result = await reopenRecoveryAction(enrollmentId)
      if (result.success) {
        setConfirmReopen(false)
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  function handleApprove() {
    setError(null)
    startTransition(async () => {
      const result = await approveStudentAfterRecoveryAction(enrollmentId)
      if (result.success) {
        setConfirmApprove(false)
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-3">
      {error && <Alert variant="error" message={error} />}

      {classIsActive && enrollmentStatus === 'confirmed' && (
        <Alert
          variant="info"
          message="Salvar notas aqui apenas atualiza o boletim deste aluno. Isso não encerra a turma. Para finalizar a turma inteira (todos os alunos), use Encerrar turma na página da turma — somente ao fim do curso."
        />
      )}

      {isRecovery && (
        <Alert
          variant="warning"
          message="Aluno em recuperação. Após reavaliar as notas, você pode aprovar só este aluno. Isso não encerra a turma para os demais."
        />
      )}

      {isRecovery && (
        <Button
          variant="secondary"
          leftIcon={<RotateCcw className="h-4 w-4" />}
          loading={isPending}
          onClick={() => setConfirmReopen(true)}
        >
          Reabrir recuperação
        </Button>
      )}

      {isRecovery && canApprove && (
        <Button
          leftIcon={<CheckCircle2 className="h-4 w-4" />}
          loading={isPending}
          onClick={() => setConfirmApprove(true)}
        >
          Aprovar aluno (pós-recuperação)
        </Button>
      )}

      <Modal
        isOpen={confirmApprove}
        onClose={() => setConfirmApprove(false)}
        title="Aprovar aluno após recuperação?"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmApprove(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button loading={isPending} onClick={handleApprove}>
              Sim, aprovar este aluno
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Alert
            variant="info"
            message="Esta ação conclui apenas a inscrição deste aluno. A turma continua aberta para os demais participantes."
          />
          <p className="text-sm text-muted-foreground">
            Use somente quando o aluno já cumpriu presença e notas após a recuperação.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={confirmReopen}
        onClose={() => setConfirmReopen(false)}
        title="Reabrir recuperação?"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmReopen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button loading={isPending} onClick={handleReopen}>
              Sim, reabrir
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          O aluno voltará a status confirmado e poderá ser reavaliado nas atividades. A turma não será encerrada.
        </p>
      </Modal>
    </div>
  )
}
