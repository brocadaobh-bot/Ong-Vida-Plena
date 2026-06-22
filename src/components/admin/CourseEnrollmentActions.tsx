'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { DoorOpen, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import {
  deleteCourseAction,
  reopenCourseEnrollmentsAction,
} from '@/server/actions/courses'

type ReopenCourseEnrollmentsButtonProps = {
  courseId: string
  courseTitle: string
  size?: 'sm' | 'md'
  variant?: 'primary' | 'secondary' | 'ghost'
  label?: string
}

export function ReopenCourseEnrollmentsButton({
  courseId,
  courseTitle,
  size = 'sm',
  variant = 'secondary',
  label = 'Abrir inscrições',
}: ReopenCourseEnrollmentsButtonProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    setError(null)
    setSuccess(null)

    const confirmed = window.confirm(
      `Abrir nova turma para "${courseTitle}"?\n\n` +
        'O curso continua o mesmo; será criada uma turma com inscrições abertas ' +
        'para novos beneficiários (sem precisar recadastrar o curso).',
    )
    if (!confirmed) return

    startTransition(async () => {
      const result = await reopenCourseEnrollmentsAction(courseId)
      if (result.success) {
        setSuccess(
          result.data.created
            ? 'Nova turma criada. Inscrições abertas para beneficiários.'
            : 'Já existe uma turma com inscrições abertas.',
        )
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Button
        type="button"
        size={size}
        variant={variant}
        loading={isPending}
        leftIcon={<DoorOpen className="h-3.5 w-3.5" />}
        onClick={handleClick}
      >
        {label}
      </Button>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
      {success && <span className="text-xs text-green-700 dark:text-green-400">{success}</span>}
    </div>
  )
}

type DeleteCourseButtonProps = {
  courseId: string
  courseTitle: string
}

export function DeleteCourseButton({ courseId, courseTitle }: DeleteCourseButtonProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    setError(null)

    const confirmed = window.confirm(
      `Excluir permanentemente o curso "${courseTitle}"?\n\n` +
        'Isso remove turmas, inscrições e certificados vinculados. ' +
        'Esta ação não pode ser desfeita.\n\n' +
        'O curso só voltará a aparecer se for criado novamente.',
    )
    if (!confirmed) return

    startTransition(async () => {
      const result = await deleteCourseAction(courseId)
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        loading={isPending}
        className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
        leftIcon={<Trash2 className="h-3.5 w-3.5" />}
        onClick={handleClick}
      >
        Excluir
      </Button>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
  )
}

type CourseReopenBannerProps = {
  courseId: string
  courseTitle: string
  courseStatus: string
}

export function CourseReopenBanner({
  courseId,
  courseTitle,
  courseStatus,
}: CourseReopenBannerProps) {
  return (
    <Alert variant="warning">
      <div className="space-y-3">
        <p className="text-sm leading-relaxed">
          O curso <strong>{courseTitle}</strong> não tem turma com inscrições abertas
          {courseStatus !== 'active' && ' (curso inativo ou arquivado)'}.
          Beneficiários não conseguem se inscrever até você abrir uma nova turma —{' '}
          <strong>sem precisar criar o curso de novo</strong>.
        </p>
        <ReopenCourseEnrollmentsButton
          courseId={courseId}
          courseTitle={courseTitle}
          variant="primary"
          label="Abrir nova turma / inscrições"
        />
      </div>
    </Alert>
  )
}
