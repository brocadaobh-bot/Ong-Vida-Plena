'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { removeEnrollmentFromCourseAction } from '@/server/actions/enrollments'
import type { EnrollmentStatus } from '@/types/database'

const REMOVABLE_STATUSES: EnrollmentStatus[] = [
  'pending',
  'confirmed',
  'waitlisted',
  'recovery',
]

interface RemoveFromCourseButtonProps {
  enrollmentId: string
  beneficiaryName: string
  currentStatus: EnrollmentStatus
}

export function RemoveFromCourseButton({
  enrollmentId,
  beneficiaryName,
  currentStatus,
}: RemoveFromCourseButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!REMOVABLE_STATUSES.includes(currentStatus)) {
    return null
  }

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      const result = await removeEnrollmentFromCourseAction(enrollmentId, reason || undefined)
      if (result.success) {
        setOpen(false)
        setReason('')
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <>
      <Button
        size="xs"
        variant="ghost"
        className="h-7 shrink-0 px-2.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
        onClick={() => {
          setError(null)
          setOpen(true)
        }}
      >
        Remover do curso
      </Button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Remover do curso"
        description={`${beneficiaryName} deixará de constar como inscrito nesta turma.`}
        size="sm"
      >
        {error && <Alert variant="error" message={error} className="mb-4" />}
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Motivo (opcional)</span>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={2}
              className="input-base w-full resize-none"
              placeholder="Ex.: desistência, mudança de turma..."
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
              Voltar
            </Button>
            <Button
              type="button"
              variant="destructive"
              loading={isPending}
              onClick={handleConfirm}
            >
              Confirmar remoção
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
