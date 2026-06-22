'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Alert } from '@/components/ui/Alert'
import { updateEnrollmentStatusAction } from '@/server/actions/enrollments'
import { ENROLLMENT_STATUS_LABELS } from '@/types/domain'
import type { EnrollmentStatus } from '@/types/database'

const ADMIN_STATUS_OPTIONS: EnrollmentStatus[] = [
  'pending',
  'confirmed',
  'completed',
  'recovery',
  'cancelled',
  'rejected',
  'dropped',
]

const CLOSED_STATUSES: EnrollmentStatus[] = ['cancelled', 'completed', 'rejected', 'dropped']

interface EnrollmentActionsProps {
  enrollmentId: string
  currentStatus: EnrollmentStatus
  beneficiaryName: string
}

export function EnrollmentActions({
  enrollmentId,
  currentStatus,
  beneficiaryName,
}: EnrollmentActionsProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const options = ADMIN_STATUS_OPTIONS
    .filter(s => s !== currentStatus)
    .map(s => ({ value: s, label: ENROLLMENT_STATUS_LABELS[s] }))

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('enrollment_id', enrollmentId)

    startTransition(async () => {
      const result = await updateEnrollmentStatusAction(fd)
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
        size="xs"
        variant="ghost"
        className="h-7 shrink-0 px-2.5 text-xs font-medium"
        onClick={() => setOpen(true)}
      >
        {CLOSED_STATUSES.includes(currentStatus) ? 'Corrigir status' : 'Alterar status'}
      </Button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={CLOSED_STATUSES.includes(currentStatus) ? 'Corrigir status da inscrição' : 'Alterar status da inscrição'}
        description={
          CLOSED_STATUSES.includes(currentStatus)
            ? `${beneficiaryName} — inscrição encerrada; selecione o status correto.`
            : beneficiaryName
        }
        size="sm"
      >
        {error && <Alert variant="error" message={error} className="mb-4" />}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            name="status"
            label="Novo status"
            required
            placeholder="Selecione..."
            options={options}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={isPending}>
              Salvar
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
