'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { refreshClassReportCardsAction } from '@/server/actions/report-cards'

interface RefreshClassReportCardsButtonProps {
  classId: string
}

export function RefreshClassReportCardsButton({ classId }: RefreshClassReportCardsButtonProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    setError(null)
    setMessage(null)

    startTransition(async () => {
      const result = await refreshClassReportCardsAction(classId)
      if (result.success) {
        setMessage(
          result.data.updated > 0
            ? `Boletim de ${result.data.updated} aluno(s) atualizado(s).`
            : 'Nenhum aluno ativo para atualizar.',
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
        onClick={handleClick}
      >
        Atualizar boletins da turma
      </Button>
    </div>
  )
}
