'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { CourseForm, type CourseFormValues } from './CourseForm'
import { Pencil } from 'lucide-react'

interface EditCourseButtonProps {
  course: CourseFormValues
}

export function EditCourseButton({ course }: EditCourseButtonProps) {
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

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Editar curso"
        description={course.title}
        size="xl"
      >
        <CourseForm
          course={course}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </>
  )
}
