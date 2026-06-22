'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Modal } from '@/components/ui/Modal'
import { reevaluateClassStudentsAction } from '@/server/actions/report-cards'

interface ReevaluateRecoveryButtonProps {
  classId: string
}

export function ReevaluateRecoveryButton({ classId }: ReevaluateRecoveryButtonProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleClick() {
    setError(null)
    setMessage(null)

    startTransition(async () => {
      const result = await reevaluateClassStudentsAction(classId)
      if (result.success) {
        setConfirmOpen(false)
        setMessage(
          result.data.approved > 0
            ? `${result.data.approved} aluno(s) aprovado(s) após reavaliação.`
            : 'Nenhum aluno elegível para aprovação no momento.',
        )
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-2">
      {error && <Alert variant="error" message={error} />}
      {message && <Alert variant="success" message={message} />}
      <Button
        variant="secondary"
        size="sm"
        leftIcon={<RefreshCw className="h-4 w-4" />}
        loading={isPending}
        onClick={() => setConfirmOpen(true)}
      >
        Reavaliar alunos em recuperação
      </Button>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Reavaliar alunos em recuperação?"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button loading={isPending} onClick={handleClick}>
              Sim, reavaliar e aprovar elegíveis
            </Button>
          </div>
        }
      >
        <Alert
          variant="warning"
          message="Alunos em recuperação que atingirem presença e notas mínimas serão aprovados individualmente. A turma permanece encerrada."
        />
      </Modal>
    </div>
  )
}
