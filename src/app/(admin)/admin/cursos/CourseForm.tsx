'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { createCourseAction, updateCourseAction } from '@/server/actions/courses'
import { COURSE_CATEGORY_LABELS, COURSE_STATUS_LABELS } from '@/types/domain'
import type { CourseCategory, CourseStatus } from '@/types/database'

export interface CourseFormValues {
  id?: string
  title: string
  description?: string | null
  category: CourseCategory
  workload_hours?: number | null
  requirements?: string | null
  status: CourseStatus
}

interface CourseFormProps {
  course?: CourseFormValues
  onSuccess?: () => void
  onCancel?: () => void
  redirectOnCreate?: string
}

const categoryOptions = Object.entries(COURSE_CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const statusOptions = Object.entries(COURSE_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

function buildFormData(values: FormData): FormData {
  const fd = new FormData()
  for (const [key, val] of values.entries()) {
    if (val === '' || val === null) continue
    fd.set(key, val)
  }
  return fd
}

export function CourseForm({
  course,
  onSuccess,
  onCancel,
  redirectOnCreate,
}: CourseFormProps) {
  const router = useRouter()
  const isEditing = Boolean(course?.id)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const raw = new FormData(e.currentTarget)
    const formData = buildFormData(raw)

    startTransition(async () => {
      const result = isEditing && course?.id
        ? await updateCourseAction(course.id, formData)
        : await createCourseAction(formData)

      if (result.success) {
        onSuccess?.()
        if (!isEditing && redirectOnCreate) {
          router.push(redirectOnCreate)
          router.refresh()
        } else {
          router.refresh()
        }
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="error" message={error} className="mb-2" />}

      <Input
        name="title"
        label="Título do curso"
        required
        defaultValue={course?.title ?? ''}
        placeholder="Ex: Informática Básica"
      />

      <Select
        name="category"
        label="Categoria"
        required
        options={categoryOptions}
        defaultValue={course?.category ?? 'professional_training'}
      />

      <Textarea
        name="description"
        label="Descrição"
        defaultValue={course?.description ?? ''}
        placeholder="Descreva o conteúdo e objetivos do curso..."
        rows={4}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="workload_hours"
          type="number"
          min={1}
          label="Carga horária (h)"
          defaultValue={course?.workload_hours?.toString() ?? ''}
          placeholder="Ex: 40"
          hint="Opcional"
        />

        <Select
          name="status"
          label="Status"
          required
          options={statusOptions}
          defaultValue={course?.status ?? 'draft'}
          hint="Ao marcar como Ativo, uma turma com inscrições abertas é criada automaticamente."
        />
      </div>

      <Textarea
        name="requirements"
        label="Pré-requisitos"
        defaultValue={course?.requirements ?? ''}
        placeholder="Ex: Saber ler e escrever, ter mais de 16 anos..."
        rows={3}
        hint="Opcional — o que o aluno precisa para participar"
      />

      <div className="flex flex-wrap gap-3 border-t border-border pt-4">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" loading={isPending}>
          {isEditing ? 'Salvar alterações' : 'Criar curso'}
        </Button>
      </div>
    </form>
  )
}
