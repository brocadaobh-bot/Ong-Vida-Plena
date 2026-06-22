'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { updateUserRoleAction, updateUserStatusAction, cancelProfileStudentEnrollmentsAction } from '@/server/actions/users'
import { useRouter } from 'next/navigation'
import type { UserRole, UserStatus } from '@/types/database'
import { ROLE_LABELS } from '@/types/domain'

interface UserActionsProps {
  user: { id: string; role: UserRole; status: UserStatus; full_name: string }
  currentUserId?: string
  isProtectedAdmin?: boolean
  studentEnrollmentCount?: number
}

export function UserActions({ user, currentUserId, isProtectedAdmin, studentEnrollmentCount = 0 }: UserActionsProps) {
  const router = useRouter()
  const [open, setOpen]   = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const roleOptions = Object.entries(ROLE_LABELS).map(([v, l]) => ({ value: v, label: l }))

  function handleRoleChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('user_id', user.id)

    startTransition(async () => {
      const result = await updateUserRoleAction(fd)
      if (result.success) {
        setOpen(false)
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  const isSelf = currentUserId === user.id

  function handleStatusToggle() {
    const newStatus: UserStatus = user.status === 'active' ? 'blocked' : 'active'
    setError(null)
    startTransition(async () => {
      const result = await updateUserStatusAction(user.id, newStatus)
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  function handleRemoveStudentEnrollments() {
    setError(null)

    const confirmed = window.confirm(
      `Remover ${user.full_name} de todas as turmas como aluno?\n\n` +
        'A conta continua como ' +
        `${ROLE_LABELS[user.role]}. Certificados já emitidos permanecem no histórico.`,
    )
    if (!confirmed) return

    startTransition(async () => {
      const result = await cancelProfileStudentEnrollmentsAction(user.id)
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  const showRemoveEnrollments =
    user.role !== 'beneficiary' && studentEnrollmentCount > 0

  if (isSelf) {
    return (
      <span className="text-xs text-muted-foreground" title="Por segurança, você não pode alterar seu próprio papel ou status">
        Sua conta
      </span>
    )
  }

  if (isProtectedAdmin) {
    return (
      <span
        className="text-xs font-medium text-amber-700 dark:text-amber-400"
        title="Conta protegida no servidor — não pode ser rebaixada ou bloqueada pelo painel"
      >
        Conta protegida
      </span>
    )
  }

  return (
    <>
      {error && !open && (
        <p className="text-xs text-red-600 dark:text-red-400 mb-1 max-w-[200px]">{error}</p>
      )}
      <div className="flex flex-wrap items-center gap-1">
        {showRemoveEnrollments && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRemoveStudentEnrollments}
            loading={isPending}
            className="text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40"
          >
            Remover inscrições ({studentEnrollmentCount})
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
          Editar papel
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleStatusToggle}
          loading={isPending}
          className={user.status === 'active'
            ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40'
            : 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/40'}
        >
          {user.status === 'active' ? 'Bloquear' : 'Ativar'}
        </Button>
      </div>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={`Editar ${user.full_name}`}
        size="sm"
      >
        {error && <Alert variant="error" message={error} className="mb-4" />}
        <form onSubmit={handleRoleChange} className="space-y-4">
          <input type="hidden" name="user_id" value={user.id} />
          <Select
            key={`${user.id}-${user.role}`}
            name="role"
            label="Papel"
            options={roleOptions}
            defaultValue={user.role}
            hint={
              user.role === 'beneficiary'
                ? 'Ao promover para admin, assistente ou instrutor, as inscrições como aluno serão canceladas automaticamente.'
                : undefined
            }
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
