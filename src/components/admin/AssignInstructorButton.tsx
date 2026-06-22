'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UserCog } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Alert } from '@/components/ui/Alert'
import { assignClassInstructorAction } from '@/server/actions/courses'

interface InstructorOption {
  id: string
  full_name: string
}

interface AssignInstructorButtonProps {
  classId: string
  className: string
  currentInstructorId?: string | null
  currentInstructorName?: string | null
  instructors: InstructorOption[]
  size?: 'sm' | 'md'
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function AssignInstructorButton({
  classId,
  className,
  currentInstructorId,
  currentInstructorName,
  instructors,
  size = 'sm',
  variant = 'ghost',
}: AssignInstructorButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const instructorOptions = [
    { value: '', label: 'Sem instrutor (definir depois)' },
    ...instructors.map(i => ({ value: i.id, label: i.full_name })),
  ]

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const raw = formData.get('instructor_id')
    const instructorId = raw && String(raw) !== '' ? String(raw) : null

    startTransition(async () => {
      const result = await assignClassInstructorAction(classId, instructorId)
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
        size={size}
        variant={variant}
        leftIcon={<UserCog className="h-3.5 w-3.5" />}
        onClick={() => {
          setError(null)
          setOpen(true)
        }}
      >
        {currentInstructorId ? 'Alterar instrutor' : 'Atribuir instrutor'}
      </Button>

      <Modal
        isOpen={open}
        onClose={() => {
          setOpen(false)
          setError(null)
        }}
        title="Atribuir instrutor"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Turma: <span className="font-medium text-foreground">{className}</span>
          </p>

          {currentInstructorName && (
            <p className="text-sm text-muted-foreground">
              Instrutor atual:{' '}
              <span className="font-medium text-foreground">{currentInstructorName}</span>
            </p>
          )}

          {error && <Alert variant="error" message={error} />}

          <Select
            name="instructor_id"
            label="Instrutor"
            options={instructorOptions}
            defaultValue={currentInstructorId ?? ''}
            hint="Escolha «Sem instrutor» para remover a atribuição desta turma."
          />

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
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
