'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { createClassAction, updateClassAction } from '@/server/actions/courses'
import { CLASS_STATUS_LABELS } from '@/types/domain'
import type { ClassStatus } from '@/types/database'

export interface ClassFormValues {
  id?: string
  course_id: string
  instructor_id?: string | null
  name: string
  start_date: string
  end_date?: string | null
  capacity: number
  location?: string | null
  schedule_description?: string | null
  status: ClassStatus
}

interface CourseOption { id: string; title: string }
interface InstructorOption { id: string; full_name: string }

interface ClassFormProps {
  courses: CourseOption[]
  instructors: InstructorOption[]
  classData?: ClassFormValues
  defaultCourseId?: string
  onSuccess?: () => void
  onCancel?: () => void
  redirectOnCreate?: string
}

const statusOptions = Object.entries(CLASS_STATUS_LABELS).map(([value, label]) => ({
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

export function ClassForm({
  courses,
  instructors,
  classData,
  defaultCourseId,
  onSuccess,
  onCancel,
  redirectOnCreate,
}: ClassFormProps) {
  const router = useRouter()
  const isEditing = Boolean(classData?.id)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const courseOptions = courses.map(c => ({ value: c.id, label: c.title }))
  const instructorOptions = [
    { value: '', label: 'Sem instrutor (definir depois)' },
    ...instructors.map(i => ({ value: i.id, label: i.full_name })),
  ]

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = buildFormData(new FormData(e.currentTarget))

    startTransition(async () => {
      const result = isEditing && classData?.id
        ? await updateClassAction(classData.id, formData)
        : await createClassAction(formData)

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

  const defaultStart = new Date()
  defaultStart.setDate(defaultStart.getDate() + 7)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="error" message={error} />}

      {isEditing && classData?.course_id && (
        <input type="hidden" name="course_id" value={classData.course_id} />
      )}

      <Select
        name="course_id"
        label="Curso"
        required
        options={courseOptions}
        defaultValue={classData?.course_id ?? defaultCourseId ?? courseOptions[0]?.value}
        disabled={isEditing}
        hint={isEditing ? 'O curso não pode ser alterado após criação.' : undefined}
      />

      <Input
        name="name"
        label="Nome da turma"
        required
        defaultValue={classData?.name ?? ''}
        placeholder="Ex: Turma Manhã — Junho/2026"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="start_date"
          type="date"
          label="Data de início"
          required
          defaultValue={classData?.start_date ?? defaultStart.toISOString().slice(0, 10)}
        />
        <Input
          name="end_date"
          type="date"
          label="Data de término"
          defaultValue={classData?.end_date ?? ''}
          hint="Opcional"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="capacity"
          type="number"
          min={1}
          max={500}
          label="Capacidade (vagas)"
          required
          defaultValue={classData?.capacity?.toString() ?? '30'}
        />
        <Select
          name="status"
          label="Status"
          required
          options={statusOptions}
          defaultValue={classData?.status ?? 'open'}
          hint="Use 'Inscrições abertas' para permitir matrículas."
        />
      </div>

      <Select
        name="instructor_id"
        label="Instrutor"
        options={instructorOptions}
        defaultValue={classData?.instructor_id ?? ''}
      />

      <Input
        name="location"
        label="Local"
        defaultValue={classData?.location ?? ''}
        placeholder="Ex: Sede da ONG — Sala 2"
      />

      <Textarea
        name="schedule_description"
        label="Horário / observações"
        defaultValue={classData?.schedule_description ?? ''}
        placeholder="Ex: Segundas e quartas, 14h às 17h"
        rows={2}
      />

      <div className="flex flex-wrap gap-3 border-t border-border pt-4">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" loading={isPending}>
          {isEditing ? 'Salvar turma' : 'Criar turma'}
        </Button>
      </div>
    </form>
  )
}
