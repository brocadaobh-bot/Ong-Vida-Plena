'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { dropOwnEnrollmentAction } from '@/server/actions/enrollments'
import type { EnrollmentStatus } from '@/types/database'

const DROPPABLE_STATUSES: EnrollmentStatus[] = [
  'pending',
  'confirmed',
  'waitlisted',
  'recovery',
]

interface DropEnrollmentButtonProps {
  enrollmentId: string
  courseTitle: string
  status: EnrollmentStatus
}

export function DropEnrollmentButton({
  enrollmentId,
  courseTitle,
  status,
}: DropEnrollmentButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!DROPPABLE_STATUSES.includes(status)) {
    return null
  }

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      const result = await dropOwnEnrollmentAction(enrollmentId)
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
        variant="ghost"
        className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
        onClick={() => {
          setError(null)
          setOpen(true)
        }}
      >
        Desistir do curso
      </Button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Desistir do curso"
        description={`Você sairá de «${courseTitle}». Esta ação não pode ser desfeita pelo painel.`}
        size="sm"
      >
        {error && <Alert variant="error" message={error} className="mb-4" />}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
            Continuar inscrito
          </Button>
          <Button type="button" variant="destructive" loading={isPending} onClick={handleConfirm}>
            Confirmar desistência
          </Button>
        </div>
      </Modal>
    </>
  )
}
