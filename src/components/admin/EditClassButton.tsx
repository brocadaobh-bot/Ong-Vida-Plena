'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ClassForm, type ClassFormValues } from './ClassForm'
import { Pencil } from 'lucide-react'

interface CourseOption { id: string; title: string }
interface InstructorOption { id: string; full_name: string }

interface EditClassButtonProps {
  classData: ClassFormValues
  courses: CourseOption[]
  instructors: InstructorOption[]
}

export function EditClassButton({ classData, courses, instructors }: EditClassButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        leftIcon={<Pencil className="h-3.5 w-3.5" />}
        onClick={() => setOpen(true)}
      >
        Editar
      </Button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Editar turma" size="xl">
        <ClassForm
          courses={courses}
          instructors={instructors}
          classData={classData}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </>
  )
}
