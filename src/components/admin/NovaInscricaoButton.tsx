'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Alert } from '@/components/ui/Alert'
import { enrollBeneficiaryAction } from '@/server/actions/enrollments'
import { UserPlus } from 'lucide-react'

interface BeneficiaryOption { id: string; full_name: string; email: string }
interface ClassOption { id: string; label: string }

interface NovaInscricaoButtonProps {
  beneficiaries: BeneficiaryOption[]
  classes: ClassOption[]
  defaultClassId?: string
  defaultBeneficiaryId?: string
}

export function NovaInscricaoButton({
  beneficiaries,
  classes,
  defaultClassId,
  defaultBeneficiaryId,
}: NovaInscricaoButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await enrollBeneficiaryAction(fd)
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
      <Button leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setOpen(true)}>
        Nova Inscrição
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Inscrever usuário" size="md">
        {error && <Alert variant="error" message={error} className="mb-4" />}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            name="beneficiary_id"
            label="Usuário"
            required
            placeholder="Selecione..."
            defaultValue={defaultBeneficiaryId ?? ''}
            options={beneficiaries.map(b => ({
              value: b.id,
              label: `${b.full_name} (${b.email})`,
            }))}
          />
          <Select
            name="class_id"
            label="Turma"
            required
            placeholder="Selecione..."
            defaultValue={defaultClassId ?? ''}
            options={classes.map(c => ({ value: c.id, label: c.label }))}
          />
          <p className="text-xs text-muted-foreground">
            A inscrição será vinculada ao curso da turma escolhida. Se a aprovação manual estiver
            ativa nas configurações, o status inicial será pendente.
          </p>
          <div className="flex gap-3 border-t border-border pt-4">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={isPending}>
              Confirmar inscrição
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
